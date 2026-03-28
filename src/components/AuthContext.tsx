import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setProfile(userData);
          } else {
            localStorage.removeItem('token');
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '登录失败');
    }

    const { token, profile: userProfile } = await response.json();
    localStorage.setItem('token', token);
    setUser(userProfile);
    setProfile(userProfile);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '注册失败');
    }

    const { token, profile: userProfile } = await response.json();
    localStorage.setItem('token', token);
    setUser(userProfile);
    setProfile(userProfile);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const hasRole = (roles: UserRole[]) => {
    return profile ? roles.includes(profile.role) : false;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
