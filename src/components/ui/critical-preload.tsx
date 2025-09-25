'use client'

import { useEffect } from 'react'

interface CriticalPreloadProps {
  fonts?: string[]
  scripts?: string[]
  styles?: string[]
  images?: string[]
}

export function CriticalPreload({ 
  fonts = [], 
  scripts = [], 
  styles = [], 
  images = [] 
}: CriticalPreloadProps) {
  useEffect(() => {
    // Preload fonts críticas
    fonts.forEach(font => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = font
      document.head.appendChild(link)
    })

    // Preload scripts críticos
    scripts.forEach(script => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = script
      document.head.appendChild(link)
    })

    // Preload estilos críticos
    styles.forEach(style => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = style
      document.head.appendChild(link)
    })

    // Preload imagens críticas
    images.forEach(image => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = image
      document.head.appendChild(link)
    })
  }, [fonts, scripts, styles, images])

  return null
}

// Hook para preload condicional baseado em conexão
export function useNetworkAwarePreload() {
  useEffect(() => {
    // @ts-ignore - navigator.connection pode não estar disponível
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (connection) {
      const { effectiveType, saveData } = connection
      
      // Não fazer preload em conexões lentas ou modo economia de dados
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        return
      }
    }

    // Preload recursos críticos apenas em conexões boas
    const criticalResources = [
      '/_next/static/css/app/layout.css',
      '/_next/static/chunks/main.js',
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = resource
      document.head.appendChild(link)
    })
  }, [])
}

// Componente para DNS prefetch
export function DNSPrefetch({ domains }: { domains: string[] }) {
  useEffect(() => {
    domains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = `//${domain}`
      document.head.appendChild(link)
    })
  }, [domains])

  return null
}