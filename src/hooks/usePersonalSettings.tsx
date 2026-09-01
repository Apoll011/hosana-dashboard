/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useSyncExternalStore } from "react";
import { PersonalLanguage } from "../lib/i18n/types";

export type PersonalTheme = "light" | "dark" | "system";
export type ViewMode = "grid" | "list";
export type ExplorerDensity = "comfortable" | "compact";

/**
 * Single source of truth for every user-level preference. All of these were
 * previously scattered across separate `localStorage` keys (theme, language,
 * navigation, studio settings); they are now consolidated here under one key.
 */
export interface PersonalSettings {
  showFolderTree: boolean;
  /** UI language preference. `"auto"` follows org → browser → default. */
  language: PersonalLanguage;
  theme: PersonalTheme;
  showChordsDefault: boolean;
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  explorerDensity: ExplorerDensity;
}

const DEFAULT_SETTINGS: PersonalSettings = {
  showFolderTree: true,
  language: "auto",
  theme: "light",
  showChordsDefault: true,
  sidebarCollapsed: false,
  viewMode: "grid",
  explorerDensity: "comfortable",
};

const STORAGE_KEY = "personal-settings";

/**
 * Legacy keys from before the consolidation. Read once so existing users keep
 * their preferences, then removed in favour of the unified store.
 */
const LEGACY_KEYS = {
  theme: "chordpro_theme",
  showChordsDefault: "@hosanna:showChordsDefault",
  sidebarCollapsed: "sidebarCollapsed",
  viewMode: "viewMode",
  explorerDensity: "explorer_density",
} as const;

function loadSettings(): PersonalSettings {
  const settings: PersonalSettings = { ...DEFAULT_SETTINGS };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) Object.assign(settings, JSON.parse(stored));

    // One-time migration from legacy scattered keys.
    let migrated = false;
    const legacyTheme = localStorage.getItem(LEGACY_KEYS.theme);
    if (
      legacyTheme === "light" ||
      legacyTheme === "dark" ||
      legacyTheme === "system"
    ) {
      settings.theme = legacyTheme;
      migrated = true;
    }
    const legacyChords = localStorage.getItem(LEGACY_KEYS.showChordsDefault);
    if (legacyChords !== null) {
      settings.showChordsDefault = legacyChords === "true";
      migrated = true;
    }
    const legacyCollapsed = localStorage.getItem(LEGACY_KEYS.sidebarCollapsed);
    if (legacyCollapsed !== null) {
      settings.sidebarCollapsed = legacyCollapsed === "true";
      migrated = true;
    }
    const legacyViewMode = localStorage.getItem(LEGACY_KEYS.viewMode);
    if (legacyViewMode === "grid" || legacyViewMode === "list") {
      settings.viewMode = legacyViewMode;
      migrated = true;
    }
    const legacyDensity = localStorage.getItem(LEGACY_KEYS.explorerDensity);
    if (legacyDensity === "comfortable" || legacyDensity === "compact") {
      settings.explorerDensity = legacyDensity;
      migrated = true;
    }

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    // ignore unavailable/corrupt storage
  }
  return settings;
}

// Module-level store: syncs state across all component instances instantly
let state: PersonalSettings = loadSettings();
const listeners = new Set<() => void>();

function setState(updater: (prev: PersonalSettings) => PersonalSettings) {
  state = updater(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable or full — silently ignore
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

// Sync across open browser tabs/windows
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = { ...DEFAULT_SETTINGS, ...JSON.parse(e.newValue) };
        listeners.forEach((l) => l());
      } catch {
        // ignore invalid JSON from another tab
      }
    }
  });
}

export function usePersonalSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot);

  const updateSetting = useCallback(
    <K extends keyof PersonalSettings>(key: K, value: PersonalSettings[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => setState(() => DEFAULT_SETTINGS), []);

  return { settings, updateSetting, resetSettings };
}
