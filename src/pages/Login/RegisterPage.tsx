/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import { ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";
import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../i18n";
import { authClient } from "../../lib/authClient";
import { posthog } from "../../lib/posthog";
import LoginLayout from "./Layout";
import { PasswordStrengthMeter } from "./components/PasswordStrengthMeter";
import { TurnstileWidget } from "./components/TurnstileWidget";

export const RegisterPage: React.FC = () => {
  const { refetch } = useAuth();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<{ reset: () => void }>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successState, setSuccessState] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg(
        t("settings.account.profile.invalidImage")
          ? "Por favor preencha todos os campos."
          : "",
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t("auth.register.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t("settings.account.profile.passwordMinLength"));
      return;
    }
    if (!captchaToken) {
      setErrorMsg("Please complete CAPTCHA.");
      return;
    }

    setIsLoading(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      fetchOptions: captchaToken
        ? {
            headers: { "x-captcha-response": captchaToken },
          }
        : undefined,
    });
    setIsLoading(false);

    captchaRef.current?.reset();
    setCaptchaToken("");

    if (error) {
      setErrorMsg(error.message || "Falha ao realizar registo.");
      return;
    }

    posthog.capture("user_registered");
    await refetch();
    setSuccessState(true);
  };

  if (successState) {
    return (
      <LoginLayout optionalLink="/login" optionalMsg={t("auth.login.title")}>
        <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
          <div className="relative w-20 h-20 mb-5">
            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/40 rounded-full animate-ping opacity-60" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {t("auth.register.successTitle")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-xs">
            {t("auth.register.successDesc")}
          </p>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout
      optionalLink="/login"
      optionalMsg={
        t("auth.register.hasAccount") + " " + t("auth.register.loginLink")
      }
      errorMsg={errorMsg}
      compactBranding
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label={t("auth.register.nameLabel")}
          placeholder={t("auth.register.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="w-4 h-4 opacity-40" />}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
        />

        <Input
          type="email"
          label={t("auth.register.emailLabel")}
          placeholder={t("auth.register.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 opacity-40" />}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
        />

        <div className="space-y-1">
          <Input
            type="password"
            label={t("auth.register.passwordLabel")}
            placeholder={t("auth.register.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 opacity-40" />}
            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
          />
          {password.length > 0 && <PasswordStrengthMeter password={password} />}
        </div>

        <div className="space-y-1">
          <Input
            type="password"
            label={t("auth.register.confirmPasswordLabel")}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 opacity-40" />}
            className={`h-11 rounded-xl dark:bg-slate-800 dark:text-white transition-all text-sm ${
              passwordMismatch
                ? "border-rose-400 focus:border-rose-500"
                : "border-slate-200 dark:border-slate-700 focus:border-m3-primary"
            }`}
          />
          {passwordMismatch && (
            <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 pl-1 animate-in fade-in">
              {t("auth.register.passwordMismatch")}
            </p>
          )}
        </div>

        <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />

        <Button
          type="submit"
          variant="primary"
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-2 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group cursor-pointer"
          isLoading={isLoading}
        >
          <span>{t("auth.register.registerBtn")}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </LoginLayout>
  );
};
