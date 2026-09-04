/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLink } from "@/src/components/AppLink";
import { Button } from "@/src/components/common";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useI18n } from "@/src/lib/i18n";
import { KeyRound, MailCheck, RefreshCw, Smartphone } from "lucide-react";
import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";
import { GoogleTextField } from "./components/GoogleTextField";

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

  const getSubtitle = () => {
    if (method === "totp") return t("auth.twoFactor.subtitle");
    if (method === "otp") return "Introduza o código enviado para o seu e-mail";
    return t("auth.twoFactor.useBackupCode");
  };

  return (
    <LoginLayout
      headerTitle={t("auth.twoFactor.title")}
      headerSubtitle={getSubtitle()}
      errorMsg={errorMsg}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Method selector tabs */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => handleSwitchMethod("totp")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              method === "totp"
                ? "bg-white dark:bg-[#1e1f20] text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>App</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMethod("otp")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              method === "otp"
                ? "bg-white dark:bg-[#1e1f20] text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <MailCheck className="w-4 h-4" />
            <span>E-mail</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMethod("backup")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              method === "backup"
                ? "bg-white dark:bg-[#1e1f20] text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{t("auth.twoFactor.backupCodeLabel")}</span>
          </button>
        </div>

        {otpSentMsg && method === "otp" && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium text-center border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
            {otpSentMsg}
          </div>
        )}

        {/* Input section */}
        {method === "backup" ? (
          <GoogleTextField
            label={t("auth.twoFactor.backupCodeLabel")}
            placeholder={t("auth.twoFactor.backupCodePlaceholder")}
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value.trim())}
            autoFocus
          />
        ) : (
          <OtpInput value={code} onChange={setCode} />
        )}

        {method === "otp" && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSendingOtp ? "animate-spin" : ""}`}
              />
              <span>Reenviar código por e-mail</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-start pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 rounded-sm border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-[#1e1f20] cursor-pointer"
            />
            <span>{t("auth.login.rememberMe")}</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <AppLink
            to="/login"
            className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline py-2"
          >
            {t("auth.forgotPassword.backToLogin")}
          </AppLink>

          <Button
            type="submit"
            isLoading={isLoading}
            className="h-10 sm:h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-none hover:shadow-xs active:scale-[0.98] border-0"
          >
            {t("auth.twoFactor.verifyBtn")}
          </Button>
        </div>
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
    <div
      className="flex gap-2 sm:gap-3 justify-center my-2"
      onPaste={handlePaste}
    >
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
          className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-medium rounded-sm border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-400 focus:outline-none transition-all"
        />
      ))}
    </div>
  );
}
