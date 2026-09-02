/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@/src/components/common";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useI18n } from "@/src/lib/i18n";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"link" | "code">("link");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg(t("settings.account.profile.emailInvalid"));
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    if (mode === "code") {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: `${window.location.origin}/reset-password`,
      });
      setIsLoading(false);

      if (error) {
        setErrorMsg(error.message || "Erro ao enviar código de recuperação.");
        return;
      }

      navigate("/reset-password", {
        state: { email: email.trim(), mode: "code" },
      });
      return;
    }

    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || "Erro ao enviar e-mail.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <LoginLayout
        optionalLink="/login"
        optionalMsg={"← " + t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t("auth.forgotPassword.emailSentTitle")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {t("auth.forgotPassword.emailSentDesc")}
            </p>
          </div>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout
      optionalLink="/login"
      optionalMsg={"← " + t("auth.forgotPassword.backToLogin")}
      errorMsg={errorMsg}
    >
      <div className="flex flex-col items-center mb-4">
        <div className="w-14 h-14 bg-m3-primary/10 dark:bg-m3-primary/20 rounded-2xl flex items-center justify-center mb-3">
          <KeyRound className="w-7 h-7 text-m3-primary dark:text-m3-primary-light" />
        </div>
        <h2 className="font-display font-black text-xl text-slate-900 dark:text-white">
          {t("auth.forgotPassword.title")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center max-w-xs">
          {t("auth.forgotPassword.subtitle")}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-4 border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mode === "link"
              ? "bg-white dark:bg-slate-900 text-m3-primary dark:text-m3-primary-light shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Link</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mode === "code"
              ? "bg-white dark:bg-slate-900 text-m3-primary dark:text-m3-primary-light shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OTP</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label={t("auth.forgotPassword.emailLabel")}
          placeholder="admin@hosanna.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 opacity-40" />}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>{t("auth.forgotPassword.sendLinkBtn")}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </LoginLayout>
  );
};
