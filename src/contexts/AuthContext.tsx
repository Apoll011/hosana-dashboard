/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InvitationStatus } from "better-auth/plugins/organization";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient } from "../lib/authClient";
import { clearPermissionCache } from "../lib/permissions/client";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
  [key: string]: unknown;
}

// Tenant shape compatible with legacy code
type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, any> | null;
  members: {
    id: string;
    organizationId: string;
    role:
      | "admin"
      | "editor"
      | "guest"
      | "member"
      | "musician"
      | "owner"
      | "teamLeader";
    createdAt: Date;
    userId: string;
    teamId?: string | undefined;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  }[];
  invitations: {
    id: string;
    organizationId: string;
    email: string;
    role:
      | "admin"
      | "editor"
      | "guest"
      | "member"
      | "musician"
      | "owner"
      | "teamLeader";
    status: InvitationStatus;
    inviterId: string;
    expiresAt: Date;
    createdAt: Date;
    teamId?: string | undefined;
  }[];
};
interface AuthContextType {
  user: SessionUser | null;
  tenant: Organization | null;
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
  const [tenant, setTenant] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await authClient.getSession();
      const sessionUser = data?.user ?? null;

      if (!sessionUser) {
        handleClearSession();
        return;
      }

      let activeTenant: Organization | null = null;
      let userRole: string | null = null;

      const previousTenantSlug = localStorage.getItem("active_org_slug");

      let { data: orgData } =
        await authClient.organization.getFullOrganization();

      if (!orgData) {
        const { data: orgs } = await authClient.organization.list();
        const storedSlug = localStorage.getItem("active_org_slug");

        let targetOrg = orgs?.find((o) => o.slug === storedSlug) || orgs?.[0];

        if (targetOrg) {
          await authClient.organization.setActive({
            organizationSlug: targetOrg.slug,
          });
          orgData = targetOrg as any;
        }
      }

      if (orgData) {
        if (previousTenantSlug !== orgData.slug) {
          clearPermissionCache();
        }

        localStorage.setItem("active_org_slug", orgData.slug);

        const [fullRes, roleRes] = await Promise.allSettled([
          authClient.organization.getFullOrganization(),
          authClient.organization.getActiveMemberRole(),
        ]);

        const fullOrgData =
          fullRes.status === "fulfilled" && fullRes.value.data
            ? fullRes.value.data
            : orgData;

        userRole =
          roleRes.status === "fulfilled" && roleRes.value.data
            ? roleRes.value.data.role
            : null;

        activeTenant = fullOrgData;
      } else {
        localStorage.removeItem("active_org_slug");
        clearPermissionCache();
      }

      setTenant(activeTenant);
      setUser({
        ...sessionUser,
        role: userRole ?? undefined,
      } as SessionUser);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      handleClearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearSession = useCallback(() => {
    setUser(null);
    setTenant(null);
    localStorage.removeItem("active_org_slug");
    clearPermissionCache();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "active_org_slug") {
        fetchSession();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchSession]);

  const logout = async () => {
    setIsLoading(true);
    await authClient.signOut();
    handleClearSession();
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
