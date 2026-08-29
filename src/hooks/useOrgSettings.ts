/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authClient } from "../lib/authClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrgServicesSettings {
  /** Default sermon duration in seconds */
  sermonDuration: number;
  /** Default song duration in seconds */
  songDuration: number;
  showNotes: boolean;
  showServiceDuration: boolean;
  autoSave: boolean;
}

export interface OrgGeneralSettings {
  locale: string;
  timezone: string;
  weekStartsOn: number;
}

export interface OrgSettings {
  general: OrgGeneralSettings;
  services: OrgServicesSettings;
}

interface OrgMetadataStructure {
  settings?: {
    general?: Partial<OrgGeneralSettings>;
    services?: {
      defaultDurations?: { sermon?: number; song?: number };
      showNotes?: boolean;
      showServiceDuration?: boolean;
      autoSave?: boolean;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  general: {
    locale: "pt-PT",
    timezone: "Europe/Lisbon",
    weekStartsOn: 1,
  },
  services: {
    sermonDuration: 2400, // 40 min
    songDuration: 300, // 5 min
    showNotes: true,
    showServiceDuration: true,
    autoSave: true,
  },
};

// ─── Helper to parse metadata → OrgSettings ──────────────────────────────────

function parseOrgSettings(metadata: OrgMetadataStructure): OrgSettings {
  const s = metadata.settings || {};
  const g = s.general || {};
  const svc = s.services || {};
  const dur = svc.defaultDurations || {};

  return {
    general: {
      locale: g.locale ?? DEFAULT_ORG_SETTINGS.general.locale,
      timezone: g.timezone ?? DEFAULT_ORG_SETTINGS.general.timezone,
      weekStartsOn: g.weekStartsOn ?? DEFAULT_ORG_SETTINGS.general.weekStartsOn,
    },
    services: {
      sermonDuration:
        dur.sermon ?? DEFAULT_ORG_SETTINGS.services.sermonDuration,
      songDuration: dur.song ?? DEFAULT_ORG_SETTINGS.services.songDuration,
      showNotes: svc.showNotes ?? DEFAULT_ORG_SETTINGS.services.showNotes,
      showServiceDuration:
        svc.showServiceDuration ??
        DEFAULT_ORG_SETTINGS.services.showServiceDuration,
      autoSave: svc.autoSave ?? DEFAULT_ORG_SETTINGS.services.autoSave,
    },
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseOrgSettingsReturn {
  settings: OrgSettings;
  /** Settings as they were when last loaded/saved — used for reset */
  savedSettings: OrgSettings;
  isDirty: boolean;
  isSaving: boolean;
  /** Update a nested field: update("services", "autoSave", true) */
  update: <S extends keyof OrgSettings, K extends keyof OrgSettings[S]>(
    section: S,
    key: K,
    value: OrgSettings[S][K],
  ) => void;
  /** Set the whole settings object at once */
  set: (next: OrgSettings) => void;
  /** Discard unsaved changes */
  reset: () => void;
  /** Persist to backend */
  save: () => Promise<void>;
}

export function useOrgSettings(): UseOrgSettingsReturn {
  const { organization, refetch } = useAuth();

  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_ORG_SETTINGS);
  const [savedSettings, setSavedSettings] =
    useState<OrgSettings>(DEFAULT_ORG_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Sync from organization whenever it changes
  useEffect(() => {
    if (organization) {
      const parsed = parseOrgSettings(
        (organization.metadata as OrgMetadataStructure) ?? {},
      );
      setSettings(parsed);
      setSavedSettings(parsed);
    }
  }, [organization]);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const update = <S extends keyof OrgSettings, K extends keyof OrgSettings[S]>(
    section: S,
    key: K,
    value: OrgSettings[S][K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const set = (next: OrgSettings) => setSettings(next);

  const reset = () => setSettings(savedSettings);

  const save = async () => {
    if (!organization) return;
    setIsSaving(true);
    try {
      const currentMetadata =
        (organization.metadata as OrgMetadataStructure) ?? {};

      await authClient.organization.update({
        data: {
          metadata: {
            ...currentMetadata,
            settings: {
              ...currentMetadata.settings,
              general: {
                ...currentMetadata.settings?.general,
                locale: settings.general.locale,
                timezone: settings.general.timezone,
                weekStartsOn: settings.general.weekStartsOn,
              },
              services: {
                ...currentMetadata.settings?.services,
                defaultDurations: {
                  sermon: settings.services.sermonDuration,
                  song: settings.services.songDuration,
                },
                showNotes: settings.services.showNotes,
                showServiceDuration: settings.services.showServiceDuration,
                autoSave: settings.services.autoSave,
              },
            },
          },
        },
      });

      await refetch();
      // savedSettings will be updated by the useEffect reacting to organization refetch
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    savedSettings,
    isDirty,
    isSaving,
    update,
    set,
    reset,
    save,
  };
}
