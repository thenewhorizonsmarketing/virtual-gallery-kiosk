import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (pin: string) => Promise<void>;
  signOut: () => void;
  pinHint: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'kiosk.admin.authenticated';

const DEFAULT_PIN = '0000';

function readPersistedState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'true';
}

function writePersistedState(isAuthenticated: boolean) {
  if (typeof window === 'undefined') {
    return;
  }
  if (isAuthenticated) {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function getConfiguredPin(): string {
  const configured = (import.meta.env.VITE_ADMIN_PIN as string | undefined)?.trim();
  if (configured && configured.length > 0) {
    return configured;
  }
  return DEFAULT_PIN;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(readPersistedState());
    setLoading(false);
  }, []);

  const targetPin = useMemo(() => getConfiguredPin(), []);
  const pinHint = useMemo(() => {
    const hint = (import.meta.env.VITE_ADMIN_HINT as string | undefined)?.trim();
    return hint && hint.length > 0 ? hint : null;
  }, []);

  const signIn: AuthContextValue['signIn'] = async (pin) => {
    const trimmed = pin.trim();
    if (trimmed.length === 0) {
      throw new Error('Enter the admin PIN to continue.');
    }

    if (trimmed !== targetPin) {
      throw new Error('Incorrect PIN. Double-check with the kiosk administrator.');
    }

    setIsAuthenticated(true);
    writePersistedState(true);
  };

  const signOut = () => {
    setIsAuthenticated(false);
    writePersistedState(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, signIn, signOut, pinHint }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
