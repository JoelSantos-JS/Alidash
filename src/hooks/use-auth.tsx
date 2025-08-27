"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp, setDoc } from 'firebase/firestore';
import { backupUserData } from '@/lib/backup-client';
import { UpgradeToProDialog } from '@/components/layout/upgrade-to-pro-dialog';

import { Loader2 } from 'lucide-react';

interface ProSubscription {
    plan: 'biweekly' | 'monthly' | 'lifetime';
    startedAt: Timestamp;
    expiresAt: Timestamp;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPro: boolean;
  proSubscription: ProSubscription | null;
  productLimit: number;
  accountType: 'personal' | 'business';
  setAccountType: (type: 'personal' | 'business') => void;
  openUpgradeModal: () => void;
  logoutWithBackup: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [proSubscription, setProSubscription] = useState<ProSubscription | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const pathname = usePathname();
  const router = useRouter();

  const checkSubscriptionStatus = (sub: ProSubscription | null) => {
    if (!sub) return false;
    const now = new Date();
    const expiresAtDate = sub.expiresAt.toDate();
    return now < expiresAtDate;
  };

  const handleUpgrade = async (plan: 'biweekly' | 'monthly') => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const now = new Date();
    const expiresAt = new Date(now);
    
    if (plan === 'biweekly') {
        expiresAt.setDate(now.getDate() + 15);
    } else { // monthly
        expiresAt.setDate(now.getDate() + 30);
    }

    const newSubscription: ProSubscription = {
        plan,
        startedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
    };

    await setDoc(userDocRef, { proSubscription: newSubscription }, { merge: true });
    setProSubscription(newSubscription);
    setIsPro(true);
    setIsUpgradeModalOpen(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Sincronizar usuário com Supabase quando fizer login
      if (user) {
        try {
          console.log('🔄 Sincronizando usuário com Supabase:', user.email);
          
          // Usar API route para sincronizar usuário
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebase_uid: user.uid,
              email: user.email,
              name: user.displayName,
              avatar_url: user.photoURL
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('🎉 Usuário sincronizado com Supabase:', {
              id: result.user.id,
              email: result.user.email,
              firebase_uid: result.user.firebase_uid,
              action: result.action
            });
          } else {
            console.error('❌ Erro na sincronização com Supabase:', await response.text());
          }
          
        } catch (error) {
          console.error('❌ Erro na sincronização com Supabase:', error);
        }

        // Verificar status da assinatura Pro
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const subscription = userData.proSubscription || null;
            setProSubscription(subscription);
            setIsPro(checkSubscriptionStatus(subscription));
        } else {
            setProSubscription(null);
            setIsPro(false);
        }
      } else {
        setProSubscription(null);
        setIsPro(false);
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

  const logoutWithBackup = async () => {
    if (user) {
      try {
        console.log('🔄 Fazendo backup antes do logout...');
        await backupUserData(user);
        console.log('✅ Backup automático concluído');
      } catch (error) {
        console.error('❌ Erro no backup automático:', error);
      }
    }
    await auth.signOut();
  };

  const value = { 
      user, 
      loading, 
      isPro, 
      proSubscription,
      productLimit: isPro ? Infinity : 20,
      accountType,
      setAccountType,
      openUpgradeModal: () => setIsUpgradeModalOpen(true),
      logoutWithBackup
  };
  
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

  return (
    <AuthContext.Provider value={value}>
        {children}
        <UpgradeToProDialog 
            isOpen={isUpgradeModalOpen}
            onOpenChange={setIsUpgradeModalOpen}
            onUpgrade={handleUpgrade}
        />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
