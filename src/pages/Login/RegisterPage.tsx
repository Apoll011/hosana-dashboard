/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import { ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";
import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";
import { PasswordStrengthMeter } from "./components/PasswordStrengthMeter";
import { TurnstileWidget } from "./components/TurnstileWidget";

export const RegisterPage: React.FC = () => {
  const { refetch } = useAuth();
  const captchaEnabled = false;

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
      setErrorMsg("Por favor preencha todos os campos obrigatórios.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As palavras-passe não coincidem.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (captchaEnabled && !captchaToken) {
      setErrorMsg("Por favor complete o CAPTCHA.");
      return;
    }

    setIsLoading(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
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
      setErrorMsg(error.message || "Falha ao realizar registo.");
      return;
    }

    await refetch();
    setSuccessState(true);
  };

  if (successState) {
    return (
      <LoginLayout optionalLink="/login" optionalMsg="Iniciar Sessão">
        <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
          <div className="relative w-20 h-20 mb-5">
            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/40 rounded-full animate-ping opacity-60" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Conta Criada!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-xs">
            Enviámos um e-mail de verificação para{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {email}
            </span>
            . Verifique a sua caixa de entrada para ativar a conta.
          </p>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout
      optionalLink="/login"
      optionalMsg="Já tem uma conta? Iniciar Sessão"
      errorMsg={errorMsg}
      compactBranding
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Nome Completo"
          placeholder="Ex: Maria Santos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="w-4 h-4 opacity-40" />}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
        />

        <Input
          type="email"
          label="E-mail"
          placeholder="maria@iglesia.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 opacity-40" />}
          className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-m3-primary transition-all text-sm"
        />

        <div className="space-y-1">
          <Input
            type="password"
            label="Palavra-passe"
            placeholder="••••••••"
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
            label="Confirmar Palavra-passe"
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
              As palavras-passe não coincidem
            </p>
          )}
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
          <span>Criar Conta</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </LoginLayout>
  );
};
