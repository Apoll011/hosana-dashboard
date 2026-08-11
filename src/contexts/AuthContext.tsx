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
    const { data } = await authClient.getSession({
      query: { disableCookieCache: true },
    });
    const sessionUser = (data?.user as SessionUser) ?? null;
    setUser(sessionUser);

    // Fetch active organization if user exists
    if (sessionUser) {
      try {
        let { data: orgData } = await authClient.organization.getFullOrganization();
        
        // If no active organization in session, search user organizations and set the first one as active
        if (!orgData) {
          const { data: orgs } = await authClient.organization.list();
          const storedSlug = localStorage.getItem("active_org_slug");
          
          let targetOrg = orgs?.find((o) => o.slug === storedSlug) || orgs?.[0];
          
          if (targetOrg) {
            await authClient.organization.setActive({
              organizationSlug: targetOrg.slug,
            });
            const fullRes = await authClient.organization.getFullOrganization();
            orgData = fullRes.data ?? (targetOrg as any);
          }
        }

        if (orgData) {
          localStorage.setItem("active_org_slug", orgData.slug);
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
          localStorage.removeItem("active_org_slug");
          setTenant(null);
        }
      } catch {
        setTenant(null);
      }
    } else {
      localStorage.removeItem("active_org_slug");
      setTenant(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = async () => {
    await authClient.signOut();
    localStorage.removeItem("active_org_slug");
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
