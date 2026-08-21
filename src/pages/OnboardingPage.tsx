/**
@license
SPDX-License-Identifier: Apache-2.0
*/
import { Button, Input, Spinner } from "@hosanna/shared";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  LogOut,
  MailCheck,
  Moon,
  PlusCircle,
  Search,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import bg from "../assets/images/background.webp";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
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
  const { darkMode, toggleDarkMode } = useTheme();
  const { navigate } = useAppNavigate();
  const [mode, setMode] = useState<"choose" | "create" | "join" | "pending">(
    "choose",
  );
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
          (inv) => inv.status === "pending",
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
      const orgData = data as {
        organization?: { slug?: string };
        slug?: string;
      } | null;
      const orgSlug = orgData?.organization?.slug || orgData?.slug;
      if (orgSlug) {
        localStorage.setItem("active_org_slug", orgSlug);
        await authClient.organization.setActive({ organizationSlug: orgSlug });
        navigate(`/${orgSlug}/folders`, { replace: true });
      } else {
        await fetchUserInvitations();
        setProcessingInvId(null);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Erro ao aceitar convite.");
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
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Erro ao recusar convite.");
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-y-auto font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={bg}
          alt="Background"
          className="w-full h-full object-cover dark:opacity-40 transition-opacity duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-[2px] transition-colors duration-500" />
      </div>

      {/* Dark mode toggle button in corner */}
      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label="Alternar tema"
        className="fixed top-4 right-4 z-30 p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 shadow-lg transition-all duration-200"
      >
        {darkMode ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </button>

      <div className="relative max-w-md sm:max-w-lg w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl sm:rounded-4xl shadow-2xl shadow-black/30 p-5 sm:p-7 transition-all duration-300 z-20 my-auto max-h-[92vh] flex flex-col overflow-y-auto scrollbar-thin animate-in zoom-in-95">
        {/* Branding / Header */}
        <div className="flex flex-col items-center text-center mb-6 select-none shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] mb-2 sm:mb-3 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-105 hover:rotate-2">
            <img
              src="/favicon.png"
              alt="Hosanna Studio"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] object-contain"
            />
          </div>
          <h1 className="font-display font-black tracking-tighter text-slate-900 dark:text-white text-xl sm:text-2xl">
            Hosanna Studio
          </h1>
          {mode === "choose" && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs mx-auto">
              Para começar, selecione uma organização ou crie a sua nova equipa.
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-0.5">
          {mode === "pending" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MailCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                Aprovação Pendente
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                O seu pedido para aderir à organização{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {pendingOrgName}
                </span>{" "}
                aguarda aprovação de um administrador.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 mb-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
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
                              Função:{" "}
                              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                                {inv.role}
                              </span>
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
                  className="w-full flex items-center p-4 border border-slate-200/80 dark:border-slate-800 hover:border-m3-primary dark:hover:border-m3-primary rounded-2xl transition-all group text-left bg-white/50 dark:bg-slate-800/40 hover:shadow-lg hover:shadow-m3-primary/5"
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
                  className="w-full flex items-center p-4 border border-slate-200/80 dark:border-slate-800 hover:border-m3-primary dark:hover:border-m3-primary rounded-2xl transition-all group text-left bg-white/50 dark:bg-slate-800/40 hover:shadow-lg hover:shadow-m3-primary/5"
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
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Criar Organização
                </h3>
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
                onChange={(e) =>
                  setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
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
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Aderir a uma Organização
                </h3>
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
    </div>
  );
};
