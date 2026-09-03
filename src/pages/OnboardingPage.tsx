/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner } from "@/src/components/common";
import { TranslationKey, useI18n } from "@/src/lib/i18n";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  LogOut,
  MailCheck,
  Moon,
  PlusCircle,
  Search,
  Sun,
  User,
  Users,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import bg from "../assets/images/background.webp";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useSubscription } from "../hooks/useSubscription";
import { authClient } from "../lib/authClient";
import { posthog } from "../lib/posthog";
import { PLAN_PRICING } from "../lib/subscriptions";
import { GoogleTextField } from "./Login/components/GoogleTextField";
import { LanguageSelector } from "./Login/components/LanguageSelector";
import { WorkspaceSwitcher } from "./Login/components/WorkspaceSwitcher";

interface UserInvitation {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  inviterId: string;
}

export const OnboardingPage: React.FC = () => {
  const { user, organization, hasAcceptedTrial, logout, refetch } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { navigate } = useAppNavigate();
  const { t, language } = useI18n();
  const { hasStarted, pendingAction, refresh, startCheckout } =
    useSubscription();
  const [mode, setMode] = useState<
    "choose" | "create" | "join" | "pending" | "trial"
  >("choose");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [searchSlug, setSearchSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingOrgName, setPendingOrgName] = useState("");

  // Check slug availability with debounce
  useEffect(() => {
    const trimmed = orgSlug.trim();
    if (!trimmed) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { error } = await authClient.organization.checkSlug({
          slug: trimmed,
        });
        if (error) {
          setSlugStatus("taken");
        } else {
          setSlugStatus("available");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [orgSlug]);

  // Newly-created org, kept around just long enough to offer the trial step
  const [newOrg, setNewOrg] = useState<{ id: string; slug: string } | null>(
    null,
  );
  const [annual, setAnnual] = useState(false);

  // Invitations state
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isFetchingInvitations, setIsFetchingInvitations] = useState(true);
  const [processingInvId, setProcessingInvId] = useState<string | null>(null);

  const fetchUserInvitations = async () => {
    setIsFetchingInvitations(true);
    try {
      const res = await authClient.organization.listUserInvitations({
        query: {},
      });
      if (res.data) {
        const pendingInvs = (res.data as unknown as UserInvitation[]).filter(
          (inv) => inv.status === "pending",
        );
        setInvitations(pendingInvs);
      }
    } catch {
      // Ignore background invitation fetch error
    } finally {
      setIsFetchingInvitations(false);
    }
  };

  useEffect(() => {
    // Check for a pending invitation token stored before sign-up/sign-in
    const pendingInvitationId = localStorage.getItem("pending_invitation_id");
    if (pendingInvitationId) {
      navigate(`/accept-invitation?id=${pendingInvitationId}`, {
        replace: true,
      });
      return;
    }

    fetchUserInvitations();
  }, []);

  // If the user already has an organization that has never accepted a trial /
  // set up billing (e.g. they created the org and refreshed, or they cancelled
  // at Stripe Checkout and got bounced back here), keep showing the trial step.
  useEffect(() => {
    if (organization && hasAcceptedTrial === false && !newOrg) {
      setNewOrg({ id: organization.id, slug: organization.slug });
      setMode("trial");
    }
  }, [organization, hasAcceptedTrial, newOrg]);

  // While the trial step is showing, poll for the subscription to appear
  useEffect(() => {
    if (mode !== "trial" || !newOrg) return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);
    void refresh();
    return () => window.clearInterval(interval);
  }, [mode, newOrg, refresh]);

  useEffect(() => {
    if (mode === "trial" && newOrg && hasStarted === true) {
      void refetch();
    }
  }, [mode, newOrg, hasStarted, refetch]);

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvId(invitationId);
    setErrorMsg("");
    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Não foi possível aceitar o convite.");
        setProcessingInvId(null);
        return;
      }

      posthog.capture("invitation_accepted", { invitation_id: invitationId });
      await refetch();
      const orgData = data as {
        organization?: { slug?: string };
        slug?: string;
      } | null;
      const orgSlug = orgData?.organization?.slug || orgData?.slug;
      if (orgSlug) {
        localStorage.setItem("active_org_slug", orgSlug);
        await authClient.organization.setActive({ organizationSlug: orgSlug });
        navigate(`/${orgSlug}/folders`, { replace: true });
      } else {
        await fetchUserInvitations();
        setProcessingInvId(null);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Erro ao aceitar convite.");
      setProcessingInvId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvId(invitationId);
    setErrorMsg("");
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Não foi possível recusar o convite.");
        setProcessingInvId(null);
        return;
      }

      posthog.capture("invitation_rejected", { invitation_id: invitationId });
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Erro ao recusar convite.");
    } finally {
      setProcessingInvId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const slug = orgSlug.trim();
    const { data, error } = await authClient.organization.create({
      name: orgName.trim(),
      slug: slug,
    });

    if (error) {
      setIsLoading(false);
      setErrorMsg(error.message || "Falha ao criar a organização.");
      return;
    }

    posthog.capture("organization_created");
    localStorage.setItem("active_org_slug", slug);
    await authClient.organization.setActive({
      organizationSlug: slug,
    });

    await refetch();
    setIsLoading(false);

    const orgId = (data as { id?: string } | null)?.id;
    if (orgId) {
      setNewOrg({ id: orgId, slug });
      setMode("trial");
    }
  };

  const handleStartTrial = async () => {
    if (!newOrg) return;
    setErrorMsg("");
    posthog.capture("onboarding_trial_started", { annual });
    const origin = window.location.origin;
    const { error } = await startCheckout({
      annual,
      locale: language,
      successUrl: `${origin}/${newOrg.slug}/settings?tab=billing&billing=success`,
      cancelUrl: `${origin}/${newOrg.slug}/folders`,
    });
    if (error) {
      setErrorMsg(error);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setPendingOrgName(searchSlug);
      setMode("pending");
    }, 1000);
  };

  const getHeaderTitle = () => {
    if (mode === "create") return t("onboarding.createOrgTab");
    if (mode === "join") return t("onboarding.joinOrgTab");
    if (mode === "pending") return "Aprovação Pendente";
    if (mode === "trial") return t("onboarding.trial.title");
    return "Hosanna Studio";
  };

  const getHeaderSubtitle = () => {
    if (mode === "create") return t("onboarding.step1Desc");
    if (mode === "join") return t("onboarding.joinInviteDesc");
    if (mode === "trial") return t("onboarding.trial.desc");
    if (mode === "choose") return t("onboarding.step1Desc");
    return undefined;
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500/20">
      {/* Dynamic Ambient Background Image with smooth subtle overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={bg}
          alt="Background"
          className="w-full h-full object-cover scale-105 opacity-35 dark:opacity-25 transition-all duration-700 blur-[3px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/70 via-slate-100/85 to-slate-200/95 dark:from-[#131314]/85 dark:via-[#131314]/92 dark:to-[#131314]/98 transition-colors duration-500" />
      </div>

      {/* Top action header */}
      <header className="w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 select-none px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#1e1f20]/70 backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-xs">
            <img
              src="/favicon.png"
              alt="Hosanna Studio"
              className="w-5 h-5 object-contain rounded-md"
            />
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-slate-200">
              Hosanna Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WorkspaceSwitcher />
          <LanguageSelector />
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 dark:bg-[#1e1f20]/70 backdrop-blur-md border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/15 active:scale-95 transition-all shadow-xs cursor-pointer"
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
      <main className="flex-1 w-full flex items-center justify-center p-2 sm:p-3 md:p-4 z-10">
        <div className="w-full max-w-md sm:max-w-124 md:max-w-135 bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-xl sm:border sm:border-slate-200/80 dark:sm:border-[#303134]/90 rounded-2xl sm:rounded-[28px] shadow-lg shadow-black/5 dark:shadow-black/40 px-6 py-4 sm:p-6 md:p-8 transition-all">
          {/* Header Brand & Titles */}
          <div className="flex flex-col items-center text-center mb-7 sm:mb-8 select-none">
            <h1 className="text-2xl sm:text-[26px] font-normal tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              {getHeaderTitle()}
            </h1>

            {getHeaderSubtitle() && (
              <p className="mt-1.5 text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 font-normal max-w-sm">
                {getHeaderSubtitle()}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span className="flex-1 leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Mode: Pending */}
          {mode === "pending" && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <MailCheck className="w-8 h-8" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-[15px]">
                O seu pedido para aderir à organização{" "}
                <strong className="text-slate-900 dark:text-white">
                  {pendingOrgName}
                </strong>{" "}
                aguarda aprovação de um administrador.
              </p>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 rounded-md py-1 px-2.5 inline-block">
                  Estado: Em análise
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-11 rounded-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium text-sm"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("sidebar.logout")}
                </Button>
              </div>
            </div>
          )}

          {/* Mode: Trial */}
          {mode === "trial" && newOrg && (
            <div className="text-center space-y-5">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl p-4 text-left space-y-2.5">
                {(
                  [
                    "onboarding.trial.features.sync",
                    "onboarding.trial.features.unlimited",
                    "onboarding.trial.features.print",
                    "onboarding.trial.features.backups",
                  ] as TranslationKey[]
                ).map((key) => (
                  <div key={key} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {t(key)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Billing interval choice */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-slate-700 rounded-full p-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setAnnual(false)}
                    disabled={pendingAction === "checkout"}
                    className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                      !annual
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t("settings.billing.monthly")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnual(true)}
                    disabled={pendingAction === "checkout"}
                    className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                      annual
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t("settings.billing.annual")}
                  </button>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {annual
                      ? PLAN_PRICING.annual.amount
                      : PLAN_PRICING.monthly.amount}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {annual
                      ? PLAN_PRICING.annual.period
                      : PLAN_PRICING.monthly.period}
                  </span>
                </div>
                {annual && (
                  <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 text-center flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    {t("settings.billing.annualSavings")}
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                className="w-full h-10 sm:h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-none border-0"
                isLoading={pendingAction === "checkout"}
                disabled={pendingAction === "checkout"}
                icon={<CreditCard className="w-4 h-4" />}
                onClick={handleStartTrial}
              >
                {t("onboarding.trial.startBtn")}
              </Button>
              <p className="text-xs text-slate-400">
                {t("onboarding.trial.note")}
              </p>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("sidebar.logout")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode: Choose */}
          {mode === "choose" && (
            <div className="space-y-6">
              {/* Section: Pending Invitations */}
              {isFetchingInvitations ? (
                <div className="flex items-center justify-center p-4">
                  <Spinner
                    size="sm"
                    label={t("settings.members.loadingInvites")}
                  />
                </div>
              ) : invitations.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <MailCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("settings.members.pendingInvites", {
                        count: invitations.length,
                      })}
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {invitations.map((inv) => {
                      const isProcessing = processingInvId === inv.id;
                      return (
                        <div
                          key={inv.id}
                          className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                {inv.organizationName || inv.organizationId}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t("settings.account.profile.role")}:{" "}
                              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                                {inv.role}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleRejectInvitation(inv.id)}
                              className="h-8 px-3 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors text-xs font-medium cursor-pointer"
                            >
                              {t("auth.acceptInvitation.rejectBtn")}
                            </button>
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={isProcessing}
                              disabled={isProcessing}
                              onClick={() => handleAcceptInvitation(inv.id)}
                              className="h-8 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-none border-0"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              {t("auth.acceptInvitation.acceptBtn")}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Action options */}
              <div className="space-y-3">
                {invitations.length > 0 && (
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                    Outras Opções
                  </h3>
                )}

                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className="w-full flex items-center p-4 border border-slate-200 dark:border-slate-700/80 hover:border-blue-600 dark:hover:border-blue-400 rounded-xl transition-all group text-left bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mr-3.5 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                      {t("onboarding.createOrgTab")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("onboarding.step1Desc")}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setMode("join")}
                  className="w-full flex items-center p-4 border border-slate-200 dark:border-slate-700/80 hover:border-blue-600 dark:hover:border-blue-400 rounded-xl transition-all group text-left bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center mr-3.5 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                      {t("onboarding.joinOrgTab")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("onboarding.joinInviteDesc")}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("sidebar.logout")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode: Create */}
          {mode === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <GoogleTextField
                label={t("onboarding.orgNameLabel")}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                autoFocus
              />

              <GoogleTextField
                label={t("onboarding.slugLabel")}
                value={orgSlug}
                onChange={(e) =>
                  setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                required
                error={
                  slugStatus === "taken" ? t("onboarding.slugTaken") : undefined
                }
                helperText={
                  slugStatus === "checking"
                    ? t("onboarding.checkingSlug")
                    : slugStatus === "available"
                      ? t("onboarding.slugAvailable")
                      : "hosanna.app/slug"
                }
                trailingIcon={
                  slugStatus === "checking" ? (
                    <Spinner size="sm" />
                  ) : slugStatus === "available" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : slugStatus === "taken" ? (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : undefined
                }
              />

              <div className="flex items-center justify-between gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 py-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t("common.back")}</span>
                </button>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !orgName.trim() ||
                    !orgSlug.trim() ||
                    slugStatus !== "available"
                  }
                  isLoading={isLoading}
                  className="h-10 sm:h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-none border-0"
                >
                  {t("onboarding.createOrgBtn")}
                </Button>
              </div>
            </form>
          )}

          {/* Mode: Join */}
          {mode === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <GoogleTextField
                label={t("onboarding.slugLabel")}
                placeholder={t("onboarding.slugPlaceholder")}
                value={searchSlug}
                onChange={(e) => setSearchSlug(e.target.value)}
                leadingIcon={<Search className="w-4 h-4" />}
                required
                autoFocus
              />

              <div className="flex items-center justify-between gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 py-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t("common.back")}</span>
                </button>

                <Button
                  type="submit"
                  disabled={isLoading || !searchSlug}
                  isLoading={isLoading}
                  className="h-10 sm:h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-none border-0"
                >
                  {t("onboarding.checkInvitesBtn")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-135 mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0 z-10">
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
};
