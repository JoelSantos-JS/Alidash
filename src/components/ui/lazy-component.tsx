'use client'

import { lazy, Suspense, ComponentType, ReactNode, useState, useEffect } from 'react'
import { Skeleton } from './skeleton'

interface LazyComponentProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

// Componente de loading otimizado para mobile
const MobileFallback = ({ className }: { className?: string }) => (
  <div className={`animate-pulse ${className || ''}`}>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2" />
  </div>
)

// HOC para lazy loading com fallback otimizado
export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc)
  
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <MobileFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Componente wrapper para lazy loading
export function LazyComponent({ children, fallback, className }: LazyComponentProps) {
  return (
    <Suspense fallback={fallback || <MobileFallback className={className} />}>
      {children}
    </Suspense>
  )
}

// Hook para lazy loading condicional baseado em viewport
export function useLazyLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '50px' }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return { isVisible, ref: setRef }
}

// Componente para lazy loading baseado em scroll
interface ScrollLazyProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
  threshold?: number
}

export function ScrollLazy({ children, fallback, className, threshold = 0.1 }: ScrollLazyProps) {
  const { isVisible, ref } = useLazyLoad(threshold)

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <MobileFallback />)}
    </div>
  )
}