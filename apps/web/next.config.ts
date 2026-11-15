import type { NextConfig } from 'next';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// npm workspaces run Next from apps/web while shared local settings live at repo root.
const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const apiOrigin = process.env.API_INTERNAL_URL ??
  `http://localhost:${process.env.API_PORT ?? '3003'}`;

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  output: 'standalone',
  outputFileTracingRoot: resolve(process.cwd(), '../..'),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
