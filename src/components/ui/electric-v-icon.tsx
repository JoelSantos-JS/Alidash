"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ElectricVIconProps {
  className?: string
}

export const ElectricVIcon = ({ className = "h-6 w-6" }: ElectricVIconProps) => (
  <div className="flex items-center justify-center">
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          @keyframes bolt-flash {
            0%, 100% { opacity: 0.4; stroke-width: 1.2; }
            50% { opacity: 1; stroke-width: 1.8; }
          }
          .bolt-1 { animation: bolt-flash 1.5s ease-in-out infinite; }
          .bolt-2 { animation: bolt-flash 1.5s ease-in-out 0.3s infinite; }
          .bolt-3 { animation: bolt-flash 1.5s ease-in-out 0.6s infinite; }
          .bolt-4 { animation: bolt-flash 1.5s ease-in-out 0.2s infinite; }
          .bolt-5 { animation: bolt-flash 1.5s ease-in-out 0.5s infinite; }
        `}</style>
      </defs>
      
      {/* V principal - versão outline mais visível */}
      <path 
        d="M4 5L16 27L28 5H23L16 19L9 5H4Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Raios animados mais visíveis */}
      <path className="bolt-1" d="M6 3L4 6L6.5 5.5L5 8"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path className="bolt-2" d="M8 10L6 13L8.5 12.5L7 15"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path className="bolt-3" d="M26 3L28 6L25.5 5.5L27 8"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path className="bolt-4" d="M24 10L26 13L23.5 12.5L25 15"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path className="bolt-5" d="M16 2L15 4.5L16.5 4L15.5 6.5"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);