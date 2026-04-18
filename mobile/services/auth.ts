import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';

import { auth } from './firebase';

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

export function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/user-disabled':
      return 'Usuário desativado.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}
