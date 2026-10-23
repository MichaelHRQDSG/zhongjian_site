import type { NextConfig } from 'next';

/**
 * 多环境并行：通过 NEXT_DIST_DIR=.next-<env> 隔离产物。
 * 子域方案不使用 basePath。
 */
const distDir = (process.env.NEXT_DIST_DIR || '.next').trim() || '.next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  distDir,
};

export default nextConfig;
