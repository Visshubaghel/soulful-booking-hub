import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
  saveAuth: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userMeta');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('userMeta');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const saveAuth = (userData: User, token: string) => {
    localStorage.setItem('userMeta', JSON.stringify(userData));
    localStorage.setItem('authToken', token);
    setUser(userData);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('authToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    localStorage.removeItem('userMeta');
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, getAuthHeaders, saveAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
