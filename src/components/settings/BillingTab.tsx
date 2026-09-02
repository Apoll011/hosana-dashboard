/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, Button, Spinner } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import {
  AlertTriangle,
  Check,
  CreditCard,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import { posthog } from "../../lib/posthog";

export interface BillingTabProps {
  active: boolean;
  showToast?: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
}

// TODO: replace with the real prices configured for the "cloud" plan in
// Stripe (priceId / annualDiscountPriceId in auth.ts). The Stripe plugin
// does not expose the price amount to the client, so it's kept here for
// display purposes only.
const PLAN_PRICING = {
  monthly: { amount: "€12", period: "/mês" },
  annual: { amount: "€120", period: "/ano" },
};

const PLAN_FEATURE_KEYS = [
  "settings.billing.plan.features.sync",
  "settings.billing.plan.features.unlimited",
  "settings.billing.plan.features.print",
  "settings.billing.plan.features.backups",
  "settings.billing.plan.features.support",
] as const;

interface SubscriptionRow {
  id: string;
  plan: string;
  status: string;
  referenceId: string;
  stripeSubscriptionId?: string | null;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean | null;
  trialStart?: string | Date | null;
  trialEnd?: string | Date | null;
  billingInterval?: string | null;
}

type RedirectAction = "checkout" | "portal" | "restore" | null;

export const BillingTab: React.FC<BillingTabProps> = ({
  active,
  showToast,
}) => {
  const { t } = useI18n();
  const { organization } = useAuth();
  const { granted: canManageBilling, loading: canManageLoading } =
    useCan("billing.manage");
  const { granted: canAccessBilling, loading: canAccessLoading } =
    useCan("billing.access");

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[] | null>(
    null,
  );
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [annual, setAnnual] = useState(false);
  const [pending, setPending] = useState<RedirectAction>(null);

  const orgId = organization?.id;

  const loadSubscriptions = useCallback(async () => {
    if (!orgId) return;
    setIsLoadingSubs(true);
    setFetchError("");
    try {
      const { data, error } = await authClient.subscription.list({
        query: { referenceId: orgId, customerType: "organization" },
      });
      if (error) {
        setFetchError(error.message || t("settings.billing.loadError"));
      } else {
        setSubscriptions((data as SubscriptionRow[]) || []);
      }
    } catch (err) {
      setFetchError((err as Error)?.message || t("settings.billing.loadError"));
    } finally {
      setIsLoadingSubs(false);
    }
  }, [orgId, t]);

  useEffect(() => {
    if (active && orgId) {
      loadSubscriptions();
    }
  }, [active, orgId, loadSubscriptions]);

  if (!active) return null;

  if (canManageLoading || canAccessLoading || !organization) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <Spinner size="lg" label={t("settings.billing.loading")} />
      </div>
    );
  }

  if (!canAccessBilling) {
    return (
      <div className="max-w-4xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("settings.billing.noAccessTitle")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t("settings.billing.noAccessDesc")}
        </p>
      </div>
    );
  }

  const activeSub = subscriptions?.find(
    (s) => s.status === "active" || s.status === "trialing",
  );

  const origin = window.location.origin;
  const slug = organization.slug;
  const successUrl = `${origin}/${slug}/settings?tab=billing&billing=success`;
  const cancelUrl = `${origin}/${slug}/settings?tab=billing`;
  const returnUrl = `${origin}/${slug}/settings?tab=billing`;

  const formatDate = (d?: string | Date | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysLeft = (end?: string | Date | null) => {
    if (!end) return 0;
    const diff = new Date(end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleStart = async () => {
    if (!canManageBilling || !orgId) return;
    setPending("checkout");
    try {
      posthog.capture("billing_checkout_started", { annual });
      const { error } = await authClient.subscription.upgrade({
        plan: "cloud",
        referenceId: orgId,
        customerType: "organization",
        annual,
        successUrl,
        cancelUrl,
      });
      if (error) {
        showToast?.(
          error.message || t("settings.billing.checkoutError"),
          "error",
        );
        setPending(null);
      }
      // On success the browser is redirected to Stripe Checkout, so there's
      // nothing else to do here.
    } catch (err) {
      showToast?.(
        (err as Error)?.message || t("settings.billing.checkoutError"),
        "error",
      );
      setPending(null);
    }
  };

  const handlePortal = async () => {
    if (!canManageBilling || !orgId) return;
    setPending("portal");
    try {
      const { error } = await authClient.subscription.billingPortal({
        referenceId: orgId,
        customerType: "organization",
        returnUrl,
      });
      if (error) {
        showToast?.(
          error.message || t("settings.billing.portalError"),
          "error",
        );
        setPending(null);
      }
    } catch (err) {
      showToast?.(
        (err as Error)?.message || t("settings.billing.portalError"),
        "error",
      );
      setPending(null);
    }
  };

  const handleRestore = async () => {
    if (!canManageBilling || !orgId) return;
    setPending("restore");
    try {
      const { error } = await authClient.subscription.restore({
        referenceId: orgId,
        customerType: "organization",
        subscriptionId: activeSub?.stripeSubscriptionId || undefined,
      });
      if (error) {
        showToast?.(
          error.message || t("settings.billing.restoreError"),
          "error",
        );
      } else {
        showToast?.(t("settings.billing.restoreSuccess"), "success");
        await loadSubscriptions();
      }
    } catch (err) {
      showToast?.(
        (err as Error)?.message || t("settings.billing.restoreError"),
        "error",
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-m3-primary" />
              {t("settings.billing.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("settings.billing.desc")}
            </p>
          </div>
          {!canManageBilling && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              {t("settings.billing.readOnly")}
            </span>
          )}
        </div>

        <div className="p-6">
          {isLoadingSubs ? (
            <div className="flex items-center justify-center py-10">
              <Spinner label={t("settings.billing.loading")} />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {fetchError}
              </p>
              <Button variant="outline" size="sm" onClick={loadSubscriptions}>
                {t("common.retry")}
              </Button>
            </div>
          ) : activeSub ? (
            <div className="space-y-5">
              {/* Status row */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant={
                    activeSub.status === "trialing" ? "amber" : "emerald"
                  }
                  size="md"
                >
                  {activeSub.status === "trialing"
                    ? t("settings.billing.status.trialing")
                    : t("settings.billing.status.active")}
                </Badge>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t("settings.billing.planName")}
                </span>
                {activeSub.billingInterval && (
                  <span className="text-xs text-slate-400 capitalize">
                    ·{" "}
                    {activeSub.billingInterval === "year"
                      ? t("settings.billing.annual")
                      : t("settings.billing.monthly")}
                  </span>
                )}
              </div>

              {/* Trial banner */}
              {activeSub.status === "trialing" && activeSub.trialEnd && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    <strong className="font-bold">
                      {t("settings.billing.trialDaysLeft", {
                        days: daysLeft(activeSub.trialEnd),
                      })}
                    </strong>
                    <p className="mt-0.5 opacity-90">
                      {t("settings.billing.trialEndsOn", {
                        date: formatDate(activeSub.trialEnd),
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel-at-period-end warning */}
              {activeSub.cancelAtPeriodEnd && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-rose-700 dark:text-rose-400">
                      <strong className="font-bold">
                        {t("settings.billing.cancelingTitle")}
                      </strong>
                      <p className="mt-0.5 opacity-90">
                        {t("settings.billing.cancelingDesc", {
                          date: formatDate(activeSub.periodEnd),
                        })}
                      </p>
                    </div>
                  </div>
                  {canManageBilling && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={pending === "restore"}
                      onClick={handleRestore}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      className="shrink-0"
                    >
                      {t("settings.billing.restore")}
                    </Button>
                  )}
                </div>
              )}

              {/* Billing period info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("settings.billing.currentPeriod")}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(activeSub.periodStart)} →{" "}
                    {formatDate(activeSub.periodEnd)}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("settings.billing.nextCharge")}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeSub.cancelAtPeriodEnd
                      ? "—"
                      : formatDate(activeSub.periodEnd)}
                  </span>
                </div>
              </div>

              {canManageBilling && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    isLoading={pending === "portal"}
                    icon={<CreditCard className="w-4 h-4" />}
                    onClick={handlePortal}
                  >
                    {t("settings.billing.manage")}
                  </Button>
                  <p className="text-xs text-slate-400 mt-2">
                    {t("settings.billing.manageDesc")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-m3-primary/20 dark:border-m3-primary/30 bg-m3-primary/5 dark:bg-m3-primary/10 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {t("settings.billing.planName")}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    {t("settings.billing.planDesc")}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setAnnual(false)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      !annual
                        ? "bg-m3-primary text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t("settings.billing.monthly")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnual(true)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      annual
                        ? "bg-m3-primary text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t("settings.billing.annual")}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {annual
                    ? PLAN_PRICING.annual.amount
                    : PLAN_PRICING.monthly.amount}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {annual
                    ? PLAN_PRICING.annual.period
                    : PLAN_PRICING.monthly.period}
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {PLAN_FEATURE_KEYS.map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Check className="w-4 h-4 text-m3-primary shrink-0" />
                    {t(key)}
                  </li>
                ))}
              </ul>

              {canManageBilling ? (
                <div className="mt-6">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto"
                    isLoading={pending === "checkout"}
                    icon={<Sparkles className="w-4 h-4" />}
                    onClick={handleStart}
                  >
                    {t("settings.billing.startTrial")}
                  </Button>
                  <p className="text-xs text-slate-400 mt-2">
                    {t("settings.billing.trialNote")}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-6">
                  {t("settings.billing.askOwner")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
