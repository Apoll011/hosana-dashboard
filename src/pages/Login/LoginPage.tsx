/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import { useStatsigClient } from "@statsig/react-bindings";
import { ArrowRight, Lock, Mail, Shield } from "lucide-react";
import React, { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";
import { TurnstileWidget } from "./components/TurnstileWidget";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectMessage = (location.state as any)?.message || "";
  const { refetch } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const captchaRef = useRef<{ reset: () => void }>(null);

  const { client } = useStatsigClient();
  const captchaEnabled = client.checkGate("captchaEnabled");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Por favor, insira o seu e-mail e a sua palavra-passe");
      return;
    }
    if (captchaEnabled && !captchaToken) {
      setErrorMsg("Por favor complete o CAPTCHA");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    const { data, error } = await authClient.signIn.email({
      email: email.trim(),
      password,
      fetchOptions: captchaEnabled && captchaToken ? {
        headers: { "x-captcha-token": captchaToken },
      } : undefined,
    });

    setIsLoading(false);
    captchaRef.current?.reset();
    setCaptchaToken("");

    if (error) {
      if (error.code === "TWO_FACTOR_REQUIRED" || (error as any)?.status === 403) {
        setTwoFactorPending(true);
        return;
      }
      setErrorMsg(error.message || "Autenticação falhou");
      return;
    }

    if ((data as any)?.twoFactorRedirect) {
      setTwoFactorPending(true);
      return;
    }

    // Refresh session state immediately so ProtectedRoute recognizes authentication
    await refetch();
    navigate("/", { replace: true });
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setOtpError("Insira o código"); return; }
    setOtpError("");
    setIsLoading(true);

    const { error } = await authClient.twoFactor.verifyTotp({ code: otp });
    setIsLoading(false);

    if (error) {
      setOtpError(error.message || "Código inválido");
      return;
    }
    await refetch();
    navigate("/", { replace: true });
  };

  if (twoFactorPending) {
    return (
      <LoginLayout
        errorMsg={otpError}
        optionalLink="/login"
        optionalMsg="← Voltar ao login"
      >
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div className="w-14 h-14 bg-m3-primary/10 rounded-2xl flex items-center justify-center mb-3">
              <Shield className="w-7 h-7 text-m3-primary" />
            </div>
            <h2 className="font-display font-black text-xl text-slate-900">Verificação em 2 Etapas</h2>
            <p className="text-xs text-slate-500 mt-1 text-center">Introduza o código gerado pela sua aplicação autenticadora</p>
          </div>

          <OtpInput value={otp} onChange={setOtp} />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2"
          >
            <span>Verificar</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout
      errorMsg={errorMsg}
      redirectMessage={redirectMessage}
      optionalLink="/register"
      optionalMsg="Criar ou aderir a uma organização"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input
            type="email"
            label="E-mail"
            placeholder="admin@hosanna.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 opacity-40" />}
            className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
          />
          <Input
            type="password"
            label="Palavra-passe"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 opacity-40" />}
            className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
          />
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-m3-primary hover:underline"
          >
            Esqueceu a palavra-passe?
          </Link>
        </div>

        {captchaEnabled && (
          <TurnstileWidget
            ref={captchaRef}
            onVerify={setCaptchaToken}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-2 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
          isLoading={isLoading}
        >
          <span>Iniciar Sessão</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </LoginLayout>
  );
};

// ── OTP Input component ─────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const length = 6;
  const refs = Array.from({ length }, () => useRef<HTMLInputElement>(null));

  const digits = value.padEnd(length, "").split("").slice(0, length);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key === "Backspace") {
      e.preventDefault();
      const next = digits.map((d, idx) => (idx === i ? "" : d)).join("").trimEnd();
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? v : d)).join("");
    onChange(next);
    if (v && i < length - 1) refs[i + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    refs[Math.min(pasted.length, length - 1)].current?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-m3-primary focus:bg-white focus:outline-none transition-all shadow-sm caret-transparent"
        />
      ))}
    </div>
  );
}
