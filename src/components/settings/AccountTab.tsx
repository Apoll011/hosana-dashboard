/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@hosanna/shared";
import { Session } from "better-auth";
import {
  Camera,
  CheckCircle2,
  Info,
  KeyRound,
  Loader2,
  Lock,
  MonitorSmartphone,
  PenLine,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSync } from "../../contexts/SyncContext";
import { authClient } from "../../lib/authClient";
import { compressImage, getRoleBadge } from "./settingsUtils";
import { TwoFactorSection } from "./TwoFactor";

const ActiveSessionsSection: React.FC = () => {
  const { showToast } = useSync();

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await authClient.listSessions();
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const refetch = fetchSessions;

  const handleRevoke = async (token: string) => {
    try {
      await authClient.revokeSession({ token });
      showToast("Sessão revogada com sucesso.", "success");
      refetch();
    } catch {
      showToast("Erro ao revogar sessão.", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-slate-400" />
            Sessões Ativas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dispositivos e navegadores atualmente autenticados na sua conta.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Atualizar sessões"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />A carregar
          sessões...
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map(
            (
              sess: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
              },
              idx: number,
            ) => (
              <div
                key={sess.id || idx}
                className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <MonitorSmartphone className="w-4 h-4 text-m3-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {sess.userAgent || "Sessão do Navegador"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      IP: {sess.ipAddress || "Atual"} · Criada a{" "}
                      {new Date(sess.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(sess.token)}
                  className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/50 cursor-pointer"
                >
                  Encerrar
                </button>
              </div>
            ),
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 py-4 text-center">
          Apenas a sessão atual está ativa.
        </p>
      )}
    </div>
  );
};

export const AccountTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { user, refetch: refetchAuth } = useAuth();
  const { showToast } = useSync();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayUser, setDisplayUser] = useState(user);

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftOldPassword, setDraftOldPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftConfirmPassword, setDraftConfirmPassword] = useState("");
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);

  if (!active) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecione um ficheiro de imagem válido.", "error");
      return;
    }

    try {
      setIsCompressingAvatar(true);
      const compressedBase64 = await compressImage(file, 800, 0.8);

      setDisplayUser((prev) =>
        prev ? { ...prev, image: compressedBase64 } : prev,
      );

      await authClient.updateUser({ image: compressedBase64 });
      await refetchAuth();
      showToast("Avatar atualizado com sucesso!", "success");
    } catch (err: unknown) {
      showToast(
        "Erro ao atualizar o avatar: " +
          ((err as Error).message || "Erro de rede"),
        "error",
      );
    } finally {
      setIsCompressingAvatar(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setDisplayUser((prev) => (prev ? { ...prev, image: undefined } : prev));
      await authClient.updateUser({ image: "" });
      await refetchAuth();
      showToast("Avatar removido com sucesso!", "success");
    } catch {
      showToast("Erro ao remover o avatar.", "error");
    }
  };

  const handleSaveName = async () => {
    if (!draftName.trim()) {
      showToast("O nome não pode estar vazio.", "error");
      return;
    }

    try {
      setDisplayUser((prev) => (prev ? { ...prev, name: draftName } : prev));
      setIsEditingName(false);

      await authClient.updateUser({ name: draftName });
      await refetchAuth();
      showToast("Nome guardado com sucesso!", "success");
    } catch {
      showToast("Erro ao guardar o novo nome.", "error");
    }
  };

  const handleSaveEmail = async () => {
    if (!draftEmail.trim() || !draftEmail.includes("@")) {
      showToast("Por favor introduza um e-mail válido.", "error");
      return;
    }

    try {
      setIsEditingEmail(false);
      await authClient.changeEmail({ newEmail: draftEmail });
      await refetchAuth();
      showToast("Pedido de alteração de e-mail enviado!", "success");
    } catch (err: unknown) {
      showToast(
        "Erro ao alterar o e-mail: " +
          ((err as Error).message || "Tente novamente"),
        "error",
      );
    }
  };

  const handleSavePassword = async () => {
    if (!draftOldPassword) {
      showToast("Por favor introduza a sua palavra-passe atual.", "error");
      return;
    }
    if (draftNewPassword.length < 6) {
      showToast(
        "A nova palavra-passe deve ter pelo menos 6 caracteres.",
        "error",
      );
      return;
    }
    if (draftNewPassword !== draftConfirmPassword) {
      showToast("As palavras-passe não coincidem.", "error");
      return;
    }

    try {
      await authClient.changePassword({
        newPassword: draftNewPassword,
        currentPassword: draftOldPassword,
        revokeOtherSessions: true,
      });

      showToast("Palavra-passe alterada com sucesso!", "success");
      setIsEditingPassword(false);
      setDraftOldPassword("");
      setDraftNewPassword("");
      setDraftConfirmPassword("");
    } catch (err: unknown) {
      showToast(
        "Erro ao alterar palavra-passe: " +
          ((err as Error).message || "Verifique a palavra-passe atual"),
        "error",
      );
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl overflow-hidden shadow-md">
                {displayUser?.image ||
                (displayUser as { logo?: string })?.logo ? (
                  <img
                    src={
                      (displayUser?.image ||
                        (displayUser as { logo?: string })?.logo) as string
                    }
                    alt={displayUser?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getUserInitials(displayUser?.name)}</span>
                )}
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isCompressingAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-m3-primary text-white rounded-full shadow-md hover:bg-m3-primary/90 transition-colors cursor-pointer"
                title="Alterar imagem de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {displayUser?.name || "Utilizador"}
                {getRoleBadge(
                  (displayUser as { role?: string })?.role || "member",
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {displayUser?.email}
              </p>
            </div>
          </div>

          {(displayUser?.image || (displayUser as { logo?: string })?.logo) && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 self-start sm:self-center cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover Foto
            </button>
          )}
        </div>
      </div>

      {/* Name Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Nome de Exibição
          </label>
          {!isEditingName && (
            <button
              onClick={() => {
                setDraftName(displayUser?.name || "");
                setIsEditingName(true);
              }}
              className="text-xs font-bold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
        </div>

        {isEditingName ? (
          <div className="space-y-3 pt-1">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Seu nome completo"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingName(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveName}
                icon={<Save className="w-4 h-4" />}
              >
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {displayUser?.name || "—"}
          </p>
        )}
      </div>

      {/* Email Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Endereço de E-mail
          </label>
          {!isEditingEmail && (
            <button
              onClick={() => {
                setDraftEmail(displayUser?.email || "");
                setIsEditingEmail(true);
              }}
              className="text-xs font-bold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              Alterar E-mail
            </button>
          )}
        </div>

        {isEditingEmail ? (
          <div className="space-y-3 pt-1">
            <Input
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="novo.email@exemplo.com"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingEmail(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEmail}
                icon={<Save className="w-4 h-4" />}
              >
                Guardar E-mail
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {displayUser?.email || "—"}
          </p>
        )}
      </div>

      {/* Password Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-m3-primary" />
            Palavra-passe
          </label>
          {!isEditingPassword && (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="text-xs font-bold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Alterar
            </button>
          )}
        </div>

        {isEditingPassword ? (
          <div className="space-y-4 pt-2">
            <Input
              type="password"
              label="Palavra-passe Atual"
              value={draftOldPassword}
              onChange={(e) => setDraftOldPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Nova Palavra-passe"
              value={draftNewPassword}
              onChange={(e) => setDraftNewPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Confirmar Nova Palavra-passe"
              value={draftConfirmPassword}
              onChange={(e) => setDraftConfirmPassword(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingPassword(false);
                  setDraftOldPassword("");
                  setDraftNewPassword("");
                  setDraftConfirmPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePassword}
                icon={<Save className="w-4 h-4" />}
              >
                Atualizar Palavra-passe
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-widest">
            ••••••••••••
          </p>
        )}
      </div>

      {/* Two-Factor Authentication Section */}
      <TwoFactorSection />

      {/* Active Sessions Section */}
      <ActiveSessionsSection />

      {/* Account Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-slate-400" />
          Informações da Conta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              ID do Utilizador
            </span>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
              {displayUser?.id || "—"}
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Função
            </span>
            {getRoleBadge((displayUser as { role?: string })?.role || "member")}
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Estado da Conta
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ativo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
