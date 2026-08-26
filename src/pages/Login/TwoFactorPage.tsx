/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { Button } from "@hosanna/shared";
import {
  ArrowRight,
  KeyRound,
  MailCheck,
  RefreshCw,
  Shield,
  Smartphone,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../i18n";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";

type TwoFactorMethod = "totp" | "otp" | "backup";

export const TwoFactorPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const { refetch } = useAuth();
  const { t } = useI18n();

  const [method, setMethod] = useState<TwoFactorMethod>("totp");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendOtp = async () => {
    setErrorMsg("");
    setOtpSentMsg("");
    setIsSendingOtp(true);
    const { error } = await authClient.twoFactor.sendOtp({});
    setIsSendingOtp(false);
    if (error) {
      setErrorMsg(error.message || "Erro ao enviar código OTP por e-mail.");
      return;
    }
    setOtpSentMsg("Novo código enviado para o seu e-mail.");
  };

  const handleSwitchMethod = (newMethod: TwoFactorMethod) => {
    setMethod(newMethod);
    setCode("");
    setBackupCode("");
    setErrorMsg("");
    setOtpSentMsg("");
    if (newMethod === "otp") {
      void handleSendOtp();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (method === "backup") {
      if (!backupCode.trim()) {
        setErrorMsg(t("settings.twoFactor.codeRequired"));
        return;
      }
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
        trustDevice,
      });
      setIsLoading(false);
      if (error) {
        setErrorMsg(error.message || t("settings.twoFactor.codeInvalid"));
        return;
      }
    } else if (method === "otp") {
      if (!code.trim() || code.trim().length < 6) {
        setErrorMsg(t("settings.twoFactor.codeRequired"));
        return;
      }
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyOtp({
        code: code.trim(),
        trustDevice,
      });
      setIsLoading(false);
      if (error) {
        setErrorMsg(error.message || t("settings.twoFactor.codeInvalid"));
        return;
      }
    } else {
      if (!code.trim() || code.trim().length < 6) {
        setErrorMsg(t("settings.twoFactor.codeRequired"));
        return;
      }
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
        trustDevice,
      });
      setIsLoading(false);
      if (error) {
        setErrorMsg(error.message || t("settings.twoFactor.codeInvalid"));
        return;
      }
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
      optionalLink="/login"
      optionalMsg={"← " + t("auth.forgotPassword.backToLogin")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center mb-1 text-center">
          <div className="w-12 h-12 bg-m3-primary/10 dark:bg-m3-primary/20 rounded-2xl flex items-center justify-center mb-2 text-m3-primary dark:text-m3-primary-light">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
            {t("auth.twoFactor.title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
            {method === "totp" && t("auth.twoFactor.subtitle")}
            {method === "otp" && "Introduza o código enviado para o seu e-mail"}
            {method === "backup" && t("auth.twoFactor.useBackupCode")}
          </p>
        </div>

        {/* Method selector tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => handleSwitchMethod("totp")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              method === "totp"
                ? "bg-white dark:bg-slate-900 text-m3-primary dark:text-m3-primary-light shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMethod("otp")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              method === "otp"
                ? "bg-white dark:bg-slate-900 text-m3-primary dark:text-m3-primary-light shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <MailCheck className="w-3.5 h-3.5" />
            <span>E-mail</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMethod("backup")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              method === "backup"
                ? "bg-white dark:bg-slate-900 text-m3-primary dark:text-m3-primary-light shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t("auth.twoFactor.backupCodeLabel")}</span>
          </button>
        </div>

        {otpSentMsg && method === "otp" && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium text-center animate-in fade-in">
            {otpSentMsg}
          </div>
        )}

        {/* Input section */}
        {method === "backup" ? (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("auth.twoFactor.backupCodeLabel")}
            </label>
            <input
              type="text"
              placeholder={t("auth.twoFactor.backupCodePlaceholder")}
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.trim())}
              className="w-full h-12 px-4 text-center font-mono tracking-widest text-base uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-m3-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
            />
          </div>
        ) : (
          <OtpInput value={code} onChange={setCode} />
        )}

        {method === "otp" && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-m3-primary hover:underline dark:text-m3-primary-light disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSendingOtp ? "animate-spin" : ""}`}
              />
              <span>Reenviar código por e-mail</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-center pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-m3-primary focus:ring-m3-primary dark:bg-slate-800 cursor-pointer"
            />
            <span>{t("auth.login.rememberMe")}</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{t("auth.twoFactor.verifyBtn")}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </LoginLayout>
  );
};

function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const length = 6;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(length, "").split("").slice(0, length);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const currentDigits = [...digits];
      if (currentDigits[i]) {
        currentDigits[i] = "";
        onChange(currentDigits.join("").trimEnd());
      } else if (i > 0) {
        currentDigits[i - 1] = "";
        onChange(currentDigits.join("").trimEnd());
        inputRefs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      const nextDigits = [...digits];
      nextDigits[i] = "";
      onChange(nextDigits.join(""));
      return;
    }

    const char = raw.slice(-1);
    const nextDigits = [...digits];
    nextDigits[i] = char;
    const newVal = nextDigits.join("");
    onChange(newVal);

    if (i < length - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted);
    const nextFocus = Math.min(pasted.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] && digits[i] !== " " ? digits[i] : ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-m3-primary dark:focus:border-m3-primary-light focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-sm"
        />
      ))}
    </div>
  );
}
