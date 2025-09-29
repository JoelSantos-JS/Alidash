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
        // Usar setTimeout para evitar problemas de timing durante renderização
        setTimeout(async () => {
          try {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Sincronizando usuário com Supabase:', user.email);
            }
            
            // Usar API route para sincronizar usuário com timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
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
              }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
              const result = await response.json();
              if (process.env.NODE_ENV === 'development') {
                console.log('🎉 Usuário sincronizado com Supabase:', {
                  id: result.user.id,
                  email: result.user.email,
                  firebase_uid: result.user.firebase_uid,
                  action: result.action
                });
              }
            } else {
              let errorData = { message: 'Unknown error' };
              try {
                const responseText = await response.text();
                if (responseText) {
                  try {
                    errorData = JSON.parse(responseText);
                  } catch (parseError: unknown) {
                    errorData = { message: 'Error parsing response', raw: responseText };
                  }
                } else {
                  errorData = { message: 'Empty response body' };
                }
              } catch (textError: unknown) {
                errorData = { message: `Error reading response text: ${textError instanceof Error ? textError.message : 'Unknown error'}` };
              }
              
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Sincronização com Supabase falhou:', {
                  status: response?.status || 'Unknown',
                  statusText: response?.statusText || 'Unknown',
                  url: response?.url || '/api/auth/sync-user',
                  errorDetails: errorData,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
          } catch (error: any) {
            // Ignorar erros de abort (timeout)
            if (error?.name === 'AbortError') {
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Sincronização com Supabase cancelada por timeout');
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Erro na sincronização com Supabase:', {
                  message: error?.message || 'Erro desconhecido',
                  name: error?.name || 'UnknownError',
                  code: error?.code || 'UNKNOWN',
                  hint: 'Verifique se o servidor está rodando e as variáveis de ambiente estão configuradas'
                });
              }
            }
          }
        }, 100); // Delay de 100ms para evitar problemas de timing

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

    const isAuthPage = pathname.startsWith('/login');

    // Adicionar delay para evitar loops de navegação
    const timeoutId = setTimeout(() => {
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, loading, pathname]);

  const logoutWithBackup = async () => {
    if (user) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Fazendo backup antes do logout...');
        }
        await backupUserData(user);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Backup automático concluído');
        }
      } catch (error: unknown) {
        console.error('❌ Erro no backup automático:', {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          details: error ? String(error) : 'Sem detalhes disponíveis',
          errorType: typeof error,
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
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
  
  // Mostrar loading para qualquer página que não seja de auth quando estiver carregando
  // ou quando não há usuário autenticado
  if (loading || (!user && !pathname.startsWith('/login'))) {
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
