/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLink } from "@/src/components/AppLink";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { Button, Input } from "@hosanna/shared";
import { ArrowRight, Lock, Mail } from "lucide-react";
import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../i18n";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";
import { TurnstileWidget } from "./components/TurnstileWidget";

export const LoginPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const location = useLocation();
  const redirectMessage =
    (location.state as { message?: string })?.message || "";
  const { refetch } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const captchaRef = useRef<{ reset: () => void }>(null);

  const captchaEnabled = false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg(t("auth.login.errorInvalidCredentials"));
      return;
    }
    if (captchaEnabled && !captchaToken) {
      setErrorMsg("Please complete CAPTCHA");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    const { data, error } = await authClient.signIn.email({
      email: email.trim(),
      password,
      rememberMe,
      fetchOptions:
        captchaEnabled && captchaToken
          ? {
              headers: { "x-captcha-token": captchaToken },
            }
          : undefined,
    });

    setIsLoading(false);
    captchaRef.current?.reset();
    setCaptchaToken("");

    if (error) {
      if (
        error.code === "TWO_FACTOR_REQUIRED" ||
        (error as { status?: number })?.status === 403
      ) {
        navigate("/two-factor");
        return;
      }
      setErrorMsg(error.message || t("auth.login.errorInvalidCredentials"));
      return;
    }

    if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
      navigate("/two-factor");
      return;
    }

    await refetch();
    const activeSlug = localStorage.getItem("active_org_slug");
    if (activeSlug) {
      navigate(`/${activeSlug}/folders`, { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  };

  return (
    <LoginLayout
      errorMsg={errorMsg}
      redirectMessage={redirectMessage}
      optionalLink="/register"
      optionalMsg={t("auth.login.registerLink")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input
            type="email"
            label={t("auth.login.emailLabel")}
            placeholder={t("auth.login.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 opacity-40" />}
            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
          />
          <Input
            type="password"
            label={t("auth.login.passwordLabel")}
            placeholder={t("auth.login.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 opacity-40" />}
            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-m3-primary focus:ring-m3-primary dark:bg-slate-800 cursor-pointer"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {t("auth.login.rememberMe")}
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <AppLink
            to="/forgot-password"
            className="text-xs font-semibold text-m3-primary dark:text-m3-primary-light hover:underline"
          >
            {t("auth.login.forgotPasswordLink")}
          </AppLink>
        </div>

        {captchaEnabled && (
          <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-2 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group cursor-pointer"
          isLoading={isLoading}
        >
          <span>{t("auth.login.loginBtn")}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </LoginLayout>
  );
};
