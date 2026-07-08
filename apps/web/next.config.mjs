import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * Media (`/media/...`) is served by the API. In a proxied deploy it stays same-origin
 * (a relative path) and needs no remote pattern; in local/dev the browser base is an
 * absolute API origin, so allow that host for the next/image optimizer.
 */
function mediaRemotePatterns() {
  const origins = [process.env.NEXT_PUBLIC_API_BASE_URL, process.env.API_INTERNAL_BASE_URL, 'http://localhost:3001'];
  const patterns = [];
  const seen = new Set();
  for (const raw of origins) {
    if (!raw || raw.startsWith('/')) continue;
    try {
      const { protocol, hostname, port } = new URL(raw);
      const key = `${protocol}//${hostname}:${port}`;
      if (seen.has(key)) continue;
      seen.add(key);
      patterns.push({ protocol: protocol.replace(':', ''), hostname, ...(port ? { port } : {}), pathname: '/media/**' });
    } catch {
      /* ignore malformed origins */
    }
  }
  return patterns;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: mediaRemotePatterns(),
  },
  // Standalone output for containerized deployment on the owner's server (plan step 20).
  output: 'standalone',
  // The Sourcing & Logistics page was removed; its incoterms content lives at /incoterms.
  // Permanent redirects preserve inbound links and SEO equity.
  async redirects() {
    return [
      { source: '/sourcing', destination: '/incoterms', permanent: true },
      { source: '/:locale(en|ru|uz)/sourcing', destination: '/:locale/incoterms', permanent: true },
    ];
  },
  // Same-origin proxy: browser calls /api and /media are forwarded to the API so the site
  // works via any host (public IP or tunnel) with no CORS. SSR calls the API directly.
  async rewrites() {
    const api = process.env.API_INTERNAL_BASE_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:3001';
    return [
      { source: '/api/:path*', destination: `${api}/api/:path*` },
      { source: '/media/:path*', destination: `${api}/media/:path*` },
    ];
  },
  transpilePackages: ['@altan/shared', 'antd', '@ant-design/icons', '@ant-design/nextjs-registry', '@ant-design/cssinjs'],
  experimental: {
    // antd v5 + nextjs-registry need these optimized for SSR style extraction.
    optimizePackageImports: ['antd', '@ant-design/icons', 'lucide-react'],
  },
};

export default withNextIntl(nextConfig);
