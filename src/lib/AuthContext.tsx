import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  user: null,
  login: () => {},
  logout: () => {},
  getAuthHeaders: () => ({}),
});

// Helper component so we can use `useAuth` directly
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for token in localStorage or 'auth' cookie (name backend sets)
    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return match ? match[1] : null;
    };
    const token = localStorage.getItem('auth_token') || getCookieValue('auth');
    
    if (token) {
      try {
        // The backend token format is <base64url_data>.<signature>
        let base64 = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        
        const payload = JSON.parse(atob(base64));
        setIsLoggedIn(true);
        setIsAdmin(payload.role === 'admin' || payload.isAdmin);
        setUser({
          id: payload.userId || payload.id,
          name: payload.name || 'User',
          email: payload.email || '',
          role: payload.role || (payload.isAdmin ? 'admin' : 'user')
        });
      } catch (e) {
        console.error("Failed to parse token", e);
        logout();
      }
    }
  }, []);

  const login = (token: string, userData: User) => {
    // Store token in localStorage with consistent key
    localStorage.setItem('auth_token', token);
    // Also set as 'auth' cookie to match backend cookie name expectations
    document.cookie = `auth=${token}; path=/; max-age=86400; SameSite=Lax`;
    setIsLoggedIn(true);
    setIsAdmin(userData.role === 'admin');
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, user, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};
