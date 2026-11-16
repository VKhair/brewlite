import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const env = process.env;
const required = [
  'LIGHTSAIL_API', 'LIGHTSAIL_WEB', 'LIGHTSAIL_DB', 'DATABASE_URL',
  'JWT_SECRET', 'VNPAY_TMN_CODE', 'VNPAY_HASH_SECRET', 'BREWLITE_RELEASE_SHA',
];
for (const name of required) {
  if (!env[name]) throw new Error(`Missing configuration: ${name}`);
}
const sha = env.BREWLITE_RELEASE_SHA;
if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid commit SHA.');
if (env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');

const temp = mkdtempSync(join(tmpdir(), 'brewlite-deploy-'));
const api = env.LIGHTSAIL_API;
const web = env.LIGHTSAIL_WEB;
const db = env.LIGHTSAIL_DB;

function aws(action, args, parseOutput = true) {
  const result = spawnSync('aws', ['lightsail', action, ...args, '--output', 'json', '--no-cli-pager'], {
    encoding: 'utf8',
    timeout: 180_000,
  });
  // AWS có thể đưa dữ liệu yêu cầu vào thông báo lỗi, nên chỉ ghi tên thao tác và mã thoát.
  if (result.status !== 0) throw new Error(`Lightsail ${action} failed (exit ${result.status ?? 'unavailable'}).`);
  if (!parseOutput || !result.stdout.trim()) return {};
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`Lightsail ${action} returned invalid JSON.`);
  }
}

function service(name) {
  const { containerServices } = aws('get-container-services', ['--service-name', name]);
  if (containerServices?.length !== 1) throw new Error(`Service not found: ${name}`);
  return containerServices[0];
}

function database() {
  const { relationalDatabase } = aws('get-relational-database', ['--relational-database-name', db]);
  if (relationalDatabase?.publiclyAccessible !== false || relationalDatabase.state !== 'available') {
    throw new Error('PostgreSQL must be private and available.');
  }
  const url = new URL(env.DATABASE_URL);
  if (url.hostname !== relationalDatabase.masterEndpoint?.address || url.searchParams.get('sslmode') !== 'verify-full') {
    throw new Error('DATABASE_URL must point to the Lightsail database and use sslmode=verify-full.');
  }
}

function pushImage(name, app, args = []) {
  const image = `brewlite-${app}:${sha}`;
  const result = spawnSync('docker', ['build', '--platform', 'linux/amd64', '-f', `apps/${app}/Dockerfile`,
    '-t', image, ...args, '.'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Docker build failed for ${app}.`);
  aws('push-container-image', ['--service-name', name, '--label', sha, '--image', image], false);
  const { containerImages = [] } = aws('get-container-images', ['--service-name', name]);
  const prefix = `:${name}.${sha}.`;
  const versions = containerImages
    .map(({ image }) => image)
    .filter((ref) => ref.startsWith(prefix))
    .map((ref) => Number(ref.slice(prefix.length)))
    .filter(Number.isInteger);
  const version = Math.max(...versions);
  if (version < 1) throw new Error(`No published image returned for ${app}.`);
  return prefix + version;
}

function endpoint(containerName, containerPort, path) {
  return { containerName, containerPort, healthCheck: { path, successCodes: '200', intervalSeconds: 10, timeoutSeconds: 5 } };
}

async function deploy(name, manifest) {
  const file = join(temp, name + '.json');
  writeFileSync(file, JSON.stringify({ serviceName: name, ...manifest }), { mode: 0o600 });
  const { containerService } = aws('create-container-service-deployment', ['--cli-input-json', 'file://' + file]);
  const version = containerService?.nextDeployment?.version ?? containerService?.currentDeployment?.version;
  if (!version) throw new Error(`Could not determine deployment version for ${name}.`);
  for (let attempt = 0; attempt < 48; attempt++) {
    const { deployments } = aws('get-container-service-deployments', ['--service-name', name]);
    const state = deployments?.find((deployment) => deployment.version === version)?.state;
    if (state === 'ACTIVE') {
      console.log(`${name} deployment ${version} active.`);
      return;
    }
    if (state === 'FAILED' || state === 'INACTIVE') throw new Error(`${name} deployment ${version}: ${state}.`);
    await setTimeout(10_000);
  }
  throw new Error(`${name} deployment ${version} timed out.`);
}

async function get(url, json = false) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (response?.ok) return json ? response.json() : response.body?.cancel();
    await setTimeout(5_000);
  }
  throw new Error(`Smoke check failed: ${url}`);
}

async function smoke(apiUrl, webUrl) {
  const health = await get(apiUrl + 'health', true);
  if (health.database !== 'ok') throw new Error('API health does not confirm the database connection.');
  await get(webUrl + 'menu');
  const products = await get(webUrl + 'api/backend/products', true);
  if (!Array.isArray(products) || products.length === 0) throw new Error('Web proxy returned an empty catalog.');
  database();
}

function baseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Expected a Lightsail HTTPS endpoint.');
  return url.origin + '/';
}

try {
  database();
  const previousApi = service(api);
  const previousWeb = service(web);
  if (previousApi.scale !== 1) throw new Error('Use a single API instance for release migrations.');
  const apiUrl = baseUrl(previousApi.url);
  const webUrl = baseUrl(previousWeb.url);
  const apiImage = pushImage(api, 'api');
  const webImage = pushImage(web, 'web', [
    '--build-arg', `API_INTERNAL_URL=http://${previousApi.privateDomainName}:3001`,
    '--build-arg', 'NEXT_PUBLIC_PAYMENT_MODE=vnpay',
  ]);

  const apiConfig = {
    image: apiImage,
    ports: { 3001: 'HTTP' },
    environment: {
      NODE_ENV: 'production',
      API_PORT: '3001',
      DATABASE_URL: env.DATABASE_URL,
      JWT_SECRET: env.JWT_SECRET,
      PAYMENT_MODE: 'vnpay',
      VNPAY_TMN_CODE: env.VNPAY_TMN_CODE,
      VNPAY_HASH_SECRET: env.VNPAY_HASH_SECRET,
      VNPAY_RETURN_URL: apiUrl + 'payments/vnpay/return',
      VNPAY_IPN_URL: apiUrl + 'payments/vnpay/ipn',
      VNPAY_FRONTEND_URL: new URL(webUrl).origin,
      BREWLITE_SEED_ON_START: 'false',
    },
  };
  const webConfig = { image: webImage, ports: { 3000: 'HTTP' } };
  const rollback = [
    [api, previousApi.currentDeployment],
    [web, previousWeb.currentDeployment],
  ];

  const snapshot = `brewlite-pre-${sha.slice(0, 12)}-${Date.now()}`;
  aws('create-relational-database-snapshot', [
    '--relational-database-name', db, '--relational-database-snapshot-name', snapshot,
  ]);
  let snapshotReady = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const { relationalDatabaseSnapshot } = aws('get-relational-database-snapshot', [
      '--relational-database-snapshot-name', snapshot,
    ]);
    if (relationalDatabaseSnapshot?.state === 'available') {
      snapshotReady = true;
      break;
    }
    if (relationalDatabaseSnapshot?.state === 'error') break;
    await setTimeout(5_000);
  }
  if (!snapshotReady) throw new Error('Pre-deploy database snapshot did not become available.');
  console.log(`Database snapshot ready: ${snapshot}`);

  // Tạo danh mục demo trong một lượt triển khai riêng khi phát hành lần đầu.
  const bootstrap = !previousApi.currentDeployment && env.BREWLITE_BOOTSTRAP_CATALOG === 'true';
  const attempted = new Set();
  try {
    attempted.add(api);
    if (bootstrap) {
      const seedConfig = { ...apiConfig, environment: { ...apiConfig.environment, BREWLITE_SEED_ON_START: 'true' } };
      await deploy(api, { containers: { api: seedConfig }, publicEndpoint: endpoint('api', 3001, '/health') });
    }
    await deploy(api, { containers: { api: apiConfig }, publicEndpoint: endpoint('api', 3001, '/health') });
    await get(apiUrl + 'health', true);
    attempted.add(web);
    await deploy(web, { containers: { web: webConfig }, publicEndpoint: endpoint('web', 3000, '/menu') });
    await smoke(apiUrl, webUrl);
    console.log(`Smoke passed for ${sha}: ${webUrl}menu and ${apiUrl}health.`);
  } catch (error) {
    const start = Date.now();
    const errors = [];
    for (const [name, previous] of rollback) {
      if (!attempted.has(name)) continue;
      if (!previous) {
        errors.push(`No previous deployment for ${name}; fix and redeploy.`);
        continue;
      }
      try {
        await deploy(name, { containers: previous.containers, publicEndpoint: previous.publicEndpoint });
      } catch (rollbackError) {
        errors.push(rollbackError.message);
      }
    }
    if (!errors.length && rollback.every(([, previous]) => previous)) {
      try { await smoke(apiUrl, webUrl); }
      catch (smokeError) { errors.push(smokeError.message); }
    }
    console.error(`Rollback elapsed: ${Math.round((Date.now() - start) / 1000)} s.`, ...errors);
    throw error;
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
