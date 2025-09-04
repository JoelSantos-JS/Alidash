"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, size = "md" }: LogoProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  }

  // Cores baseadas no tema
  const spiderColor = isDark ? "#ffffff" : "#1a1a1a"
  const spiderStroke = isDark ? "#e5e5e5" : "#000000"
  const spiderDetail = isDark ? "#f0f0f0" : "#2a2a2a"
  const spiderAccent = isDark ? "#ff6b35" : "#e55a2b"
  const shadowColor = isDark ? "#ffffff20" : "#00000020"

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className={sizeClasses[size]}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sombra suave */}
        <ellipse
          cx="52"
          cy="85"
          rx="18"
          ry="4"
          fill={shadowColor}
        />
        
        {/* Abdômen da aranha */}
        <ellipse
          cx="50"
          cy="65"
          rx="18"
          ry="12"
          fill={spiderColor}
          stroke={spiderStroke}
          strokeWidth="2"
        />
        
        {/* Cefalotórax (cabeça/tórax) */}
        <ellipse
          cx="50"
          cy="40"
          rx="12"
          ry="10"
          fill={spiderColor}
          stroke={spiderStroke}
          strokeWidth="2"
        />
        
        {/* Olhos da aranha (8 olhos pequenos) */}
        <circle cx="46" cy="35" r="1.5" fill={spiderAccent} />
        <circle cx="54" cy="35" r="1.5" fill={spiderAccent} />
        <circle cx="44" cy="38" r="1" fill={spiderDetail} />
        <circle cx="56" cy="38" r="1" fill={spiderDetail} />
        <circle cx="47" cy="32" r="0.8" fill={spiderDetail} />
        <circle cx="53" cy="32" r="0.8" fill={spiderDetail} />
        <circle cx="49" cy="30" r="0.6" fill={spiderDetail} />
        <circle cx="51" cy="30" r="0.6" fill={spiderDetail} />
        
        {/* Quelíceras (mandíbulas) */}
        <ellipse
          cx="48"
          cy="42"
          rx="2"
          ry="1"
          fill={spiderAccent}
        />
        <ellipse
          cx="52"
          cy="42"
          rx="2"
          ry="1"
          fill={spiderAccent}
        />
        
        {/* Pernas esquerdas */}
        {/* Perna 1 (frente esquerda) */}
        <path
          d="M 38 38 Q 25 35 20 45 Q 18 50 22 52"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Perna 2 */}
        <path
          d="M 35 45 Q 18 42 12 55 Q 10 62 15 65"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Perna 3 */}
        <path
          d="M 35 55 Q 18 58 12 70 Q 10 77 15 80"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Perna 4 (traseira esquerda) */}
        <path
          d="M 40 65 Q 25 68 20 78 Q 18 85 22 87"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        
        {/* Pernas direitas */}
        {/* Perna 1 (frente direita) */}
        <path
          d="M 62 38 Q 75 35 80 45 Q 82 50 78 52"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Perna 2 */}
        <path
          d="M 65 45 Q 82 42 88 55 Q 90 62 85 65"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Perna 3 */}
        <path
          d="M 65 55 Q 82 58 88 70 Q 90 77 85 80"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Perna 4 (traseira direita) */}
        <path
          d="M 60 65 Q 75 68 80 78 Q 82 85 78 87"
          stroke={spiderStroke}
          strokeWidth="2.5"
          fill="none"
        />
        
        {/* Padrão no abdômen */}
        <ellipse
          cx="50"
          cy="60"
          rx="8"
          ry="5"
          fill={spiderDetail}
          opacity="0.6"
        />
        <path
          d="M 45 65 L 50 58 L 55 65 L 50 70 Z"
          fill={spiderAccent}
          opacity="0.8"
        />
        
        {/* Detalhes nas articulações das pernas */}
        <circle cx="22" cy="52" r="1.5" fill={spiderAccent} />
        <circle cx="78" cy="52" r="1.5" fill={spiderAccent} />
        <circle cx="15" cy="65" r="1.5" fill={spiderAccent} />
        <circle cx="85" cy="65" r="1.5" fill={spiderAccent} />
        <circle cx="15" cy="80" r="1.5" fill={spiderAccent} />
        <circle cx="85" cy="80" r="1.5" fill={spiderAccent} />
        <circle cx="22" cy="87" r="1.5" fill={spiderAccent} />
        <circle cx="78" cy="87" r="1.5" fill={spiderAccent} />
      </svg>
    </div>
  )
}