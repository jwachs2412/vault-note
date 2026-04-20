import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from '../hooks/useAuth';
import type { User } from '../types';
import * as api from '../services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  // Start as loading only if we have a token to verify
  const [isLoading, setIsLoading] = useState(
    () => !!localStorage.getItem('token')
  );

  // Verify stored token on mount. This is a legitimate effect:
  // it's synchronizing with an external system (the API).
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    let cancelled = false;
    api
      .getMe()
      .then((userData) => {
        if (cancelled) return;
        setUser(userData);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(email: string, password: string) {
    const response = await api.login(email, password);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
  }

  async function handleRegister(email: string, password: string) {
    const response = await api.register(email, password);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
