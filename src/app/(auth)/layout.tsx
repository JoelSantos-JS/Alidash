'use client';

import React, { useState, useEffect } from 'react';
import { BlackHoleBackground } from '@/components/ui/black-hole-background';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [animationEnabled, setAnimationEnabled] = useState(true);
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [isMounted, setIsMounted] = useState(false);

    // Evitar problemas de hidratação
    useEffect(() => {
        setIsMounted(true);
        
        // Detectar preferência do usuário por animações reduzidas
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            setAnimationEnabled(false);
        }
    }, []);

    return (
        <div className="min-h-screen relative dark">
            <BlackHoleBackground 
                enableAnimation={isMounted ? animationEnabled : false} 
                quality={quality}
            />
            
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}