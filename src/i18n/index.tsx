/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePersonalSettings } from "../hooks/usePersonalSettings";
import { DEFAULT_LANGUAGE } from "./languages";
import { resolveLanguage } from "./resolve";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { pt } from "./locales/pt";
import {
  LANGUAGE_LOCALE,
  Language,
  MessageDict,
  PersonalLanguage,
} from "./types";

const MESSAGES: Record<Language, MessageDict> = { pt, en, es };

type Interpolation = Record<string, string | number>;

export interface I18nContextValue {
  /** Resolved UI language in effect right now. */
  language: Language;
  /** Raw user preference (may be `"auto"`). */
  personalLanguage: PersonalLanguage;
  /** Locale tag (e.g. "pt-PT") for Intl/toLocale* formatting. */
  locale: string;
  setPersonalLanguage: (lang: PersonalLanguage) => void;
  /** Translate a dot-path key with `{var}` interpolation. */
  t: (key: string, vars?: Interpolation) => string;
  /** Translate a pluralized key (`key.one` / `key.other`) based on `count`. */
  tc: (key: string, count: number, vars?: Interpolation) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(
  dict: MessageDict,
  key: string,
): string | MessageDict | undefined {
  const parts = key.split(".");
  let node: string | MessageDict | undefined = dict;
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = (node as MessageDict)[part];
    } else {
      return undefined;
    }
  }
  return node;
}

function interpolate(template: string, vars?: Interpolation): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  );
}

function resolveString(
  dict: MessageDict,
  key: string,
  vars?: Interpolation,
): string | undefined {
  const value = lookup(dict, key);
  if (typeof value === "string") return interpolate(value, vars);
  return undefined;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { organization } = useAuth();
  const { settings, updateSetting } = usePersonalSettings();

  const personalLanguage: PersonalLanguage = settings.language ?? "auto";
  const orgLocale = organization?.metadata?.settings?.general?.locale;

  const language = useMemo<Language>(() => {
    const browser =
      typeof navigator !== "undefined"
        ? (navigator.languages ?? navigator.language)
        : undefined;
    return resolveLanguage(personalLanguage, orgLocale, browser);
  }, [personalLanguage, orgLocale]);

  const t = useCallback(
    (key: string, vars?: Interpolation): string => {
      const direct = resolveString(MESSAGES[language], key, vars);
      if (direct !== undefined) return direct;

      if (language !== DEFAULT_LANGUAGE) {
        const fallback = resolveString(MESSAGES[DEFAULT_LANGUAGE], key, vars);
        if (fallback !== undefined) return fallback;
      }

      return key;
    },
    [language],
  );

  const tc = useCallback(
    (key: string, count: number, vars?: Interpolation): string => {
      const form = count === 1 ? "one" : "other";
      return t(`${key}.${form}`, { ...vars, count });
    },
    [t],
  );

  const setPersonalLanguage = useCallback(
    (lang: PersonalLanguage) => updateSetting("language", lang),
    [updateSetting],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      personalLanguage,
      locale: LANGUAGE_LOCALE[language],
      setPersonalLanguage,
      t,
      tc,
    }),
    [language, personalLanguage, setPersonalLanguage, t, tc],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

export type { Interpolation as I18nInterpolation };
