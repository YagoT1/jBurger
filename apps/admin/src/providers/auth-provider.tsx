'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface AuthState {
  userId?: string;
  email?: string;
  isAuthenticated: boolean;
  login(email: string): void;
  logout(): void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string>();

  const value = useMemo<AuthState>(
    () => ({
      ...(email ? { email } : {}),
      ...(email ? { userId: 'current-user' } : {}),
      isAuthenticated: Boolean(email),
      login: setEmail,
      logout: () => setEmail(undefined),
    }),
    [email],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
