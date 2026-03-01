/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Desativar source maps em produção para reduzir uso de RAM no build
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src')
    // Reduzir uso de memória no build (Render free = 512MB)
    config.optimization = {
      ...config.optimization,
      minimize: true,
    }
    return config
  },
}

module.exports = nextConfig
