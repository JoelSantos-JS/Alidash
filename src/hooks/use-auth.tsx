"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { backupUserData } from '@/lib/backup-client';

import { Loader2 } from 'lucide-react';

interface UserData {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  account_type: 'personal' | 'business';
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  accountType: 'personal' | 'business';
  setAccountType: (type: 'personal' | 'business') => void;
  logoutWithBackup: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const pathname = usePathname();
  const router = useRouter();
  const syncInProgress = useRef(false);

  // Função para buscar dados do usuário do Supabase
  const fetchUserData = useCallback(async (firebaseUid: string): Promise<UserData | null> => {
    try {
      const response = await fetch('/api/user/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebase_uid: firebaseUid }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.user;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Erro ao buscar dados do usuário:', error);
      }
      return null;
    }
  }, []);

  // Função para atualizar dados do usuário
  const refreshUserData = useCallback(async () => {
    if (user?.uid) {
      const data = await fetchUserData(user.uid);
      setUserData(data);
    }
  }, [user?.uid, fetchUserData]);

  // Função otimizada para sincronização
  const syncUserWithSupabase = useCallback(async (firebaseUser: User) => {
    if (syncInProgress.current) return;
    
    syncInProgress.current = true;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Sincronizando usuário com Supabase:', firebaseUser.email);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        setUserData(result.user);
        
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
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Limpar dados do usuário se não estiver logado
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }
      
      // Sincronizar usuário com Supabase quando fizer login
      setTimeout(() => {
        syncUserWithSupabase(user);
        setLoading(false);
      }, 100); // Delay de 100ms para evitar problemas de timing
    });

    return () => unsubscribe();
  }, [syncUserWithSupabase]);

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

  const logoutWithBackup = useCallback(async () => {
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
    
    // Limpar dados locais
    setUserData(null);
    await auth.signOut();
  }, [user]);

  const value = { 
      user, 
      userData,
      loading, 
      accountType,
      setAccountType,
      logoutWithBackup,
      refreshUserData
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
