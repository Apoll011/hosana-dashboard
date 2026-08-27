/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Public re-export shim for the i18n module.
 * Exposes `SUPPORTED_LANGUAGES`, `useI18n`, and the `Language` type
 * so that consumers can import from `@/lib/i18n`.
 */

export { useI18n } from "../i18n";
export type { Language } from "../i18n/types";
export { LANGUAGES as SUPPORTED_LANGUAGES } from "../i18n/languages";
