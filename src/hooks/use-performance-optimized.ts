'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Hook para debounce de operações custosas
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para throttle de eventos de scroll/resize
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

// Hook para operações DOM em lote (reduz reflow)
export function useBatchedDOMUpdates() {
  const updates = useRef<(() => void)[]>([])
  const rafId = useRef<number>()

  const batchUpdate = useCallback((update: () => void) => {
    updates.current.push(update)
    
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        // Executar todas as atualizações em um único frame
        updates.current.forEach(update => update())
        updates.current = []
        rafId.current = undefined
      })
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return batchUpdate
}

// Hook para lazy loading baseado em Intersection Observer
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [ref, setRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, options])

  return { isIntersecting, ref: setRef }
}

// Hook para otimizar animações
export function useOptimizedAnimation() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return {
    prefersReducedMotion,
    animationDuration: prefersReducedMotion ? 0 : undefined,
    shouldAnimate: !prefersReducedMotion,
  }
}

// Hook para detectar conexão lenta
export function useNetworkStatus() {
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const [saveData, setSaveData] = useState(false)

  useEffect(() => {
    // @ts-ignore - navigator.connection pode não estar disponível
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (connection) {
      const updateConnectionStatus = () => {
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.downlink < 1.5
        )
        setSaveData(connection.saveData || false)
      }

      updateConnectionStatus()
      connection.addEventListener('change', updateConnectionStatus)
      
      return () => {
        connection.removeEventListener('change', updateConnectionStatus)
      }
    }
  }, [])

  return { isSlowConnection, saveData }
}

// Hook para otimizar imagens baseado na conexão
export function useOptimizedImageLoading() {
  const { isSlowConnection, saveData } = useNetworkStatus()
  
  const getOptimizedImageProps = useCallback((src: string, alt: string) => {
    const quality = isSlowConnection || saveData ? 50 : 80
    const format = isSlowConnection || saveData ? 'webp' : 'avif'
    
    return {
      src,
      alt,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      style: {
        contentVisibility: 'auto',
        containIntrinsicSize: '300px 200px',
      },
      quality,
      format,
    }
  }, [isSlowConnection, saveData])

  return { getOptimizedImageProps, isSlowConnection, saveData }
}