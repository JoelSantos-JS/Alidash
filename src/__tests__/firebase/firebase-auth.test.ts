import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getAuth, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Mock do módulo firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn()
}));

describe('Firebase Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve fazer login com email e senha', async () => {
    // Mock do usuário retornado
    const mockUser = {
      uid: 'user123',
      email: 'teste@exemplo.com',
      displayName: 'Usuário Teste'
    };

    // Configuração do mock para retornar um usuário
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: mockUser
    });

    // Dados de login
    const email = 'teste@exemplo.com';
    const password = 'senha123';

    // Chamada para a função de login
    const auth = getAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Verificações
    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, email, password);
    expect(result.user).toEqual(mockUser);
  });

  it('deve fazer login com Google', async () => {
    // Mock do usuário retornado
    const mockUser = {
      uid: 'google123',
      email: 'teste@gmail.com',
      displayName: 'Usuário Google',
      photoURL: 'https://exemplo.com/foto.jpg'
    };

    // Configuração do mock para retornar um usuário
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: mockUser
    });

    // Chamada para a função de login com Google
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Verificações
    expect(GoogleAuthProvider).toHaveBeenCalledTimes(1);
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(signInWithPopup).toHaveBeenCalledWith(auth, provider);
    expect(result.user).toEqual(mockUser);
  });

  it('deve fazer logout corretamente', async () => {
    // Configuração do mock para logout bem-sucedido
    (signOut as jest.Mock).mockResolvedValueOnce(undefined);

    // Chamada para a função de logout
    const auth = getAuth();
    await signOut(auth);

    // Verificações
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith(auth);
  });
});