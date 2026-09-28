/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@/src/components/common";
import { useAuth } from "@/src/contexts/AuthContext";
import { getDatabase } from "@/src/db";
import { useAgenda } from "@/src/hooks/useAgenda";
import { useCollections } from "@/src/hooks/useCollections";
import { useFolders } from "@/src/hooks/useFolders";
import { useServices } from "@/src/hooks/useServices";
import { useAllSongs } from "@/src/hooks/useSongs";
import { useSubscription } from "@/src/hooks/useSubscription";
import { useI18n, type TranslationKey } from "@/src/lib/i18n";
import {
  computeUsageOverview,
  formatBytes,
  type UsageOverviewSummary,
  type UsageResourceId,
} from "@/src/lib/usageOverview";
import { getRoleLabel } from "@/src/utils/settingsUtils";
import {
  Archive,
  CalendarDays,
  ClipboardList,
  Cloud,
  FolderTree,
  HardDrive,
  Infinity as InfinityIcon,
  Layers,
  Music2,
  Trash2,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export interface UsageOverviewTabProps {
  active: boolean;
}

const RESOURCE_ICONS: Record<
  UsageResourceId,
  React.ComponentType<{ className?: string }>
> = {
  songs: Music2,
  members: Users,
  services: ClipboardList,
  events: CalendarDays,
  collections: Layers,
  folders: FolderTree,
  storage: HardDrive,
};

const RESOURCE_LABEL_KEYS: Record<UsageResourceId, TranslationKey> = {
  songs: "analytics.usage.resources.songs",
  members: "analytics.usage.resources.members",
  services: "analytics.usage.resources.services",
  events: "analytics.usage.resources.events",
  collections: "analytics.usage.resources.collections",
  folders: "analytics.usage.resources.folders",
  storage: "analytics.usage.resources.storage",
};

async function countTrashItems(): Promise<number> {
  const db = await getDatabase();
  const collections = [
    db.songs,
    db.folders,
    db.collections,
    db.services,
    db.agendaEvents,
  ] as const;

  let total = 0;
  for (const collection of collections) {
    total += collection
      .getAllRaw()
      .filter((doc) => doc.isDeleted && !doc._deleted).length;
  }
  return total;
}

async function collectSizeSources(): Promise<unknown[]> {
  const db = await getDatabase();
  return [
    ...db.songs.getAllRaw(),
    ...db.folders.getAllRaw(),
    ...db.collections.getAllRaw(),
    ...db.services.getAllRaw(),
    ...db.agendaEvents.getAllRaw(),
  ];
}

async function readStorageEstimate(): Promise<{
  usage: number;
  quota: number;
} | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
      return null;
    }
    const estimate = await navigator.storage.estimate();
    if (estimate.usage == null || estimate.quota == null) return null;
    return { usage: estimate.usage, quota: estimate.quota };
  } catch {
    return null;
  }
}

function UsageBar({
  percentage,
  unlimited,
}: {
  percentage: number | null;
  unlimited: boolean;
}) {
  if (unlimited) {
    return (
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-m3-primary/40" />
      </div>
    );
  }

  const pct = percentage ?? 0;
  const tone =
    pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-m3-primary";

  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${tone}`}
        style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
      />
    </div>
  );
}

export const UsageOverviewTab: React.FC<UsageOverviewTabProps> = ({
  active,
}) => {
  const { t, locale } = useI18n();
  const { organization } = useAuth();
  const { activeSubscription, isTrialing, currentStatus } = useSubscription();
  const { songsQuery } = useAllSongs();
  const { servicesQuery } = useServices(true);
  const { events, isLoading: eventsLoading } = useAgenda();
  const { collections, isLoading: collectionsLoading } = useCollections();
  const { foldersQuery } = useFolders();

  const [trashItems, setTrashItems] = useState(0);
  const [sizeSources, setSizeSources] = useState<unknown[]>([]);
  const [storageEstimate, setStorageEstimate] = useState<{
    usage: number;
    quota: number;
  } | null>(null);
  const [extrasReady, setExtrasReady] = useState(false);

  const songs = songsQuery.data?.songs ?? [];
  const services = servicesQuery.data ?? [];
  const folders = foldersQuery.data?.folders ?? [];
  const foldersLoading = foldersQuery.isLoading;
  const members = organization?.members ?? [];
  const pendingInvitations = (organization?.invitations ?? []).filter(
    (inv) => inv.status === "pending",
  ).length;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function loadExtras() {
      try {
        const [trash, sizes, estimate] = await Promise.all([
          countTrashItems(),
          collectSizeSources(),
          readStorageEstimate(),
        ]);
        if (cancelled) return;
        setTrashItems(trash);
        setSizeSources(sizes);
        setStorageEstimate(estimate);
      } finally {
        if (!cancelled) setExtrasReady(true);
      }
    }

    void loadExtras();
    return () => {
      cancelled = true;
    };
  }, [
    active,
    songs.length,
    services.length,
    events.length,
    collections.length,
    folders.length,
  ]);

  const summary: UsageOverviewSummary = useMemo(
    () =>
      computeUsageOverview({
        songs,
        services,
        events,
        collections,
        folders,
        members,
        pendingInvitations,
        trashItems,
        sizeSources,
        storageEstimate,
      }),
    [
      songs,
      services,
      events,
      collections,
      folders,
      members,
      pendingInvitations,
      trashItems,
      sizeSources,
      storageEstimate,
    ],
  );

  if (!active) return null;

  const isLoading =
    (songsQuery.isLoading && songs.length === 0) ||
    (servicesQuery.isLoading && services.length === 0) ||
    (eventsLoading && events.length === 0) ||
    (collectionsLoading && collections.length === 0) ||
    (foldersLoading && folders.length === 0) ||
    !extrasReady;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  const planStatusKey: TranslationKey =
    currentStatus === "trialing"
      ? "analytics.usage.planStatus.trialing"
      : currentStatus === "active"
        ? "analytics.usage.planStatus.active"
        : "analytics.usage.planStatus.none";

  const formatCount = (n: number) => new Intl.NumberFormat(locale).format(n);

  const formatUsed = (id: UsageResourceId, used: number) => {
    if (id === "storage") return formatBytes(used, locale);
    return formatCount(used);
  };

  const formatLimit = (id: UsageResourceId, limit: number | null) => {
    if (limit == null) return t("analytics.usage.unlimited");
    if (id === "storage") return formatBytes(limit, locale);
    return formatCount(limit);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Plan header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-m3-primary" />
              {t("analytics.usage.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("analytics.usage.desc")}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-m3-primary/10 text-m3-primary text-xs font-bold">
              <InfinityIcon className="w-3.5 h-3.5" />
              {t("settings.billing.planName")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t(planStatusKey)}
              {isTrialing && activeSubscription?.trialEnd
                ? ` · ${t("analytics.usage.trialUntil", {
                    date: new Date(
                      activeSubscription.trialEnd,
                    ).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                  })}`
                : null}
            </span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            {t("analytics.usage.planNote")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {summary.resources.map((item) => {
              const Icon = RESOURCE_ICONS[item.id];
              const unlimited = item.limit == null;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-m3-primary" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {t(RESOURCE_LABEL_KEYS[item.id])}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t("analytics.usage.usedOf", {
                            used: formatUsed(item.id, item.used),
                            limit: formatLimit(item.id, item.limit),
                          })}
                        </span>
                      </div>
                    </div>
                    {unlimited ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
                        <InfinityIcon className="w-3 h-3" />
                        {t("analytics.usage.unlimited")}
                      </span>
                    ) : (
                      <span className="text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                        {item.percentage}%
                      </span>
                    )}
                  </div>
                  <UsageBar
                    percentage={item.percentage}
                    unlimited={unlimited}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-m3-primary" />
              {t("analytics.usage.sections.library")}
            </h3>
          </div>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow
              label={t("analytics.usage.details.songs")}
              value={formatCount(summary.songs)}
            />
            <DetailRow
              label={t("analytics.usage.details.folders")}
              value={formatCount(summary.folders)}
            />
            <DetailRow
              label={t("analytics.usage.details.collections")}
              value={formatCount(summary.collections)}
            />
            <DetailRow
              label={t("analytics.usage.details.uniqueTags")}
              value={formatCount(summary.uniqueTags)}
            />
            <DetailRow
              label={t("analytics.usage.details.estimatedData")}
              value={formatBytes(summary.estimatedDataBytes, locale)}
              hint={t("analytics.usage.details.estimatedDataHint")}
            />
          </dl>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-m3-primary" />
              {t("analytics.usage.sections.workspace")}
            </h3>
          </div>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow
              label={t("analytics.usage.details.members")}
              value={formatCount(summary.members)}
            />
            <DetailRow
              label={t("analytics.usage.details.pendingInvites")}
              value={formatCount(summary.pendingInvitations)}
            />
            {Object.entries(summary.memberRoles)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <DetailRow
                  key={role}
                  label={t("analytics.usage.details.roleCount", {
                    role: getRoleLabel(role, t),
                  })}
                  value={formatCount(count)}
                />
              ))}
          </dl>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Archive className="w-4 h-4 text-m3-primary" />
              {t("analytics.usage.sections.services")}
            </h3>
          </div>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow
              label={t("analytics.usage.details.servicesTotal")}
              value={formatCount(summary.services)}
            />
            <DetailRow
              label={t("analytics.usage.details.servicesActive")}
              value={formatCount(summary.activeServices)}
            />
            <DetailRow
              label={t("analytics.usage.details.servicesArchived")}
              value={formatCount(summary.archivedServices)}
            />
          </dl>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-m3-primary" />
              {t("analytics.usage.sections.agenda")}
            </h3>
          </div>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow
              label={t("analytics.usage.details.eventsTotal")}
              value={formatCount(summary.events)}
            />
            <DetailRow
              label={t("analytics.usage.details.eventsUpcoming")}
              value={formatCount(summary.upcomingEvents)}
            />
            <DetailRow
              label={t("analytics.usage.details.eventsPast")}
              value={formatCount(summary.pastEvents)}
            />
            <DetailRow
              label={t("analytics.usage.details.trash")}
              value={formatCount(summary.trashItems)}
              icon={<Trash2 className="w-3.5 h-3.5 text-slate-400" />}
            />
          </dl>
        </div>
      </div>
    </div>
  );
};

function DetailRow({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">
          {label}
          {hint ? (
            <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-normal">
              {hint}
            </span>
          ) : null}
        </span>
      </dt>
      <dd className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100 shrink-0">
        {value}
      </dd>
    </div>
  );
}
