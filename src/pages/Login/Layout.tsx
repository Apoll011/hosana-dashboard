/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLink } from "@/src/components/AppLink";
import { AlertCircle, CheckCircle2, Moon, Sun } from "lucide-react";
import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { LanguageSelector } from "./components/LanguageSelector";

interface LoginLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  redirectMessage?: string;
  errorMsg?: string;
  optionalLink?: string;
  optionalMsg?: string;
  titleMb?: number;
  compactBranding?: boolean;
}

export default function LoginLayout({
  children,
  headerTitle,
  headerSubtitle,
  redirectMessage,
  errorMsg,
  optionalLink,
  optionalMsg,
}: LoginLayoutProps) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#f0f4f9] dark:bg-[#131314] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans relative antialiased selection:bg-blue-500/20">
      {/* Top action header: Language selector & Theme Toggle */}
      <header className="w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          {/* Small brand badge in mobile/header */}
          <div className="flex items-center gap-2 select-none">
            <img
              src="/favicon.png"
              alt="Hosanna Studio"
              className="w-6 h-6 object-contain rounded-md"
            />
            <span className="font-semibold text-sm tracking-tight text-slate-700 dark:text-slate-200">
              Hosanna Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 md:p-8 z-10">
        {/* Google-style authentication card container */}
        <div className="w-full max-w-[448px] sm:max-w-[496px] md:max-w-[540px] bg-white dark:bg-[#1e1f20] sm:border sm:border-slate-200 dark:sm:border-[#303134] rounded-2xl sm:rounded-[28px] shadow-sm sm:shadow-md px-6 py-8 sm:p-10 md:p-12 transition-all">
          {/* Header Brand & Titles */}
          <div className="flex flex-col items-center text-center mb-7 sm:mb-8 select-none">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-xs">
              <img
                src="/favicon.png"
                alt="Hosanna Studio"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
              />
            </div>

            <h1 className="text-2xl sm:text-[26px] font-normal tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              {headerTitle || "Hosanna Studio"}
            </h1>

            {headerSubtitle && (
              <p className="mt-1.5 text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 font-normal max-w-sm">
                {headerSubtitle}
              </p>
            )}
          </div>

          {/* Feedback messages */}
          {redirectMessage && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span className="flex-1 leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Main Form/Content Body */}
          <div className="w-full">{children}</div>

          {/* Bottom helper link if specified */}
          {optionalLink && optionalMsg && (
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-[#303134] text-center">
              <AppLink
                to={optionalLink}
                className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                <span>{optionalMsg}</span>
              </AppLink>
            </div>
          )}
        </div>
      </main>

      {/* Footer standard Google style */}
      <footer className="w-full max-w-[540px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>Hosanna Studio &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Ajuda
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Privacidade
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Termos
          </a>
        </div>
      </footer>
    </div>
  );
}
