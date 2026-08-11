/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Shield,
  Trash2,
  User,
  UserCheck,
  Save,
  PenLine,
} from "lucide-react";
import { Button } from "@hosanna/shared";
import { getRoleBadge, getRoleLabel } from "./settingsUtils";

interface MemberProfilePageProps {
  member: any;
  currentUser: { id: string; role?: string } | null;
  onBack: () => void;
  onRemove: (member: any) => void;
  onApprove: (id: string) => void;
  onRoleChange?: (member: any, newRole: string) => Promise<void>;
  isApproving: boolean;
  showToast: (text: string, variant: any) => void;
}

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({
  member,
  currentUser,
  onBack,
  onRemove,
  onApprove,
  onRoleChange,
  isApproving,
  showToast,
}) => {
  const isSelf = currentUser?.id === member.id;
  const isOrgAdminOrOwner = ["owner", "admin"].includes(
    (currentUser?.role || "").toLowerCase(),
  );
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role || "member");

  const handleSaveRole = async () => {
    if (onRoleChange) {
      await onRoleChange(member, selectedRole);
    } else {
      showToast("Função de utilizador atualizada com sucesso!", "success");
    }
    setIsEditingRole(false);
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
        <div className="h-24 bg-gradient-to-r from-sky-700 via-indigo-700 to-slate-800 relative" />

        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="relative w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden shadow-md bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center">
              {member.logo || member.image ? (
                <img
                  src={member.logo || member.image}
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
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {member.email}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                {getRoleBadge(member.role)}
              </div>
            </div>

            {isOrgAdminOrOwner && !isSelf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(member)}
                icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
              >
                Remover Membro
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Role Management Card */}
      {isOrgAdminOrOwner && (
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
                <option value="owner">Proprietário (Owner)</option>
                <option value="admin">Administrador (Admin)</option>
                <option value="teamLeader">
                  Líder de Equipa (Team Leader)
                </option>
                <option value="editor">Editor</option>
                <option value="musician">Músico</option>
                <option value="guest">Convidado</option>
              </select>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingRole(false)}
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
      )}
    </div>
  );
};
