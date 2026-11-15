import type {NextConfig} from 'next';
const nextConfig:NextConfig={async rewrites(){return [{source:'/api/backend/:path*',destination:`${process.env.API_SERVER_URL || 'http://localhost:3001'}/:path*`}];}};
export default nextConfig;
