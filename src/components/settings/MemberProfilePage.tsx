/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Can, Modal } from "@hosanna/shared";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  LogOut,
  PenLine,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { authClient } from "../../lib/authClient";
import { getRoleBadge, getRoleLabel } from "./settingsUtils";

interface MemberProfilePageProps {
  member: {
    id: string;
    name?: string;
    email?: string;
    role: string;
    status?: string;
    avatar?: string;
    image?: string;
    createdAt?: string | Date;
    [key: string]: unknown;
  };
  currentUser: { id: string; role?: string } | null;
  organizationId?: string;
  onBack: () => void;
  onRemove: (member: { id: string; [key: string]: unknown }) => void;
  onApprove?: (id: string) => void;
  onRoleChange?: (
    member: { id: string; [key: string]: unknown },
    newRole: string,
  ) => Promise<void>;
  isApproving?: boolean;
  showToast: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
}

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({
  member,
  currentUser,
  organizationId,
  onBack,
  onRemove,
  onApprove: _onApprove,
  onRoleChange,
  isApproving: _isApproving,
  showToast,
}) => {
  const isSelf = currentUser?.id === member.id;
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role || "member");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleSaveRole = async () => {
    if (onRoleChange) {
      await onRoleChange(member, selectedRole);
    } else {
      showToast("Função de utilizador atualizada com sucesso!", "success");
    }
    setIsEditingRole(false);
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await authClient.organization.leave({
        organizationId: organizationId || "",
      });
      showToast("Saiu da organização com sucesso.", "success");
      onBack();
    } catch (err: unknown) {
      showToast(
        (err as Error).message || "Falha ao sair da organização.",
        "error",
      );
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
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

  const formatDate = (date?: string | Date) => {
    if (!date) return null;
    try {
      return new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(date));
    } catch {
      return null;
    }
  };

  const joinedDate = formatDate(member.createdAt);
  const isPromotingToOwner =
    selectedRole === "owner" && selectedRole !== member.role;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à lista de membros
      </button>

      {/* Profile Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="h-24 bg-linear-to-r from-sky-700 via-indigo-700 to-slate-800 relative" />

        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="relative w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden shadow-md bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center">
              {member.logo || member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-white">
                  {getUserInitials(member.name)}
                </span>
              )}
            </div>
            {isSelf && (
              <span className="mb-2 text-[10px] font-black uppercase tracking-wider text-m3-primary bg-sky-50 dark:bg-sky-950 px-2 py-1 rounded-md border border-sky-200 dark:border-sky-800">
                Você
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {member.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {member.email}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                {getRoleBadge(member.role)}
              </div>
              {joinedDate && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Membro desde {joinedDate}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Self: leave organization */}
              {isSelf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeaveConfirm(true)}
                  icon={<LogOut className="w-3.5 h-3.5 text-red-500" />}
                >
                  Sair da Organização
                </Button>
              )}

              {/* Others: remove member, gated by permission */}
              {!isSelf && (
                <Can permission="member.delete">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveConfirm(true)}
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                  >
                    Remover Membro
                  </Button>
                </Can>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Management Card */}
      <Can permission="member.update">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-m3-primary" />
              Gestão de Permissões RBAC
            </h3>

            {!isEditingRole && (
              <button
                onClick={() => setIsEditingRole(true)}
                className="text-xs font-bold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PenLine className="w-3.5 h-3.5" />
                Alterar Função
              </button>
            )}
          </div>

          {isEditingRole ? (
            <div className="space-y-3 pt-1">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
              >
                {/* Only an owner can promote someone else to owner */}
                <Can permission="organization.update">
                  <option value="owner">Proprietário (Owner)</option>
                </Can>
                <option value="admin">Administrador (Admin)</option>
                <option value="teamLeader">
                  Líder de Equipa (Team Leader)
                </option>
                <option value="editor">Editor</option>
                <option value="musician">Músico</option>
                <option value="guest">Convidado</option>
              </select>

              {isPromotingToOwner && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Está prestes a tornar {member.name} proprietário da
                    organização. Esta ação é sensível e deve ser confirmada com
                    cuidado.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(member.role || "member");
                    setIsEditingRole(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveRole}
                  icon={<Save className="w-4 h-4" />}
                >
                  Guardar Função
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Função Atual:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {getRoleLabel(member.role)}
              </strong>
            </p>
          )}
        </div>
      </Can>

      {/* Remove confirmation */}
      {showRemoveConfirm && (
        <Modal
          isOpen={showRemoveConfirm}
          onClose={() => setShowRemoveConfirm(false)}
          title="Remover Membro"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tem a certeza que quer remover <strong>{member.name}</strong> da
              organização? Esta pessoa perderá o acesso imediatamente.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onRemove(member);
                  setShowRemoveConfirm(false);
                }}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Remover Membro
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leave confirmation */}
      {showLeaveConfirm && (
        <Modal
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          title="Sair da Organização"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tem a certeza que quer sair desta organização? Vai perder o acesso
              imediatamente e terá de ser convidado novamente para voltar a
              entrar.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={handleLeave}
                disabled={isLeaving}
                icon={<LogOut className="w-4 h-4" />}
              >
                {isLeaving ? "A Sair..." : "Sair da Organização"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
