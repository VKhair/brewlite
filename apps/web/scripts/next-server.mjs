import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(scriptDir, '../../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const mode = process.argv[2] || 'dev';
const port = process.env.WEB_PORT || '3002';
const nextCli = fileURLToPath(import.meta.resolve('next/dist/bin/next'));
const child = spawn(process.execPath, [nextCli, mode, '--hostname', '0.0.0.0', '--port', port], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
