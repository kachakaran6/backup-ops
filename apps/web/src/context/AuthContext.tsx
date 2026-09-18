import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(api.getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    api.setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // Hydrate session on app boot
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      const savedToken = api.getAuthToken();
      if (!savedToken) {
        if (isMounted) {
          setIsLoading(false);
          setUser(null);
          setToken(null);
        }
        return;
      }

      try {
        const profile = await api.fetchCurrentUser();
        if (isMounted) {
          if (profile) {
            setUser(profile);
            setToken(savedToken);
          } else {
            logout();
          }
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('backupops:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('backupops:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    try {
      const authRes = await api.loginApi(emailOrUsername, password);
      setToken(authRes.accessToken);
      setUser(authRes.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; username: string; password: string; displayName: string }) => {
    setIsLoading(true);
    try {
      const authRes = await api.registerApi(data);
      setToken(authRes.accessToken);
      setUser(authRes.user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
