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
  useMemo,
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

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
  members?: {
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
    teamId?: string;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
  }[];
  invitations?: {
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
    teamId?: string;
  }[];
};

interface AuthContextType {
  user: SessionUser | null;
  organization: Organization | null;
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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleClearSession = useCallback(() => {
    setUser(null);
    setOrganization(null);
    localStorage.removeItem("active_org_slug");
    clearPermissionCache();
    setIsLoading(false);
  }, []);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await authClient.getSession();
      const sessionUser = sessionData?.user;

      if (!sessionUser || sessionError) {
        return handleClearSession();
      }

      let activeOrg: Organization | null = null;
      let userRole: string | undefined = undefined;

      const { data: initialOrg } =
        await authClient.organization.getFullOrganization();

      if (initialOrg) {
        activeOrg = initialOrg as Organization;
      } else {
        const { data: orgs } = await authClient.organization.list();
        if (orgs && orgs.length > 0) {
          const storedSlug = localStorage.getItem("active_org_slug");
          const targetOrg = orgs.find((o) => o.slug === storedSlug) || orgs[0];

          await authClient.organization.setActive({
            organizationSlug: targetOrg.slug,
          });

          const { data: newlyActiveOrg } =
            await authClient.organization.getFullOrganization();
          activeOrg = newlyActiveOrg as Organization;
        }
      }

      if (activeOrg) {
        const previousSlug = localStorage.getItem("active_org_slug");

        if (previousSlug !== activeOrg.slug) {
          localStorage.setItem("active_org_slug", activeOrg.slug);
          clearPermissionCache();
        }

        const currentUserMember = activeOrg.members?.find(
          (m) => m.userId === sessionUser.id,
        );

        if (currentUserMember) {
          userRole = currentUserMember.role;
        } else {
          const { data: roleData } =
            await authClient.organization.getActiveMemberRole();
          userRole = roleData?.role || undefined;
        }
      } else {
        localStorage.removeItem("active_org_slug");
        clearPermissionCache();
      }

      setOrganization(activeOrg);
      setUser({
        ...sessionUser,
        role: userRole,
      } as SessionUser);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      handleClearSession();
    } finally {
      setIsLoading(false);
    }
  }, [handleClearSession]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "active_org_slug") fetchSession();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchSession]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await authClient.signOut();
    handleClearSession();
  }, [handleClearSession]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      organization,
      isAuthenticated: !!user,
      isLoading,
      refetch: fetchSession,
      logout,
    }),
    [user, organization, isLoading, fetchSession, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
