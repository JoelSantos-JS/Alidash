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
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/icon-:size*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, immutable',
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
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ]
  },
  // Configuração experimental para melhor estabilidade
  experimental: {
    optimizeCss: true, // Habilitar otimização CSS
    webpackBuildWorker: true, // Melhorar performance do build
  },
  
  // Configurações para produção
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Pacotes externos para server components
  serverExternalPackages: ['@opentelemetry/winston-transport', 'handlebars'],
  
  // Otimizações de performance
  compress: true,
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
    // Otimizações de performance
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxSize: 244000, // Limitar tamanho dos chunks
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'recharts',
            chunks: 'async',
            priority: 20,
            enforce: true,
          },
          dateFns: {
            test: /[\\/]node_modules[\\/]date-fns[\\/]/,
            name: 'date-fns',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
        },
      },
      // Configurações para evitar problemas de chunks
      runtimeChunk: {
        name: 'runtime',
      },
    };

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

    // Configurações para melhor estabilidade de chunks
    config.output = {
      ...config.output,
      crossOriginLoading: 'anonymous',
      chunkLoadingGlobal: 'webpackChunkLoad',
    }

    // Configurar retry para chunks falhados
    if (!isServer) {
      config.output.publicPath = '/_next/'
    }

    return config
  },
}

export default nextConfig
