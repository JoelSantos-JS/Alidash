import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, act, waitFor } from '@testing-library/react';

// Mock do Firebase Auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Simula um usuário não autenticado inicialmente
      callback(null);
      return () => {};
    }),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  },
  db: {}
}));

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock do fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      user: {
        id: '123',
        firebase_uid: 'firebase123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        account_type: 'personal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null,
        is_active: true,
      }
    }),
  })
) as jest.Mock;

// Mock do módulo firebase/auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn()
}));

// Agora importamos o hook depois de mockar as dependências
import { AuthProvider, useAuth } from '@/hooks/use-auth';

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o provedor de autenticação', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Child Component</div>
      </AuthProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('deve iniciar com usuário não autenticado', () => {
    let authState: any;
    
    function TestComponent() {
      authState = useAuth();
      return <div>Test</div>;
    }
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(authState.user).toBeNull();
    expect(authState.isLoading).toBe(false);
  });
});