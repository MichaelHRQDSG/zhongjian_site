import type { NextConfig } from 'next';

/**
 * 多环境并行：通过 NEXT_DIST_DIR=.next-<env> 隔离产物。
 * 子域方案不使用 basePath。
 *
 * 浏览器不可直连 127.0.0.1 后端；构建时把本机 API 根写入 rewrite，
 * 使同源 /api/*、/static/* 由 Next 转发到 ASSESSMENT_API_BASE_URL。
 */
const distDir = (process.env.NEXT_DIST_DIR || '.next').trim() || '.next';

function resolveRewriteApiOrigin(): string {
  const raw = [
    process.env.ASSESSMENT_API_BASE_URL,
    process.env.VITE_API_BASE_URL,
    process.env.MINI_API_BASE_URL,
  ]
    .map((v) => (v || '').trim())
    .find(Boolean);
  return (raw || '').replace(/\/$/, '');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  distDir,
  async rewrites() {
    const apiOrigin = resolveRewriteApiOrigin();
    if (!apiOrigin) return [];
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/static/:path*', destination: `${apiOrigin}/static/:path*` },
    ];
  },
};

export default nextConfig;
