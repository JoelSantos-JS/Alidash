"use client"

import * as React from "react"
import { User, Building, Home, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountTypeToggleProps {
  value: 'personal' | 'business'
  onValueChange: (value: 'personal' | 'business') => void
  className?: string
}

export function AccountTypeToggle({ value, onValueChange, className }: AccountTypeToggleProps) {
  return (
    <div className={cn(
      "flex items-center bg-muted/50 dark:bg-muted/30 rounded-xl p-1 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm",
      className
    )}>
      <button
        onClick={() => onValueChange('personal')}
        className={cn(
          "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 h-9 sm:h-10 relative overflow-hidden group",
          value === 'personal'
            ? "bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 transform scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-background/80 hover:scale-105 active:scale-95"
        )}
      >
        {/* Background glow effect for active state */}
        {value === 'personal' && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 animate-pulse" />
        )}
        
        {/* Icon with better styling */}
        <div className={cn(
          "relative z-10 flex items-center justify-center",
          value === 'personal' 
            ? "text-white" 
            : "text-muted-foreground group-hover:text-foreground"
        )}>
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        
        {/* Text with better visibility */}
        <span className={cn(
          "relative z-10 font-semibold",
          value === 'personal' 
            ? "text-white" 
            : "text-muted-foreground group-hover:text-foreground"
        )}>
          <span className="hidden sm:inline">Pessoal</span>
          <span className="sm:hidden">P</span>
        </span>
        
        {/* Hover effect */}
        {value !== 'personal' && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        )}
      </button>
      
      <button
        onClick={() => onValueChange('business')}
        className={cn(
          "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 h-9 sm:h-10 relative overflow-hidden group",
          value === 'business'
            ? "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-background/80 hover:scale-105 active:scale-95"
        )}
      >
        {/* Background glow effect for active state */}
        {value === 'business' && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
        )}
        
        {/* Icon with better styling */}
        <div className={cn(
          "relative z-10 flex items-center justify-center",
          value === 'business' 
            ? "text-white" 
            : "text-muted-foreground group-hover:text-foreground"
        )}>
          <Building className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        
        {/* Text with better visibility */}
        <span className={cn(
          "relative z-10 font-semibold",
          value === 'business' 
            ? "text-white" 
            : "text-muted-foreground group-hover:text-foreground"
        )}>
          <span className="hidden sm:inline">Empresarial</span>
          <span className="sm:hidden">E</span>
        </span>
        
        {/* Hover effect */}
        {value !== 'business' && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        )}
      </button>
    </div>
  )
} 