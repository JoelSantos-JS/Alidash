"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, supabaseService } from '@/lib/supabase-service';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';


interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  firebase_uid?: string;
  account_type: 'personal' | 'business';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  accountType: 'personal' | 'business';
  setAccountType: (type: 'personal' | 'business') => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  
  const pathname = usePathname();
  const router = useRouter();

  // Auth methods
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    // Auth state change will be handled by onAuthStateChange listener
  };

  const signUp = async (email: string, password: string, userData?: { name?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;

    // Create user record in our users table if signup was successful
    if (data.user && !error) {
      try {
        await supabaseService.createUser({
          firebase_uid: data.user.id, // Use Supabase UID as firebase_uid for compatibility
          email: data.user.email!,
          name: userData?.name || null,
          account_type: 'personal'
        });
      } catch (userCreateError) {
        console.error('Error creating user record:', userCreateError);
        // Continue with auth flow even if user record creation fails
      }
    }
    // Auth state change will be handled by onAuthStateChange listener
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // Load user data from our users table
  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Try to get user by Supabase UUID first
      let userData = await supabaseService.getUserByFirebaseUid(supabaseUser.id);
      
      // If not found, try to get by email (for migrated users)
      if (!userData) {
        // This would require a new method in SupabaseService
        // For now, create a new user record
        userData = await supabaseService.createUser({
          firebase_uid: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || null,
          account_type: 'personal'
        });
      }

      // Update last login
      await supabaseService.updateUserLastLogin(userData.id);

      setUser(userData);
      setAccountType(userData.account_type as 'personal' | 'business');

    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle routing
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.startsWith('/login');

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    loading, 
    accountType,
    setAccountType,
    signIn,
    signUp,
    signOut,
    resetPassword
  };
  
  // Loading screen for non-auth pages
  if (loading && !pathname.startsWith('/login')) {
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

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

// Create a compatibility hook that uses the same interface as the original useAuth
export const useAuth = useSupabaseAuth;