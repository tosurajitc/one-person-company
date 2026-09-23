/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // enables minimal Docker image via .next/standalone
  // Raise the proxy socket timeout for long-running AI agent calls (Claude Sonnet
  // can take 60-120 s on large JSON payloads).  Without this Next.js drops the
  // upstream connection after ~30 s and the browser receives a 500 ECONNRESET
  // even though FastAPI returned 200.
  experimental: {
    proxyTimeout: 180_000,   // 3 minutes in ms
  },
  httpAgentOptions: {
    keepAlive: true,
  },
  images: {
    domains: ['api.placeholder.com', 'images.unsplash.com'],
    unoptimized: false,
  },
  async redirects() {
    return [
      { source: '/platform/ai-genie-assistant', destination: '/platform/ai-genie',           permanent: false },
      { source: '/platform/website-builder',    destination: '/platform/ai-website-builder', permanent: false },
      { source: '/platform/offers',             destination: '/platform/offers-payments',    permanent: false },
      { source: '/platform/industry-simulator', destination: '/platform/ai-website-builder', permanent: false },
      { source: '/platform/skillgraph-engine',  destination: '/platform/ai-website-builder', permanent: false },
      { source: '/platform/peer-mentor-matching', destination: '/platform/offers-payments',  permanent: false },
      { source: '/platform/content-co-creation',  destination: '/platform/ai-genie',          permanent: false },
      { source: '/platform/content-studio',        destination: '/platform/ai-genie',          permanent: false },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig