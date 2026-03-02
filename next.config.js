/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Aumentar limite do body para o endpoint de ingest (imagens base64)
  experimental: {
    serverActions: {
      bodySizeLimit: '32mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src')
    config.optimization = { ...config.optimization, minimize: true }
    return config
  },
}

module.exports = nextConfig
