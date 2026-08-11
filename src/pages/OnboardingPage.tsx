/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Spinner } from "@hosanna/shared";
import {
  Building2,
  Search,
  ArrowRight,
  User,
  LogOut,
  MailCheck,
  Check,
  X,
  PlusCircle,
  Users,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authClient } from "../lib/authClient";

interface UserInvitation {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  inviterId: string;
}

export const OnboardingPage: React.FC = () => {
  const { user, logout, refetch } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"choose" | "create" | "join" | "pending">("choose");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [searchSlug, setSearchSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingOrgName, setPendingOrgName] = useState("");

  // Invitations state
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isFetchingInvitations, setIsFetchingInvitations] = useState(true);
  const [processingInvId, setProcessingInvId] = useState<string | null>(null);

  const fetchUserInvitations = async () => {
    setIsFetchingInvitations(true);
    try {
      const res = await authClient.organization.listUserInvitations();
      if (res.data) {
        // Filter pending invitations
        const pendingInvs = (res.data as unknown as UserInvitation[]).filter(
          (inv) => inv.status === "pending"
        );
        setInvitations(pendingInvs);
      }
    } catch {
      // Ignore background invitation fetch error
    } finally {
      setIsFetchingInvitations(false);
    }
  };

  useEffect(() => {
    fetchUserInvitations();
  }, []);

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvId(invitationId);
    setErrorMsg("");
    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Não foi possível aceitar o convite.");
        setProcessingInvId(null);
        return;
      }

      await refetch();
      const orgSlug = (data as any)?.organization?.slug || (data as any)?.slug;
      if (orgSlug) {
        localStorage.setItem("active_org_slug", orgSlug);
        await authClient.organization.setActive({ organizationSlug: orgSlug });
        navigate(`/${orgSlug}/folders`, { replace: true });
      } else {
        await fetchUserInvitations();
        setProcessingInvId(null);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao aceitar convite.");
      setProcessingInvId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvId(invitationId);
    setErrorMsg("");
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Não foi possível recusar o convite.");
        setProcessingInvId(null);
        return;
      }

      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao recusar convite.");
    } finally {
      setProcessingInvId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const slug = orgSlug.trim();
    const { error } = await authClient.organization.create({
      name: orgName.trim(),
      slug: slug,
    });

    if (error) {
      setIsLoading(false);
      setErrorMsg(error.message || "Falha ao criar a organização.");
      return;
    }

    localStorage.setItem("active_org_slug", slug);
    await authClient.organization.setActive({
      organizationSlug: slug,
    });

    await refetch();
    setIsLoading(false);
    navigate(`/${slug}/folders`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setPendingOrgName(searchSlug);
      setMode("pending");
    }, 1000);
  };

  if (mode === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/5 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <MailCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Aprovação Pendente
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            O seu pedido para aderir à organização{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{pendingOrgName}</span> aguarda aprovação de um administrador.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950/60 rounded-lg py-1 px-3 inline-block">
              Estado: Em análise
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none p-6 md:p-8 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-m3-primary/10 text-m3-primary rounded-2xl mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bem-vindo ao Hosanna
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs mx-auto">
            Para começar, selecione uma organização ou crie a sua nova equipa.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl border border-red-100 dark:border-red-900/40 animate-in fade-in-50">
            {errorMsg}
          </div>
        )}

        {mode === "choose" && (
          <div className="space-y-6">
            
            {/* Section: Pending Invitations (Displayed when user has invitations) */}
            {isFetchingInvitations ? (
              <div className="flex items-center justify-center p-4">
                <Spinner size="sm" label="A procurar convites..." />
              </div>
            ) : invitations.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <MailCheck className="w-4 h-4 text-m3-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Convites Recebidos ({invitations.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {invitations.map((inv) => {
                    const isProcessing = processingInvId === inv.id;
                    return (
                      <div
                        key={inv.id}
                        className="p-4 bg-m3-primary/5 dark:bg-m3-primary/10 border-2 border-m3-primary/20 dark:border-m3-primary/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-m3-primary" />
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {inv.organizationName || inv.organizationId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Função: <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{inv.role}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleRejectInvitation(inv.id)}
                            className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors text-xs font-semibold"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Recusar
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isProcessing}
                            disabled={isProcessing}
                            onClick={() => handleAcceptInvitation(inv.id)}
                            className="h-9 px-4 rounded-xl bg-m3-primary hover:bg-m3-primary-dark text-white text-xs font-bold shadow-md shadow-m3-primary/20"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Aceitar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Section: Action Cards */}
            <div className="space-y-3">
              {invitations.length > 0 && (
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                  Outras Opções
                </h3>
              )}

              <button
                onClick={() => setMode("create")}
                className="w-full flex items-center p-4 border border-slate-200/80 dark:border-slate-800 hover:border-m3-primary dark:hover:border-m3-primary rounded-2xl transition-all group text-left bg-white dark:bg-slate-800/40 hover:shadow-lg hover:shadow-m3-primary/5"
              >
                <div className="w-11 h-11 bg-m3-primary/10 text-m3-primary rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-m3-primary transition-colors text-sm">
                    Criar Organização
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configurar uma nova igreja ou equipa do zero.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-m3-primary group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setMode("join")}
                className="w-full flex items-center p-4 border border-slate-200/80 dark:border-slate-800 hover:border-m3-primary dark:hover:border-m3-primary rounded-2xl transition-all group text-left bg-white dark:bg-slate-800/40 hover:shadow-lg hover:shadow-m3-primary/5"
              >
                <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform group-hover:bg-m3-primary/10 group-hover:text-m3-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-m3-primary transition-colors text-sm">
                    Aderir a uma Organização
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pesquisar pelo identificador (slug) da sua organização.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-m3-primary group-hover:translate-x-1 transition-all" />
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => logout()}
                className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Terminar Sessão</span>
              </button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Criar Organização</h3>
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                ← Voltar
              </button>
            </div>

            <Input
              label="Nome da Organização"
              placeholder="Ex: Igreja Hosanna Lisboa"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
            <Input
              label="Identificador (Slug)"
              placeholder="Ex: hosanna-lisboa"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              required
              className="h-11 rounded-xl"
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 rounded-xl bg-m3-primary hover:bg-m3-primary-dark font-bold text-xs uppercase tracking-wider text-white"
                disabled={isLoading || !orgName || !orgSlug}
                isLoading={isLoading}
              >
                Criar Organização
              </Button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Aderir a uma Organização</h3>
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                ← Voltar
              </button>
            </div>

            <Input
              label="Identificador da Organização (Slug)"
              placeholder="Ex: hosanna-lisboa"
              value={searchSlug}
              onChange={(e) => setSearchSlug(e.target.value)}
              icon={<Search className="w-4 h-4 opacity-40" />}
              required
              className="h-11 rounded-xl"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 rounded-xl bg-m3-primary hover:bg-m3-primary-dark font-bold text-xs uppercase tracking-wider text-white"
                disabled={isLoading || !searchSlug}
                isLoading={isLoading}
              >
                Solicitar Acesso
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
