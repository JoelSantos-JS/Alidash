import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Resolver problemas com módulos OpenTelemetry e Handlebars
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Ignorar módulos problemáticos no lado cliente
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/winston-transport': false,
        'handlebars': false,
      }
    }

    // Configurar externals para módulos Node.js
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        '@opentelemetry/winston-transport': 'commonjs @opentelemetry/winston-transport',
      })
    }

    return config
  },
}

export default nextConfig
