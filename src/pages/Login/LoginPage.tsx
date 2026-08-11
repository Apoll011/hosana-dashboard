/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import { useStatsigClient } from "@statsig/react-bindings";
import { ArrowRight, Lock, Mail } from "lucide-react";
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
  const [rememberMe, setRememberMe] = useState(true);
  const captchaRef = useRef<{ reset: () => void }>(null);

  const { client } = useStatsigClient();
  const captchaEnabled = client.checkGate("captcha_enabled");

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
        (error as any)?.status === 403
      ) {
        navigate("/two-factor");
        return;
      }
      setErrorMsg(error.message || "Autenticação falhou");
      return;
    }

    if ((data as any)?.twoFactorRedirect) {
      navigate("/two-factor");
      return;
    }

    // Refresh session state immediately so ProtectedRoute recognizes authentication and active tenant
    await refetch();
    // Fetch latest tenant slug or fallback to onboarding/root
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
            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
          />
          <Input
            type="password"
            label="Palavra-passe"
            placeholder="••••••••"
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
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-m3-primary focus:ring-m3-primary dark:bg-slate-800"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Lembrar-me
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-m3-primary dark:text-m3-primary-light hover:underline"
          >
            Esqueceu a palavra-passe?
          </Link>
        </div>

        {captchaEnabled && (
          <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />
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
