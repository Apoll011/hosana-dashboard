/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useSyncExternalStore } from "react";

export interface PersonalSettings {
  showFolderTree: boolean;
  // Add future settings here, e.g.:
  // theme: "light" | "dark" | "system";
  // compactView: boolean;
}

const DEFAULT_SETTINGS: PersonalSettings = {
  showFolderTree: true,
};

const STORAGE_KEY = "personal-settings";

function loadSettings(): PersonalSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
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
