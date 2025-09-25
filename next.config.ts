import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configurações para evitar problemas de chunks e cache
  generateBuildId: async () => {
    // Usar commit SHA do Vercel ou timestamp para builds únicos
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
  },
  // Headers de cache otimizados
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
  // Configuração experimental para melhor estabilidade
  experimental: {
    optimizeCss: false, // Evita problemas com CSS chunks
    esmExternals: 'loose', // Melhor compatibilidade com módulos
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
      child_process: false,
      module: false,
    }

    // Ignorar módulos problemáticos no lado cliente
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/winston-transport': false,
        'handlebars': false,
        'dotprompt': false,
        '@genkit-ai/core': false,
        'genkit': false,
      }

      // Adicionar configuração para ignorar require.extensions
      config.module = config.module || {}
      config.module.unknownContextCritical = false
      config.module.unknownContextRegExp = /^\.\/.*$/
      config.module.unknownContextRequest = '.'
    }

    // Configurar externals para módulos Node.js
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        '@opentelemetry/winston-transport': 'commonjs @opentelemetry/winston-transport',
        'handlebars': 'commonjs handlebars',
        'dotprompt': 'commonjs dotprompt',
      })
    }

    // Suprimir avisos específicos do webpack
    config.ignoreWarnings = [
      /require\.extensions is not supported by webpack/,
      /Critical dependency: the request of a dependency is an expression/,
    ]

    return config
  },
}

export default nextConfig
