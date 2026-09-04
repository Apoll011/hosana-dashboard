/**
 * Demo Mode — mock auth objects.
 *
 * These are returned by AuthContext when `isDemoMode()` is true.
 * No server calls are made; everything comes from here.
 */

import type { Organization, SessionUser } from "../contexts/AuthContext";

export const DEMO_USER: SessionUser = {
  id: "demo-user-id",
  name: "Demo User",
  email: "demo@hosana.app",
  emailVerified: true,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  role: "owner",
  image: undefined,
};

export const DEMO_ORGANIZATION: Organization = {
  id: "demo-org-id",
  name: "Igreja Demo",
  slug: "demo",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  logo: null,
  metadata: {
    description: "Demo Organization",
    shortName: "Demo",
    settings: {
      general: {
        locale: "pt",
        timezone: "America/Sao_Paulo",
        weekStartsOn: 0,
      },
      services: {
        defaultDurations: { sermon: 45, song: 5 },
        showNotes: true,
        showServiceDuration: true,
        autoSave: true,
      },
      agenda: {
        responsibilityCategories: [
          { id: "cat-worship", label: "Louvor", icon: "music", color: "violet" },
          { id: "cat-preaching", label: "Pregação", icon: "mic", color: "amber" },
          { id: "cat-sound", label: "Som", icon: "volume", color: "sky" },
          { id: "cat-projection", label: "Projeção", icon: "monitor", color: "emerald" },
          { id: "cat-reception", label: "Recepção", icon: "heart", color: "rose" },
        ],
      },
      appearance: {
        accentColor: "#6750A4",
        showBranding: true,
      },
    },
  },
  members: [
    {
      id: "demo-member-id",
      organizationId: "demo-org-id",
      role: "owner",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      userId: "demo-user-id",
      user: {
        id: "demo-user-id",
        email: "demo@hosana.app",
        name: "Demo User",
        image: undefined,
      },
    },
    {
      id: "demo-member-2",
      organizationId: "demo-org-id",
      role: "editor",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      userId: "demo-user-2",
      user: {
        id: "demo-user-2",
        email: "worship@hosana.app",
        name: "Maria Santos",
        image: undefined,
      },
    },
    {
      id: "demo-member-3",
      organizationId: "demo-org-id",
      role: "musician",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      userId: "demo-user-3",
      user: {
        id: "demo-user-3",
        email: "tech@hosana.app",
        name: "João Silva",
        image: undefined,
      },
    },
  ],
  invitations: [],
};
