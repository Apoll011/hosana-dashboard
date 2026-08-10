/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import { ArrowRight, CheckCircle2, Clock, Lock, XCircle } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";
import { PasswordStrengthMeter } from "./components/PasswordStrengthMeter";

type State = "form" | "success" | "expired" | "error";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [state, setState] = useState<State>("form");

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (!token) {
    return (
      <LoginLayout optionalLink="/login" optionalMsg="← Voltar ao login">
        <div className="py-8 flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Link Inválido</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              Este link de recuperação é inválido. Solicite um novo abaixo.
            </p>
          </div>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-m3-primary text-white text-xs font-bold hover:bg-m3-primary-dark transition-all"
          >
            Solicitar novo link
          </Link>
        </div>
      </LoginLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As palavras-passe não coincidem.");
      return;
    }

    setIsLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setIsLoading(false);

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("expir") || msg.includes("invalid")) {
        setState("expired");
      } else {
        setState("error");
        setErrorMsg(error.message || "Erro ao redefinir palavra-passe.");
      }
      return;
    }

    setState("success");
    setTimeout(() => navigate("/login", {
      state: { message: "Palavra-passe redefinida com sucesso!" },
      replace: true,
    }), 2500);
  };

  // ── Success ─────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <LoginLayout optionalLink="/login" optionalMsg="Iniciar Sessão →">
        <div className="py-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-60" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Palavra-passe Redefinida!</h2>
            <p className="text-sm text-slate-500 mt-2">A redirecionar para o login...</p>
          </div>
        </div>
      </LoginLayout>
    );
  }

  // ── Expired ─────────────────────────────────────────────────────────────
  if (state === "expired") {
    return (
      <LoginLayout optionalLink="/login" optionalMsg="← Voltar ao login">
        <div className="py-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Link Expirado</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              O link de recuperação expirou. Solicite um novo.
            </p>
          </div>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-m3-primary text-white text-xs font-bold hover:bg-m3-primary-dark transition-all"
          >
            Solicitar novo link
          </Link>
        </div>
      </LoginLayout>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <LoginLayout
      optionalLink="/login"
      optionalMsg="← Voltar ao login"
      errorMsg={errorMsg}
    >
      <div className="flex flex-col items-center mb-5">
        <div className="w-14 h-14 bg-m3-primary/10 rounded-2xl flex items-center justify-center mb-3">
          <Lock className="w-7 h-7 text-m3-primary" />
        </div>
        <h2 className="font-display font-black text-xl text-slate-900">Nova Palavra-passe</h2>
        <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">
          Escolha uma palavra-passe forte para proteger a sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <Input
            type="password"
            label="Nova Palavra-passe"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 opacity-40" />}
            className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
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
            className={`h-11 rounded-xl transition-all text-sm ${
              passwordMismatch
                ? "border-rose-400 focus:border-rose-500"
                : "border-slate-200 focus:border-m3-primary"
            }`}
          />
          {passwordMismatch && (
            <p className="text-xs font-semibold text-rose-500 pl-1 animate-in fade-in">
              As palavras-passe não coincidem
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-2 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
        >
          <span>Redefinir Palavra-passe</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </LoginLayout>
  );
};
