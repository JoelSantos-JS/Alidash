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
  const birdColor = isDark ? "#ffffff" : "#1a1a1a"
  const birdStroke = isDark ? "#e5e5e5" : "#000000"
  const birdDetail = isDark ? "#f0f0f0" : "#2a2a2a"
  const birdDetail2 = isDark ? "#d0d0d0" : "#333333"
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
          rx="20"
          ry="5"
          fill={shadowColor}
        />
        
        {/* Corpo principal do pássaro */}
        <ellipse
          cx="50"
          cy="60"
          rx="25"
          ry="20"
          fill={birdColor}
          stroke={birdStroke}
          strokeWidth="2"
        />
        
        {/* Cabeça */}
        <circle
          cx="50"
          cy="35"
          r="15"
          fill={birdColor}
          stroke={birdStroke}
          strokeWidth="2"
        />
        
        {/* Olhos expressivos */}
        <circle cx="45" cy="32" r="4" fill={isDark ? "#1a1a1a" : "white"} stroke={birdStroke} strokeWidth="1" />
        <circle cx="55" cy="32" r="4" fill={isDark ? "#1a1a1a" : "white"} stroke={birdStroke} strokeWidth="1" />
        <circle cx="45" cy="32" r="1.5" fill={isDark ? "white" : "#000"} />
        <circle cx="55" cy="32" r="1.5" fill={isDark ? "white" : "#000"} />
        
        {/* Brilho nos olhos */}
        <circle cx="44" cy="31" r="0.8" fill={isDark ? "#333" : "white"} />
        <circle cx="54" cy="31" r="0.8" fill={isDark ? "#333" : "white"} />
        
        {/* Bico laranja brilhante */}
        <path
          d="M 50 38 L 45 42 L 55 42 Z"
          fill="#ff6b35"
          stroke="#e55a2b"
          strokeWidth="1"
        />
        <path
          d="M 50 38 L 47 40 L 53 40 Z"
          fill="#ff8c42"
        />
        
        {/* Asas abertas em voo */}
        <ellipse
          cx="25"
          cy="50"
          rx="12"
          ry="8"
          fill={birdColor}
          stroke={birdStroke}
          strokeWidth="2"
          transform="rotate(-15 25 50)"
        />
        <ellipse
          cx="75"
          cy="50"
          rx="12"
          ry="8"
          fill={birdColor}
          stroke={birdStroke}
          strokeWidth="2"
          transform="rotate(15 75 50)"
        />
        
        {/* Detalhes das asas */}
        <ellipse
          cx="22"
          cy="48"
          rx="6"
          ry="4"
          fill={birdDetail}
          transform="rotate(-15 22 48)"
        />
        <ellipse
          cx="78"
          cy="48"
          rx="6"
          ry="4"
          fill={birdDetail}
          transform="rotate(15 78 48)"
        />
        
        {/* Cauda arredondada */}
        <path
          d="M 70 65 Q 85 60 80 75 Q 75 70 70 65"
          fill={birdColor}
          stroke={birdStroke}
          strokeWidth="2"
        />
        
        {/* Topete na cabeça */}
        <ellipse
          cx="50"
          cy="25"
          rx="3"
          ry="2"
          fill={birdDetail}
        />
        <ellipse
          cx="50"
          cy="23"
          rx="2"
          ry="1"
          fill={birdDetail2}
        />
        
        {/* Patas pequenas */}
        <line x1="45" y1="80" x2="45" y2="85" stroke={birdStroke} strokeWidth="2" />
        <line x1="55" y1="80" x2="55" y2="85" stroke={birdStroke} strokeWidth="2" />
        <line x1="42" y1="85" x2="48" y2="85" stroke={birdStroke} strokeWidth="2" />
        <line x1="52" y1="85" x2="58" y2="85" stroke={birdStroke} strokeWidth="2" />
        
        {/* Textura das penas (pontos sutis) */}
        <circle cx="35" cy="55" r="0.5" fill={birdDetail2} />
        <circle cx="65" cy="55" r="0.5" fill={birdDetail2} />
        <circle cx="40" cy="65" r="0.5" fill={birdDetail2} />
        <circle cx="60" cy="65" r="0.5" fill={birdDetail2} />
      </svg>
    </div>
  )
} 