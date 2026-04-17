import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/ui', '@workspace/localization', '@workspace/api-client']
};

export default nextConfig;
