"use client"

import * as React from "react"
import { Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  // Componente desabilitado - sempre modo escuro
  return (
    <Button variant="outline" size="icon" disabled>
      <Moon className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Modo escuro ativo</span>
    </Button>
  )
}