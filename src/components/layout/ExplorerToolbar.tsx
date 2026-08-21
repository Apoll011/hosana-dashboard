/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Archive,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Service } from "@hosanna/shared";

interface ExplorerToolbarProps {
  isExplorerView: boolean;
  isServicesView: boolean;
  isSongsView: boolean;
  activeFiltersCount: number;
  showArchived: boolean;
  setShowArchived: React.Dispatch<React.SetStateAction<boolean>>;
  archivedServices: Service[];
  sortBy: "title" | "artist" | "updatedAt";
  sortOrder: "asc" | "desc";
  onSortChange: (
    sb: "title" | "artist" | "updatedAt",
    so: "asc" | "desc",
  ) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  density: "comfortable" | "compact";
  onDensityChange: (d: "comfortable" | "compact") => void;
  onOpenFilterPanel: () => void;
}

export const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
  isExplorerView,
  isServicesView,
  isSongsView,
  activeFiltersCount,
  showArchived,
  setShowArchived,
  archivedServices,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
  density,
  onDensityChange,
  onOpenFilterPanel,
}) => {
  if (!isExplorerView && !isServicesView && !isSongsView) return null;

  return (
    <div className="px-4 py-2.5 bg-m3-sidebar/20 border-b border-m3-border/40 flex items-center justify-between gap-3 flex-wrap">
      {/* Left Side: Filter button, Archive button (services), Sort dropdown */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Filter Pop-Up Panel Trigger Button */}
        {isExplorerView && (
          <button
            onClick={onOpenFilterPanel}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer relative ${
              activeFiltersCount > 0
                ? "bg-m3-primary/10 border-m3-primary text-m3-primary shadow-lg shadow-m3-primary/10"
                : "bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text hover:border-m3-primary/30"
            }`}
            title="Abrir Filtros Avançados"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-m3-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}

        {/* Archive Toggle Button (Services View) */}
        {isServicesView && (
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
              showArchived
                ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/10"
                : "bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text hover:border-amber-500/30"
            }`}
            title={
              showArchived ? "Ocultar arquivados" : "Mostrar arquivados"
            }
          >
            <Archive className="w-4 h-4" />
            <span>Arquivados</span>
            {showArchived && archivedServices.length > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                {archivedServices.length}
              </span>
            )}
          </button>
        )}

        {/* Sort Control Button */}
        <div className="flex items-center gap-2 bg-m3-bg border border-m3-border rounded-2xl px-3 py-1.5 text-xs transition-all hover:border-m3-primary/30">
          <ArrowUpDown className="w-4 h-4 text-m3-secondary shrink-0" />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-") as [
                "title" | "artist" | "updatedAt",
                "asc" | "desc",
              ];
              onSortChange(sb, so);
            }}
            className="bg-transparent font-bold text-m3-text focus:outline-none cursor-pointer text-[11px] uppercase tracking-wider"
            title={
              isServicesView
                ? "Organizar cultos"
                : "Organizar ficheiros"
            }
          >
            {isServicesView ? (
              <>
                <option value="updatedAt-desc">Data: Recente</option>
                <option value="updatedAt-asc">Data: Antiga</option>
                <option value="title-asc">Nome (A-Z)</option>
                <option value="title-desc">Nome (Z-A)</option>
              </>
            ) : (
              <>
                <option value="title-asc">Nome (A-Z)</option>
                <option value="title-desc">Nome (Z-A)</option>
                <option value="artist-asc">Artista (A-Z)</option>
                <option value="updatedAt-desc">Data Recente</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Right Side: View Mode Toggle & Density Selector */}
      <div className="flex items-center gap-2.5">
        {/* View Mode Toggle (hidden in Songs view) */}
        {!isSongsView && (
          <div className="flex items-center p-1 bg-m3-bg rounded-2xl border border-m3-border select-none shrink-0 shadow-inner">
            <button
              onClick={() => onViewModeChange("grid")}
              title="Vista em Grelha"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-m3-card text-m3-primary shadow-lg shadow-black/10"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              title="Vista em Lista"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-m3-card text-m3-primary shadow-lg shadow-black/10"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Density Selector (Confortável / Compacto) */}
        <div className="flex items-center gap-2 bg-m3-bg border border-m3-border rounded-2xl px-3 py-1.5 text-xs transition-all hover:border-m3-primary/30">
          <LayoutGrid className="w-4 h-4 text-m3-primary shrink-0" />
          <select
            value={density}
            onChange={(e) =>
              onDensityChange(e.target.value as "comfortable" | "compact")
            }
            className="bg-transparent font-bold text-m3-text focus:outline-none cursor-pointer text-[11px] uppercase tracking-wider"
            title="Densidade de visualização"
          >
            <option value="comfortable">Confortável</option>
            <option value="compact">Compacto</option>
          </select>
        </div>
      </div>
    </div>
  );
};
