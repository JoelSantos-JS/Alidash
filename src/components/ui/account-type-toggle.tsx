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
      "flex items-center bg-muted rounded-lg p-1 border shadow-sm",
      className
    )}>
      <button
        onClick={() => onValueChange('personal')}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
          value === 'personal'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
        )}
      >
        <User className="h-4 w-4" />
        Pessoal
      </button>
      <button
        onClick={() => onValueChange('business')}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
          value === 'business'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
        )}
      >
        <Building className="h-4 w-4" />
        Empresarial
      </button>
    </div>
  )
} 