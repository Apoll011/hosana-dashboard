/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LibraryHealthTab } from "@/src/components/analytics/LibraryHealthTab";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { HeartPulse } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

type TabType = "libraryHealth";

const VALID_TABS: TabType[] = ["libraryHealth"];

export const AnalyticsPage: React.FC = () => {
  const { t } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { granted: canViewHealth, loading: permLoading } =
    useCan("library.health");

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(
    VALID_TABS.includes(initialTab as TabType)
      ? (initialTab as TabType)
      : "libraryHealth",
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, activeTab]);

  if (permLoading) {
    return null;
  }

  if (!canViewHealth) {
    return <Navigate to={slug ? `/${slug}/folders` : "/"} replace />;
  }

  const tabs = [
    {
      id: "libraryHealth" as const,
      label: t("analytics.tabs.libraryHealth"),
      icon: HeartPulse,
      show: true,
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 dark:bg-m3-bg text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {t("analytics.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("analytics.desc")}
          </p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            if (!tab.show) return null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  const next = new URLSearchParams(searchParams);
                  next.set("tab", tab.id);
                  setSearchParams(next, { replace: true });
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-m3-primary text-white shadow-md shadow-m3-primary/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 pb-12">
          <LibraryHealthTab active={activeTab === "libraryHealth"} />
        </div>
      </div>
    </div>
  );
};
