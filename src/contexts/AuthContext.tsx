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
import { posthog } from "../lib/posthog";

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
  metadata?: {
    description?: string;
    shortName?: string;
    settings?: {
      general?: {
        locale?: string;
        timezone?: string;
        weekStartsOn?: number;
      };
      services?: {
        defaultDurations?: {
          sermon?: number;
          song?: number;
        };
        showNotes?: boolean;
        showServiceDuration?: boolean;
        autoSave?: boolean;
      };
      appearance?: {
        accentColor?: string;
        showBranding?: boolean;
      };
    };
    [key: string]: unknown;
  } | null;
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

const normalizeOrganization = (org: unknown): Organization => {
  const organization = org as Organization & { metadata?: unknown };

  if (typeof organization.metadata === "string") {
    try {
      organization.metadata = JSON.parse(organization.metadata) as Record<
        string,
        unknown
      >;
    } catch {
      organization.metadata = null;
    }
  }

  return organization;
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

const CACHED_USER_KEY = "cached_auth_user";
const CACHED_ORG_KEY = "cached_auth_org";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const stored = localStorage.getItem(CACHED_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    try {
      const stored = localStorage.getItem(CACHED_ORG_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // Stale-While-Revalidate: If we have a cached user, start with isLoading = false immediately!
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(CACHED_USER_KEY);
      return !stored;
    } catch {
      return true;
    }
  });

  const handleClearSession = useCallback(() => {
    setUser(null);
    setOrganization(null);
    localStorage.removeItem("active_org_slug");
    localStorage.removeItem(CACHED_USER_KEY);
    localStorage.removeItem(CACHED_ORG_KEY);
    clearPermissionCache();

    setIsLoading(false);
  }, []);

  const fetchSession = useCallback(async () => {
    // Only show full blocking loader if we don't have a cached session yet
    const hasCachedUser = Boolean(localStorage.getItem(CACHED_USER_KEY));
    if (!hasCachedUser) {
      setIsLoading(true);
    }

    // If offline, restore from cache without clearing or network call
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const cachedUserStr = localStorage.getItem(CACHED_USER_KEY);
        const cachedOrgStr = localStorage.getItem(CACHED_ORG_KEY);
        if (cachedUserStr) {
          setUser(JSON.parse(cachedUserStr));
        }
        if (cachedOrgStr) {
          setOrganization(JSON.parse(cachedOrgStr));
        }
      } catch (err) {
        console.error("Failed to restore offline cached session:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const { data: sessionData, error: sessionError } =
        await authClient.getSession({ query: {} });
      const sessionUser = sessionData?.user;

      if (!sessionUser || sessionError) {
        // If fetch failed due to network error/offline, keep cached session if available
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setIsLoading(false);
          return;
        }
        return handleClearSession();
      }

      let activeOrg: Organization | null = null;
      let userRole: string | undefined = undefined;

      const { data: initialOrg } =
        await authClient.organization.getFullOrganization({ query: {} });

      if (initialOrg) {
        activeOrg = normalizeOrganization(initialOrg);
      } else {
        const { data: orgs } = await authClient.organization.list({
          query: {},
        });
        if (orgs && orgs.length > 0) {
          const storedSlug = localStorage.getItem("active_org_slug");
          const targetOrg = orgs.find((o) => o.slug === storedSlug) || orgs[0];

          await authClient.organization.setActive({
            organizationSlug: targetOrg.slug,
          });

          const { data: newlyActiveOrg } =
            await authClient.organization.getFullOrganization({
              query: {},
            });
          activeOrg = normalizeOrganization(newlyActiveOrg);
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
            await authClient.organization.getActiveMemberRole({
              query: {},
            });
          userRole = roleData?.role || undefined;
        }
      } else {
        localStorage.removeItem("active_org_slug");
        clearPermissionCache();
      }

      const fullUser = {
        ...sessionUser,
        role: userRole,
      } as SessionUser;

      setOrganization(activeOrg);
      setUser(fullUser);

      // Identify the user in PostHog on every session refresh
      posthog.identify(fullUser.id, {
        name: fullUser.name,
        email: fullUser.email,
        role: userRole,
        organization_id: activeOrg?.id,
        organization_name: activeOrg?.name,
      });

      // Cache for offline usage
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(fullUser));
        if (activeOrg) {
          localStorage.setItem(CACHED_ORG_KEY, JSON.stringify(activeOrg));
        } else {
          localStorage.removeItem(CACHED_ORG_KEY);
        }
      } catch (err) {
        console.warn("Failed to persist session to localStorage:", err);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      // If error occurred (e.g. network failure while fetching), keep cached session if available
      const cachedUserStr = localStorage.getItem(CACHED_USER_KEY);
      if (cachedUserStr) {
        try {
          setUser(JSON.parse(cachedUserStr));
          const cachedOrgStr = localStorage.getItem(CACHED_ORG_KEY);
          if (cachedOrgStr) {
            setOrganization(JSON.parse(cachedOrgStr));
          }
        } catch {
          handleClearSession();
        }
      } else {
        handleClearSession();
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleClearSession]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Re-check session on returning online
  useEffect(() => {
    const handleOnline = () => {
      fetchSession();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [fetchSession]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "active_org_slug" || e.key === CACHED_USER_KEY)
        fetchSession();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchSession]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await authClient.signOut({ fetchOptions: {} });
    posthog.reset();
    handleClearSession();
    // Clear all localStorage data
    localStorage.clear();

    // Clear all IndexedDB databases
    if (typeof indexedDB !== "undefined" && indexedDB.databases) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(
            (db) =>
              new Promise<void>((resolve) => {
                if (!db.name) {
                  resolve();
                  return;
                }
                const req = indexedDB.deleteDatabase(db.name);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              }),
          ),
        );
      } catch {
        // indexedDB.databases() may not be available in all browsers; ignore errors
      }
    }
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
