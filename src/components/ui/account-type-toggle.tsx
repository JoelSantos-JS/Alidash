"use client"

import * as React from "react"
import { User, Building } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountTypeToggleProps {
  value: 'personal' | 'business'
  onValueChange: (value: 'personal' | 'business') => void
  className?: string
}

export function AccountTypeToggle({ value, onValueChange, className }: AccountTypeToggleProps) {
  return (
    <div className={cn(
      "flex items-center bg-muted rounded-lg p-1 border shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <button
        onClick={() => onValueChange('personal')}
        className={cn(
          "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 h-8 sm:h-9 relative",
          value === 'personal'
            ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
            : "text-primary hover:bg-primary/10 dark:hover:bg-primary/20 hover:scale-105"
        )}
      >
        <User className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline font-semibold">Pessoal</span>
        <span className="sm:hidden font-semibold">P</span>
      </button>
      <button
        onClick={() => onValueChange('business')}
        className={cn(
          "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 h-8 sm:h-9 relative",
          value === 'business'
            ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
            : "text-primary hover:bg-primary/10 dark:hover:bg-primary/20 hover:scale-105"
        )}
      >
        <Building className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline font-semibold">Empresarial</span>
        <span className="sm:hidden font-semibold">E</span>
      </button>
    </div>
  )
} 