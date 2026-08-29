/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLink } from "@/src/components/AppLink";
import { Button } from "@/src/components/common";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MailCheck,
  RefreshCw,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useI18n } from "../../i18n";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";

type State = "verifying" | "success" | "expired" | "error" | "pending";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useI18n();

  const [state, setState] = useState<State>(token ? "verifying" : "pending");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) return;
    authClient.verifyEmail({ query: { token } }).then(({ error }) => {
      if (!error) {
        setState("success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2500);
        return;
      }
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("expir")) {
        setState("expired");
      } else {
        setState("error");
      }
    });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    setResendError("");
    const { error } = await authClient.sendVerificationEmail({
      email: resendEmail.trim(),
    });
    setResendLoading(false);
    if (error) {
      setResendError(error.message || "Erro ao reenviar");
      return;
    }
    setResendSuccess(true);
  };

  // ── Pending (no token) ──────────────────────────────────────────────────
  if (state === "pending") {
    return (
      <LoginLayout
        optionalLink="/login"
        optionalMsg={"← " + t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/40 rounded-2xl flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t("auth.verifyEmail.title")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Enviámos um link de verificação. Clique no link para ativar a sua
              conta.
            </p>
          </div>

          <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Não recebeu o e-mail? Reenviar:
            </p>
            {resendSuccess ? (
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 justify-center">
                <CheckCircle2 className="w-4 h-4" />{" "}
                {t("auth.forgotPassword.emailSentTitle")}
              </p>
            ) : (
              <form onSubmit={handleResend} className="flex gap-2">
                <input
                  type="email"
                  placeholder="o-seu@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-m3-primary"
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={resendLoading}
                  className="h-10 px-4 rounded-xl bg-m3-primary hover:bg-m3-primary-dark border-0 text-white text-xs font-bold cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </form>
            )}
            {resendError && (
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">
                {resendError}
              </p>
            )}
          </div>
        </div>
      </LoginLayout>
    );
  }

  // ── Verifying ───────────────────────────────────────────────────────────
  if (state === "verifying") {
    return (
      <LoginLayout
        optionalLink="/login"
        optionalMsg={"← " + t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-m3-primary animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("auth.verifyEmail.verifying")}
          </p>
        </div>
      </LoginLayout>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <LoginLayout
        optionalLink="/login"
        optionalMsg={t("auth.resetPassword.goToLoginBtn") + " →"}
      >
        <div className="py-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/40 rounded-full animate-ping opacity-60" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t("auth.verifyEmail.successTitle")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
              {t("auth.verifyEmail.successDesc")}
            </p>
          </div>
          <AppLink
            to="/login"
            className="mt-2 inline-flex items-center gap-2 h-12 px-6 rounded-[20px] bg-m3-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-m3-primary/20 hover:bg-m3-primary-dark transition-all"
          >
            {t("auth.login.loginBtn")}
          </AppLink>
        </div>
      </LoginLayout>
    );
  }

  // ── Expired ─────────────────────────────────────────────────────────────
  if (state === "expired") {
    return (
      <LoginLayout
        optionalLink="/login"
        optionalMsg={"← " + t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t("auth.acceptInvitation.invalidTitle")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
              {t("auth.acceptInvitation.invalidDesc")}
            </p>
          </div>
          <form onSubmit={handleResend} className="w-full flex gap-2 mt-2">
            <input
              type="email"
              placeholder="o-seu@email.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-m3-primary"
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={resendLoading}
              className="h-10 px-4 rounded-xl bg-m3-primary hover:bg-m3-primary-dark border-0 text-white text-xs font-bold cursor-pointer"
            >
              {resendLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </form>
          {resendSuccess && (
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {t("auth.forgotPassword.emailSentTitle")}
            </p>
          )}
          {resendError && (
            <p className="text-xs text-rose-500 dark:text-rose-400">
              {resendError}
            </p>
          )}
        </div>
      </LoginLayout>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  return (
    <LoginLayout
      optionalLink="/login"
      optionalMsg={"← " + t("auth.forgotPassword.backToLogin")}
    >
      <div className="py-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center">
          <XCircle className="w-10 h-10 text-rose-500 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {t("auth.verifyEmail.errorTitle")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
            {t("auth.verifyEmail.errorDesc")}
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          {"← " + t("auth.forgotPassword.backToLogin")}
        </Link>
      </div>
    </LoginLayout>
  );
};
