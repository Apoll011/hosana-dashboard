/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authClient } from "../lib/authClient";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// Tenant shape compatible with legacy code
interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: SessionUser | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    const { data } = await authClient.getSession();
    const sessionUser = (data?.user as SessionUser) ?? null;
    setUser(sessionUser);

    // Fetch active organization if user exists
    if (sessionUser) {
      try {
        const { data: orgData } = await authClient.organization.getFullOrganization();
        if (orgData) {
          setTenant({
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            logo: orgData.logo ?? undefined,
            active: true,
            createdAt: new Date(orgData.createdAt),
            updatedAt: new Date(orgData.createdAt),
          });
        } else {
          setTenant(null);
        }
      } catch {
        setTenant(null);
      }
    } else {
      setTenant(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = async () => {
    await authClient.signOut();
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user,
        isLoading,
        refetch: fetchSession,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
