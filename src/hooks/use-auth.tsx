"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPro: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsPro(userData.isPro || false);
            setIsSuperAdmin(userData.isSuperAdmin || false);
        } else {
            setIsPro(false);
            setIsSuperAdmin(false);
        }
      } else {
        setIsPro(false);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/cadastro');

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const value = { user, loading, isPro, isSuperAdmin };
  
  if (loading && !(pathname.startsWith('/login') || pathname.startsWith('/cadastro'))) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4"/>
                <p className="text-lg text-muted-foreground">Carregando...</p>
            </div>
        </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add Loader2 to the imports in use-auth.tsx for the loading screen
import { Loader2 } from 'lucide-react';
