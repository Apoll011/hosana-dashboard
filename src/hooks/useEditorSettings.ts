import { useState, useEffect, useCallback } from 'react';

export interface EditorSettings {
  theme: string;
  fontSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
}

export const EDITOR_THEMES = [
  { value: 'textmate', label: 'Textmate (claro)' },
  { value: 'github', label: 'GitHub (claro)' },
  { value: 'tomorrow', label: 'Tomorrow (claro)' },
  { value: 'solarized_light', label: 'Solarized Light (claro)' },
  { value: 'monokai', label: 'Monokai (escuro)' },
  { value: 'dracula', label: 'Dracula (escuro)' },
  { value: 'tomorrow_night', label: 'Tomorrow Night (escuro)' },
  { value: 'solarized_dark', label: 'Solarized Dark (escuro)' },
] as const;

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'textmate',
  fontSize: 14,
  wordWrap: true,
  showLineNumbers: true,
};

const STORAGE_KEY = 'chordpro-editor-settings';

function loadSettings(): EditorSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage indisponível (modo privado, quota excedida, etc.) — ignora silenciosamente
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return { settings, updateSetting, resetSettings };
}