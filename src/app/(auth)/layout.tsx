import React from 'react';
import { BlackHoleBackground } from '@/components/ui/black-hole-background';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-center min-h-screen relative">
            <BlackHoleBackground />
            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20 shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}