/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // enables minimal Docker image via .next/standalone
  images: {
    domains: ['api.placeholder.com', 'images.unsplash.com'],
    unoptimized: false,
  },
  async redirects() {
    return [
      { source: '/platform/ai-genie',          destination: '/platform/ai-website-builder', permanent: true },
      { source: '/platform/ai-genie-assistant', destination: '/platform/ai-website-builder', permanent: true },
      { source: '/platform/website-builder',    destination: '/platform/ai-website-builder', permanent: true },
      { source: '/platform/offers',             destination: '/platform/offers-payments',    permanent: true },
      { source: '/platform/industry-simulator', destination: '/platform/ai-website-builder', permanent: true },
      { source: '/platform/skillgraph-engine',  destination: '/platform/ai-website-builder', permanent: true },
      { source: '/platform/peer-mentor-matching', destination: '/platform/offers-payments',  permanent: true },
      { source: '/platform/content-co-creation',  destination: '/platform/content-studio',   permanent: true },
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