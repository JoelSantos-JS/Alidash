"use client";

import { useAuth } from '@/hooks/use-supabase-auth';
import { usePathname } from 'next/navigation';

export function AuthDebugger() {
  const { user, session, loading } = useAuth();
  const pathname = usePathname();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50 backdrop-blur-md border border-white/20">
      <h3 className="font-bold mb-2">🐛 Auth Debug</h3>
      <div className="space-y-1">
        <div>📍 <strong>Pathname:</strong> {pathname}</div>
        <div>⏳ <strong>Loading:</strong> {loading ? '✅' : '❌'}</div>
        <div>🔐 <strong>Session:</strong> {session ? '✅' : '❌'}</div>
        <div>👤 <strong>User:</strong> {user ? '✅' : '❌'}</div>
        {session?.user && (
          <div>📧 <strong>Email:</strong> {session.user.email}</div>
        )}
        {user && (
          <div>🆔 <strong>User ID:</strong> {user.id}</div>
        )}
      </div>
    </div>
  );
}