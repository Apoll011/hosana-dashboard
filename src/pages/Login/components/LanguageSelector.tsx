/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LANGUAGES, type LanguageMeta } from "@/src/i18n/languages";
import type { Language } from "@/src/i18n/types";
import { useI18n } from "@/src/i18n";
import { Globe } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export { LANGUAGES as SUPPORTED_LANGUAGES };
export type { Language };

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { language, setPersonalLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang: LanguageMeta =
    LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 shadow-lg transition-all duration-200 inline-flex items-center gap-1.5"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-xs font-bold uppercase hidden sm:inline pr-0.5">
          {currentLang.code}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setPersonalLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 dark:bg-m3-primary/20 text-m3-primary font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
