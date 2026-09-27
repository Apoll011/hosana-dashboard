/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { backupApi } from "@/src/api";
import { Button, Modal } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { useAnyRole, useCan } from "@/src/lib/permissions/client";
import {
  AlertTriangle,
  Bell,
  Building2,
  CloudOff,
  CreditCard,
  History,
  Lock,
  RotateCcw,
  Server,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BillingTab } from "../components/settings/BillingTab";
import { GeneralTab } from "../components/settings/GeneralTab";
import { LoginHistorySection } from "../components/settings/LoginHistorySection";
import { MembersTab } from "../components/settings/MembersTab";
import { NotificationsTab } from "../components/settings/NotificationsTab";
import { WorkspaceTab } from "../components/settings/WorkspaceTab";
import { useSync } from "../contexts/SyncContext";
import { isDemoMode } from "../demo";
import { useOnline } from "../hooks/useOnline";

type TabType =
  | "workspace"
  | "members"
  | "notifications"
  | "billing"
  | "general"
  | "loginActivity";

const VALID_TABS: TabType[] = [
  "workspace",
  "members",
  "notifications",
  "billing",
  "general",
  "loginActivity",
];

export const OrganizationPage: React.FC = () => {
  const { showToast } = useSync();
  const { t } = useI18n();
  const isOnline = useOnline();
  const [searchParams, setSearchParams] = useSearchParams();

  const { matched: canViewLoginActivity, loading: roleLoading } = useAnyRole(
    "owner",
    "admin",
  );
  const { granted: canUpdate } = useCan("organization.update");
  const { granted: canAccessBilling } = useCan("billing.access");
  const { granted: canSendNotifications } = useCan("notification.sent");

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (VALID_TABS.includes(initialTab as TabType)) {
      return initialTab as TabType;
    }
    return "workspace";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, activeTab]);

  // Stripe Checkout return landing (billing=success).
  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      showToast(t("settings.billing.subscribedToast"), "success");
      const next = new URLSearchParams(searchParams);
      next.delete("billing");
      if (!next.get("tab")) next.set("tab", "billing");
      setSearchParams(next, { replace: true });
    }
  }, []);

  // If a non-admin lands on loginActivity, fall back to workspace.
  useEffect(() => {
    if (roleLoading) return;
    if (activeTab === "loginActivity" && !canViewLoginActivity) {
      setActiveTab("workspace");
      const next = new URLSearchParams(searchParams);
      next.set("tab", "workspace");
      setSearchParams(next, { replace: true });
    }
  }, [
    activeTab,
    canViewLoginActivity,
    roleLoading,
    searchParams,
    setSearchParams,
  ]);

  const [pendingRestoreData, setPendingRestoreData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [restoreStats, setRestoreStats] = useState<{
    songs: number;
    folders: number;
    services: number;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [, setIsTogglingWs] = useState(false);

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    setIsRestoring(true);
    try {
      await backupApi.restoreBackup(pendingRestoreData);
      showToast(t("settings.restore.success"), "success");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      showToast(t("settings.restore.error"), "error");
    } finally {
      setIsRestoring(false);
      setPendingRestoreData(null);
      setRestoreStats(null);
    }
  };

  const tabs = [
    {
      id: "workspace" as const,
      label: t("organization.tabs.workspace"),
      icon: Building2,
      requiresNetwork: true,
      show: true,
    },
    {
      id: "members" as const,
      label: t("organization.tabs.members"),
      icon: Users,
      requiresNetwork: true,
      show: true,
    },
    {
      id: "notifications" as const,
      label: t("organization.tabs.notifications"),
      icon: Bell,
      requiresNetwork: true,
      show: canSendNotifications,
    },
    {
      id: "billing" as const,
      label: t("organization.tabs.billing"),
      icon: CreditCard,
      requiresNetwork: true,
      show: canAccessBilling && !isDemoMode(),
    },
    {
      id: "general" as const,
      label: t("organization.tabs.general"),
      icon: Server,
      requiresNetwork: true,
      show: canUpdate,
    },
    {
      id: "loginActivity" as const,
      label: t("organization.tabs.loginActivity"),
      icon: History,
      requiresNetwork: true,
      show: canViewLoginActivity,
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
                {t("organization.offlineTitle")}
              </span>
              <span className="opacity-90">
                {t("organization.offlineDesc")}
              </span>
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
              !isOnline
                ? "opacity-40 pointer-events-none select-none filter grayscale transition-all"
                : ""
            }
          >
            <WorkspaceTab
              active={activeTab === "workspace"}
              showToast={showToast}
              setPendingRestoreData={setPendingRestoreData}
              setRestoreStats={setRestoreStats}
              setIsTogglingWs={setIsTogglingWs}
            />
            <MembersTab active={activeTab === "members"} />
            <NotificationsTab
              active={activeTab === "notifications"}
              showToast={showToast}
            />
            <BillingTab
              active={activeTab === "billing"}
              showToast={showToast}
            />
            <GeneralTab
              active={activeTab === "general"}
              showToast={showToast}
            />
            {activeTab === "loginActivity" && canViewLoginActivity && (
              <div className="max-w-4xl mx-auto w-full">
                <LoginHistorySection
                  scope="organization"
                  active={activeTab === "loginActivity"}
                  titleKey="organization.loginActivity.listTitle"
                  descKey="organization.loginActivity.listDesc"
                />
              </div>
            )}
            {activeTab === "loginActivity" &&
              !roleLoading &&
              !canViewLoginActivity && (
                <div className="max-w-4xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                  <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t("organization.loginActivity.noAccessTitle")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t("organization.loginActivity.noAccessDesc")}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {pendingRestoreData && (
        <Modal
          isOpen={Boolean(pendingRestoreData)}
          onClose={() => {
            setPendingRestoreData(null);
            setRestoreStats(null);
          }}
          title={t("settings.restore.confirmTitle")}
        >
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <strong className="font-bold">
                  {t("settings.restore.attention")}
                </strong>
                <p className="mt-0.5">{t("settings.restore.attentionDesc")}</p>
              </div>
            </div>

            {restoreStats && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  {t("settings.restore.summary")}
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="block text-lg font-extrabold text-m3-primary">
                      {restoreStats.songs}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t("settings.restore.songs")}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="block text-lg font-extrabold text-amber-500">
                      {restoreStats.folders}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t("settings.restore.folders")}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="block text-lg font-extrabold text-emerald-500">
                      {restoreStats.services}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t("settings.restore.services")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingRestoreData(null);
                  setRestoreStats(null);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isRestoring}
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleConfirmRestore}
              >
                {t("settings.restore.restoreNow")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
