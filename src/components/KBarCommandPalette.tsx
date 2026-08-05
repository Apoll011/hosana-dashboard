/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionImpl,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarResults,
  KBarSearch,
  useKBar,
  useMatches,
} from "kbar";
import { Command, CornerDownLeft, Search } from "lucide-react";
import React from "react";

export const KBarCommandPaletteUI: React.FC = () => {
  return (
    <KBarPortal>
      <KBarPositioner className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
        <KBarAnimator className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200">
          {/* Header & Search Bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
            <Search className="w-5 h-5 text-[#0284c7] dark:text-sky-400 shrink-0" />
            <KBarSearch
              defaultPlaceholder="Digite um comando ou pesquise no Hosanna Studio..."
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/60 shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <RenderResults />
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  ↓
                </kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  ↵
                </kbd>
                Selecionar
              </span>
            </div>
            <span className="flex items-center gap-1.5 font-bold text-[#0284c7] dark:text-sky-400">
              <Command className="w-3.5 h-3.5" /> Command Palette
            </span>
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
};

function RenderResults() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border-y border-slate-200/50 dark:border-slate-800/50 sticky top-0 backdrop-blur-xs z-10">
            {item}
          </div>
        ) : (
          <ResultItem item={item} active={active} />
        )
      }
    />
  );
}

const ResultItem = React.forwardRef<
  HTMLDivElement,
  { item: ActionImpl; active: boolean }
>(({ item, active }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-5 py-3 flex items-center justify-between cursor-pointer transition-colors ${
        active
          ? "bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 border-l-4 border-[#0284c7] dark:border-sky-400 pl-4"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
        {item.icon && (
          <div
            className={`p-2 rounded-2xl shrink-0 transition-colors ${
              active
                ? "bg-[#0284c7]/15 text-[#0284c7] dark:bg-sky-400/20 dark:text-sky-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {item.icon}
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-bold truncate tracking-tight">
            {item.name}
          </span>
          {item.subtitle && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {item.subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.shortcut?.length ? (
          <div className="flex items-center gap-1">
            {item.shortcut.map((sc, i) => (
              <kbd
                key={i}
                className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700"
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
        {active && (
          <CornerDownLeft className="w-3.5 h-3.5 text-[#0284c7] dark:text-sky-400" />
        )}
      </div>
    </div>
  );
});

ResultItem.displayName = "ResultItem";

export const KBarTriggerButton: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { query } = useKBar();
  return (
    <button
      onClick={() => query.toggle()}
      className={`flex items-center gap-2 px-3 py-2 bg-m3-card hover:bg-m3-hover border border-m3-border rounded-2xl text-xs font-medium text-m3-secondary hover:text-m3-text transition-all cursor-pointer shadow-xs ${className || ""}`}
      title="Abrir Menu de Comandos (Ctrl+K / Cmd+K)"
    >
      <span className="hidden sm:inline font-semibold">Comandos</span>
      <kbd className="px-1.5 py-0.5 rounded-md bg-m3-bg border border-m3-border text-[10px] font-mono font-bold text-m3-secondary">
        ⌘K
      </kbd>
    </button>
  );
};
