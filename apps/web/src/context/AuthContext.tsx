'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, name: string, pass: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('brewlite_token');
      const savedUser = localStorage.getItem('brewlite_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // Ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await loginUser(email, pass);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('brewlite_token', res.access_token);
    localStorage.setItem('brewlite_user', JSON.stringify(res.user));
  };

  const register = async (email: string, name: string, pass: string, phone?: string) => {
    const res = await registerUser(email, name, pass, phone);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('brewlite_token', res.access_token);
    localStorage.setItem('brewlite_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('brewlite_token');
    localStorage.removeItem('brewlite_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
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
