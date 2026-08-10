/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import { ArrowRight, CheckCircle2, KeyRound, Mail } from "lucide-react";
import React, { useState } from "react";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setErrorMsg("Insira o seu endereço de e-mail."); return; }
    setErrorMsg("");
    setIsLoading(true);

    const { error } = await (authClient as any).forgetPassword({
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
      <LoginLayout optionalLink="/login" optionalMsg="← Voltar ao login">
        <div className="py-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">E-mail Enviado!</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              Se existe uma conta com{" "}
              <span className="font-bold text-slate-700">{email}</span>, receberá
              um e-mail com o link para redefinir a palavra-passe.
            </p>
          </div>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout
      optionalLink="/login"
      optionalMsg="← Voltar ao login"
      errorMsg={errorMsg}
    >
      <div className="flex flex-col items-center mb-5">
        <div className="w-14 h-14 bg-m3-primary/10 rounded-2xl flex items-center justify-center mb-3">
          <KeyRound className="w-7 h-7 text-m3-primary" />
        </div>
        <h2 className="font-display font-black text-xl text-slate-900">Esqueceu a palavra-passe?</h2>
        <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">
          Introduza o seu e-mail e enviaremos um link para redefinir a sua palavra-passe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="E-mail"
          placeholder="admin@hosanna.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 opacity-40" />}
          className="h-11 rounded-xl border-slate-200 focus:border-m3-primary transition-all text-sm"
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
        >
          <span>Enviar Link de Recuperação</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </LoginLayout>
  );
};
