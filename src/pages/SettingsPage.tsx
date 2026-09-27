/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { AppWindow, Info, User, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AboutTab } from "../components/settings/AboutTab";
import { AccountTab } from "../components/settings/AccountTab";
import { AppearanceTab } from "../components/settings/AppearanceTab";
import { FeaturesTab } from "../components/settings/FeaturesTab";
import { useOnline } from "../hooks/useOnline";
import { CloudOff } from "lucide-react";

type TabType = "account" | "app" | "features" | "about";

const VALID_TABS: TabType[] = ["account", "app", "features", "about"];

/** Org tabs that now live on `/organization` — redirect for old bookmarks. */
const MOVED_TO_ORGANIZATION = new Set([
  "workspace",
  "members",
  "notifications",
  "billing",
  "general",
  "loginActivity",
]);

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const isOnline = useOnline();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab || !MOVED_TO_ORGANIZATION.has(tab) || !slug) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    navigate(`/${slug}/organization?${next.toString()}`, { replace: true });
  }, [searchParams, slug, navigate]);

  const [activeTab, setActiveTab] = useState<TabType>(
    VALID_TABS.includes(initialTab as TabType)
      ? (initialTab as TabType)
      : "account",
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, activeTab]);

  const tabs = [
    {
      id: "account" as const,
      label: t("settings.tabs.account"),
      icon: User,
      requiresNetwork: true,
      show: true,
    },
    {
      id: "app" as const,
      label: t("settings.tabs.app"),
      icon: AppWindow,
      requiresNetwork: false,
      show: true,
    },
    {
      id: "features" as const,
      label: t("settings.tabs.features"),
      icon: Zap,
      requiresNetwork: false,
      show: true,
    },
    {
      id: "about" as const,
      label: t("settings.tabs.about"),
      icon: Info,
      requiresNetwork: false,
      show: true,
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 dark:bg-m3-bg text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {!isOnline && (
          <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-700 dark:text-amber-300 text-xs">
            <CloudOff className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <span className="font-bold block">
                {t("settings.offlineTitle")}
              </span>
              <span className="opacity-90">{t("settings.offlineDesc")}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isTabDisabled = !isOnline && tab.requiresNetwork;
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
                } ${isTabDisabled ? "opacity-60" : ""}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isTabDisabled && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {t("common.offline")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 pb-12">
          <div
            className={
              !isOnline && activeTab === "account"
                ? "opacity-40 pointer-events-none select-none filter grayscale transition-all"
                : ""
            }
          >
            <AccountTab active={activeTab === "account"} />
          </div>
          <AppearanceTab active={activeTab === "app"} />
          <FeaturesTab active={activeTab === "features"} />
          <AboutTab active={activeTab === "about"} />
        </div>
      </div>
    </div>
  );
};
