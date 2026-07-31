/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { authApi, Button, Input } from "@hosanna/shared";
import { ArrowRight, Building, Lock, Mail, User } from "lucide-react";
import React, { useState } from "react";
import LoginLayout from "./Layout";

export const RegisterPage: React.FC = () => {
  const [joinSlug, setJoinSlug] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successInfoBanner, setSuccessInfoBanner] = useState("");

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessInfoBanner("");
    setIsLoading(true);

    try {
      if (
        !joinSlug.trim() ||
        !joinName.trim() ||
        !joinEmail.trim() ||
        !joinPassword.trim()
      ) {
        throw new Error("Por favor preencha todos os campos obrigatórios.");
      }

      const res = await authApi.registerUser({
        tenantSlug: joinSlug.trim(),
        name: joinName.trim(),
        email: joinEmail.trim(),
        password: joinPassword,
      });

      setSuccessInfoBanner(
        res.message ||
          "Registration successful! Your account is pending approval by a tenant administrator. You will be able to log in once approved.",
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao realizar registo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginLayout
      optionalLink={"/login"}
      optionalMsg={"Já tem uma conta ativa? Iniciar Sessão"}
      redirectMessage={successInfoBanner}
      errorMsg={errorMsg}
    >
      <form onSubmit={handleJoinSubmit} className="space-y-3.5">
        <Input
          label="Slug da Organização Existente (tenantSlug)"
          placeholder="ex: graca-paz"
          value={joinSlug}
          onChange={(e) => setJoinSlug(e.target.value)}
          icon={<Building className="w-4 h-4 text-slate-400" />}
          className="h-10 rounded-xl text-xs font-mono"
        />

        <Input
          label="Nome Completo (name)"
          placeholder="Ex: Maria Santos"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
          icon={<User className="w-4 h-4 text-slate-400" />}
          className="h-10 rounded-xl text-xs"
        />

        <Input
          type="email"
          label="E-mail (email)"
          placeholder="maria@igreja.org"
          value={joinEmail}
          onChange={(e) => setJoinEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 text-slate-400" />}
          className="h-10 rounded-xl text-xs"
        />

        <Input
          type="password"
          label="Palavra-passe (password)"
          placeholder="••••••••"
          value={joinPassword}
          onChange={(e) => setJoinPassword(e.target.value)}
          icon={<Lock className="w-4 h-4 text-slate-400" />}
          className="h-10 rounded-xl text-xs"
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full h-14 bg-m3-primary hover:bg-m3-primary-dark border-0 font-black uppercase tracking-widest text-[10px] text-white mt-4 rounded-[20px] transition-all shadow-xl shadow-m3-primary/20 hover:shadow-m3-primary/40 flex items-center justify-center gap-2 group"
          isLoading={isLoading}
        >
          <span>Submeter Pedido de Registo</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </LoginLayout>
  );
};
