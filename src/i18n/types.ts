/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Supported UI languages (short codes). */
export type Language = "pt" | "en" | "es";

/**
 * User preference for language. `"auto"` means "follow the organisation,
 * otherwise the browser, otherwise the default (`pt`)".
 */
export type PersonalLanguage = Language | "auto";

/** A leaf value is always a string; intermediate nodes are nested dicts. */
export type MessageDict = {
  [key: string]: string | MessageDict;
};

/** Locale tag used by `Intl`/`toLocale*` for a given UI language. */
export const LANGUAGE_LOCALE: Record<Language, string> = {
  pt: "pt-PT",
  en: "en-US",
  es: "es-ES",
};
