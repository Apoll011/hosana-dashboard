/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@/src/components/common";
import { SongScoreVisualizer } from "@/src/components/explorer/SongScoreVisualizer";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useAllSongs } from "@/src/hooks/useSongs";
import { useI18n } from "@/src/lib/i18n";
import {
  computeLibraryHealth,
  type ScoreMissingCriterion,
} from "@/src/lib/libraryHealth";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HeartPulse,
  Music2,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

export interface LibraryHealthTabProps {
  active: boolean;
}

function criterionLabel(
  t: (key: string) => string,
  criterion: ScoreMissingCriterion,
): string {
  return t(`analytics.libraryHealth.criteria.${criterion}`);
}

export const LibraryHealthTab: React.FC<LibraryHealthTabProps> = ({
  active,
}) => {
  const { t } = useI18n();
  const { navigate } = useAppNavigate();
  const { slug } = useParams<{ slug: string }>();
  const slugPrefix = slug ? `/${slug}` : "";
  const { songsQuery } = useAllSongs();
  const songs = songsQuery.data?.songs ?? [];
  const isLoading = songsQuery.isLoading;

  const summary = useMemo(() => computeLibraryHealth(songs), [songs]);
  const [expanded, setExpanded] = useState<Set<ScoreMissingCriterion>>(
    () => new Set(),
  );

  if (!active) return null;

  const toggleCategory = (criterion: ScoreMissingCriterion) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(criterion)) next.delete(criterion);
      else next.add(criterion);
      return next;
    });
  };

  const openSong = (songId: string) => {
    navigate(`${slugPrefix}/songs/${songId}`);
  };

  const healthColor =
    summary.healthPercentage >= 80
      ? "text-emerald-500"
      : summary.healthPercentage >= 55
        ? "text-amber-500"
        : "text-rose-500";

  const healthRing =
    summary.healthPercentage >= 80
      ? "stroke-emerald-500"
      : summary.healthPercentage >= 55
        ? "stroke-amber-500"
        : "stroke-rose-500";

  if (isLoading && songs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-m3-primary" />
              {t("analytics.libraryHealth.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("analytics.libraryHealth.desc")}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  className="stroke-slate-100 dark:stroke-slate-800"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className={healthRing}
                  strokeDasharray={`${(summary.healthPercentage / 100) * 326.73} 326.73`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold tabular-nums ${healthColor}`}>
                  {summary.healthPercentage}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t("analytics.libraryHealth.healthLabel")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <span className="block text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  {summary.songCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t("analytics.libraryHealth.statSongs")}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <span className="block text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {summary.healthyCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t("analytics.libraryHealth.statHealthy")}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 col-span-2 sm:col-span-1">
                <span className="block text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {summary.issueCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t("analytics.libraryHealth.statIssues")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized issues */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t("analytics.libraryHealth.issuesTitle")}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("analytics.libraryHealth.issuesDesc")}
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {summary.categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t("analytics.libraryHealth.allHealthyTitle")}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("analytics.libraryHealth.allHealthyDesc")}
                </p>
              </div>
            </div>
          ) : (
            summary.categories.map((category) => {
              const isOpen = expanded.has(category.criterion);
              return (
                <div key={category.criterion}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.criterion)}
                    className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">
                          {criterionLabel(t, category.criterion)}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t("analytics.libraryHealth.affectedCount", {
                            count: category.songs.length,
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                      {category.songs.length}
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="pb-3 px-3 sm:px-6 space-y-1">
                      {category.songs.map((song) => (
                        <li key={`${category.criterion}-${song.id}`}>
                          <button
                            type="button"
                            onClick={() => openSong(song.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-m3-primary/5 border border-transparent hover:border-m3-primary/20 transition-all cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-m3-primary/10">
                              <Music2 className="w-4 h-4 text-slate-400 group-hover:text-m3-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {song.title}
                              </span>
                              {song.artist && (
                                <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {song.artist}
                                </span>
                              )}
                            </div>
                            <SongScoreVisualizer
                              score={song.score}
                              layout="badge"
                              compact
                            />
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-m3-primary shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
