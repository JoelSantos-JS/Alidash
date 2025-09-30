'use client';

import React, { useState, useEffect } from 'react';
import { BlackHoleBackground } from '@/components/ui/black-hole-background';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [animationEnabled, setAnimationEnabled] = useState(true);
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [showSettings, setShowSettings] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Evitar problemas de hidratação
    useEffect(() => {
        setIsMounted(true);
        
        // Detectar preferência do usuário por animações reduzidas
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            setAnimationEnabled(false);
        }

        // Verificar configuração salva no localStorage
        const savedAnimation = localStorage.getItem('auth-animation-enabled');
        const savedQuality = localStorage.getItem('auth-animation-quality');
        
        if (savedAnimation !== null) {
            setAnimationEnabled(savedAnimation === 'true');
        }
        if (savedQuality) {
            setQuality(savedQuality as 'low' | 'medium' | 'high');
        }
    }, []);

    const toggleAnimation = () => {
        const newValue = !animationEnabled;
        setAnimationEnabled(newValue);
        localStorage.setItem('auth-animation-enabled', newValue.toString());
    };

    const changeQuality = (newQuality: 'low' | 'medium' | 'high') => {
        setQuality(newQuality);
        localStorage.setItem('auth-animation-quality', newQuality);
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative">
            <BlackHoleBackground 
                enableAnimation={isMounted ? animationEnabled : false} 
                quality={quality}
            />
            
            {/* Controles de Performance */}
            <div className="absolute top-4 right-4 z-20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                >
                    <Settings className="h-4 w-4" />
                </Button>
                
                {showSettings && (
                    <div className="absolute top-12 right-0 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-white/20 min-w-[200px]">
                        <div className="space-y-3">
                            <div className="text-white text-sm font-medium">Configurações de Performance</div>
                            
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-white/80 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={animationEnabled}
                                        onChange={toggleAnimation}
                                        className="rounded"
                                    />
                                    <span>Ativar animações</span>
                                </label>
                            </div>
                            
                            {animationEnabled && (
                                <div className="space-y-2">
                                    <div className="text-white/80 text-xs">Qualidade:</div>
                                    <div className="flex gap-1">
                                        {(['low', 'medium', 'high'] as const).map((q) => (
                                            <Button
                                                key={q}
                                                variant={quality === q ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => changeQuality(q)}
                                                className="text-xs px-2 py-1 h-auto"
                                            >
                                                {q === 'low' ? 'Baixa' : q === 'medium' ? 'Média' : 'Alta'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="text-white/60 text-xs pt-2 border-t border-white/20">
                                {animationEnabled 
                                    ? `Animação ativa (${quality === 'low' ? 'Baixa' : quality === 'medium' ? 'Média' : 'Alta'})` 
                                    : 'Modo estático (melhor performance)'
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20 shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}