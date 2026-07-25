/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, LoginParams } from '../api/auth';
import { httpClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => httpClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from local token
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = httpClient.getToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authApi.getCurrentUser();
        setUser(data.user);
        setToken(savedToken);
      } catch (err) {
        console.warn('Failed to validate initial token:', err);
        setUser(null);
        setToken(null);
        httpClient.setTokens(null, null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Register 401 callback
    httpClient.onUnauthorized(() => {
      setUser(null);
      setToken(null);
    });
  }, []);

  const login = async (params: LoginParams) => {
    setIsLoading(true);
    try {
      if (params.serverUrl) {
        httpClient.setBaseURL(params.serverUrl);
      }
      const res = await authApi.login(params);
      setUser(res.user);
      setToken(res.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
