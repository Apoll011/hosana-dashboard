/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Link as LinkIcon,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import React, { useRef, useState } from "react";

import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useI18n } from "../../i18n";
import { authClient } from "../../lib/authClient";
import { PasswordStrengthMeter } from "./components/PasswordStrengthMeter";
import { TurnstileWidget } from "./components/TurnstileWidget";
import LoginLayout from "./Layout";

export const RegisterOrganizationPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const alpha_release = false;

  // Step state
  const [step, setStep] = useState(1);

  // Form State
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<{ reset: () => void }>(null);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const passwordMismatch =
    confirmPassword.length > 0 && adminPassword !== confirmPassword;

  // Validation per step
  const isStep1Valid = orgName.trim() !== "" && orgSlug.trim() !== "";
  const isStep2Valid = adminName.trim() !== "" && adminEmail.trim() !== "";
  const isStep3Valid =
    adminPassword.trim() !== "" &&
    adminPassword === confirmPassword &&
    agreedToTerms &&
    !!captchaToken;

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2 && isStep2Valid) setStep(3);
  };

  const handleBack = () => {
    setErrorMsg("");
    if (step > 1) setStep(step - 1);
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isStep3Valid) return;

    setErrorMsg("");
    setIsLoading(true);

    try {
      // 1. Sign up the admin user
      const { error: signUpError, data } = await authClient.signUp.email({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        fetchOptions: captchaToken
          ? {
              headers: { "x-captcha-response": captchaToken },
            }
          : undefined,
      });

      if (signUpError)
        throw new Error(signUpError.message || "Falha ao criar conta.");

      // 2. Create the organization
      const { error: orgError } = await authClient.organization.create({
        name: orgName.trim(),
        slug: orgSlug.trim(),
        userId: data.user.id,
      });

      if (orgError)
        throw new Error(orgError.message || "Falha ao criar organização.");

      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        navigate("/login", {
          state: { message: "Organização criada! Já pode fazer login." },
          replace: true,
        });
      }, 2000);
    } catch (err: unknown) {
      setErrorMsg(
        (err as Error).message ||
          "Falha ao criar organização. Tente novamente.",
      );
      setIsLoading(false);
      captchaRef.current?.reset();
      setCaptchaToken("");
    }
  };

  // Allow pressing Enter to go to next step
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step === 1 && isStep1Valid) handleNext();
      if (step === 2 && isStep2Valid) handleNext();
      if (step === 3 && isStep3Valid) handleCreateSubmit();
    }
  };

  if (!alpha_release) {
    return (
      <LoginLayout
        optionalLink="/login"
        optionalMsg={t("auth.login.title")}
        errorMsg={""}
        titleMb={2}
      >
        <div className="py-14 px-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            {t("auth.tenant.title")}
          </h2>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t("auth.tenant.noOrgs")}
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
      titleMb={2}
    >
      {isSuccess ? (
        <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/40 rounded-full animate-ping opacity-75" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 animate-in zoom-in duration-300 delay-150" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {t("auth.resetPassword.successTitle")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t("auth.resetPassword.successDesc")}
          </p>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
              {t("onboarding.createOrgTab")}
            </h2>
          </div>

          {/* Step Progress Bar with Labels */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[
                { num: 1, label: t("settings.workspace.title") },
                { num: 2, label: t("settings.roles.admin") },
                { num: 3, label: t("settings.tabs.account") },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                    step >= s.num
                      ? "text-m3-primary dark:text-m3-primary-light"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      step >= s.num
                        ? "bg-m3-primary text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 flex flex-col gap-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      step >= i
                        ? "bg-m3-primary shadow-[0_0_10px_rgba(var(--m3-primary-rgb),0.4)]"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form Steps */}
          <form onKeyDown={handleKeyDown} className="relative min-h-55">
            {/* STEP 1: Church Info */}
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {t("onboarding.orgNameLabel")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("onboarding.step1Desc")}
                  </p>
                </div>
                <Input
                  type="text"
                  label={t("onboarding.orgNameLabel")}
                  placeholder={t("onboarding.orgNamePlaceholder")}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  icon={<Building2 className="w-4 h-4 opacity-40" />}
                  autoFocus
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary text-sm transition-colors"
                />
                <Input
                  type="text"
                  label={t("onboarding.slugLabel")}
                  placeholder={t("onboarding.slugPlaceholder")}
                  value={orgSlug}
                  onChange={(e) =>
                    setOrgSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    )
                  }
                  icon={<LinkIcon className="w-4 h-4 opacity-40" />}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary text-sm transition-colors"
                />
              </div>
            )}

            {/* STEP 2: Admin Info */}
            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {t("settings.roles.admin")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("auth.register.subtitle")}
                  </p>
                </div>
                <Input
                  type="text"
                  label={t("auth.register.nameLabel")}
                  placeholder={t("auth.register.namePlaceholder")}
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  icon={<User className="w-4 h-4 opacity-40" />}
                  autoFocus
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary text-sm transition-colors"
                />
                <Input
                  type="email"
                  label={t("auth.register.emailLabel")}
                  placeholder={t("auth.register.emailPlaceholder")}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 opacity-40" />}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary text-sm transition-colors"
                />
              </div>
            )}

            {/* STEP 3: Security & Terms */}
            {step === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {t("settings.account.profile.password")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("auth.resetPassword.subtitle")}
                  </p>
                </div>

                <div className="space-y-1">
                  <Input
                    type="password"
                    label={t("auth.register.passwordLabel")}
                    placeholder="••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4 opacity-40" />}
                    autoFocus
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary text-sm transition-colors"
                  />
                  {adminPassword.length > 0 && (
                    <PasswordStrengthMeter password={adminPassword} />
                  )}
                </div>

                <div className="space-y-1">
                  <Input
                    type="password"
                    label={t("auth.register.confirmPasswordLabel")}
                    placeholder="••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4 opacity-40" />}
                    className={`h-12 rounded-xl dark:bg-slate-800 dark:text-white text-sm transition-colors ${
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

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-m3-primary focus:ring-m3-primary dark:bg-slate-800 cursor-pointer transition-all"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer select-none"
                  >
                    Concordo com os Termos de Serviço e a Política de
                    Privacidade.
                  </label>
                </div>
              </div>
            )}
          </form>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="h-12 px-5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold cursor-pointer"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                className="flex-1 h-12 bg-m3-primary hover:bg-m3-primary-dark border-0 font-bold text-sm text-white rounded-xl transition-all shadow-lg shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{t("settings.twoFactor.continue")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateSubmit}
                variant="primary"
                isLoading={isLoading}
                disabled={!isStep3Valid || isLoading}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 border-0 font-bold text-sm text-white rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span>{t("settings.workspace.saving")}</span>
                ) : (
                  <>
                    <span>{t("onboarding.createOrgBtn")}</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </LoginLayout>
  );
};
