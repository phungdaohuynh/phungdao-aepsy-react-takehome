import type { NextConfig } from 'next';
import nextBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/ui', '@workspace/localization', '@workspace/api-client'],
};

export default withBundleAnalyzer(nextConfig);
