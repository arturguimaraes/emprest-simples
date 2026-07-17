import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '../../firebase';

const EMAIL_KEY = 'emprest:emailForSignIn';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = localStorage.getItem(EMAIL_KEY);
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem(EMAIL_KEY);
            // Strip auth query params from URL without triggering a reload
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
          })
          .catch(console.error);
      }
    }

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function sendMagicLink(email: string) {
    const url = window.location.origin + window.location.pathname;
    await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true });
    localStorage.setItem(EMAIL_KEY, email);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, sendMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
