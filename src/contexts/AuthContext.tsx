import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { LoginRequest, User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start — always fetch fresh profile from API
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userProfile = await authApi.getProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Token invalid, clearing auth data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('permissions');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      // Login returns token + basic user info
      await authApi.login(credentials);
      // Always fetch full profile after login to get all fields (division, employeeId, etc.)
      const fullProfile = await authApi.getProfile();
      setUser(fullProfile);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const fresh = await authApi.getProfile();
      setUser(fresh);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    refreshUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};