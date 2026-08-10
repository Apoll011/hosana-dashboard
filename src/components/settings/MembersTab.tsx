/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Trash2,
  Crown,
  ChevronRight,
  X,
  Mail,
  UserCheck,
} from "lucide-react";
import { Button, Input, Modal } from "@hosanna/shared";
import { useAuth } from "../../contexts/AuthContext";
import { useSync } from "../../contexts/SyncContext";
import { useAdmins } from "../../hooks/useAdmins";
import { getRoleBadge, getRoleLabel } from "./settingsUtils";
import { MemberProfilePage } from "./MemberProfilePage";

export const MembersTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { user } = useAuth();
  const { showToast } = useSync();
  const {
    admins,
    pendingAdmins,
    createAdmin,
    approveAdmin,
    removeAdmin,
    isCreating,
    isApproving,
  } = useAdmins();

  const [activeSubTab, setActiveSubTab] = useState<"members" | "pending">("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Invite Form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  const userRole = (user as any)?.role || "member";
  const isOrgAdminOrOwner = ["owner", "admin"].includes(userRole.toLowerCase());

  if (!active) return null;

  if (selectedMember) {
    return (
      <MemberProfilePage
        member={selectedMember}
        currentUser={user as any}
        onBack={() => setSelectedMember(null)}
        onRemove={async (m) => {
          await removeAdmin(m.id);
          setSelectedMember(null);
        }}
        onApprove={async (id) => {
          await approveAdmin(id);
        }}
        isApproving={isApproving}
        showToast={showToast}
      />
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    try {
      const tempPassword = "Hosanna" + Math.floor(1000 + Math.random() * 9000) + "!";
      await createAdmin({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        password: tempPassword,
        role: inviteRole as any,
      });

      setInviteName("");
      setInviteEmail("");
      setIsInviteModalOpen(false);
    } catch {
      // Error handled in hook
    }
  };

  const filteredAdmins = admins.filter(
    (a: any) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Subtabs & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button
            onClick={() => setActiveSubTab("members")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === "members"
                ? "bg-m3-primary/10 text-m3-primary"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Membros Ativos ({admins.length})
          </button>
          <button
            onClick={() => setActiveSubTab("pending")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "pending"
                ? "bg-m3-primary/10 text-m3-primary"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Aprovações Pendentes
            {pendingAdmins.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {isOrgAdminOrOwner && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Convidar Membro
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-m3-primary"
        />
      </div>

      {/* Content List */}
      {activeSubTab === "members" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAdmins.map((member: any) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-m3-primary/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {member.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  <div className="mt-1">{getRoleBadge(member.role)}</div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-m3-primary transition-colors shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {pendingAdmins.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              Nenhuma aprovação pendente.
            </p>
          ) : (
            pendingAdmins.map((p: any) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{p.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => approveAdmin(p.id)}
                    disabled={isApproving}
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    Aprovar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Convidar Membro para a Organização"
        >
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <Input
              label="Nome Completo"
              placeholder="e.g. Pedro Martins"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
            <Input
              type="email"
              label="E-mail"
              placeholder="e.g. pedro@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Função RBAC na Organização
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
              >
                <option value="admin">Administrador</option>
                <option value="teamLeader">Líder de Equipa</option>
                <option value="editor">Editor</option>
                <option value="musician">Músico</option>
                <option value="guest">Convidado</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isCreating}>
                {isCreating ? "A Enviar..." : "Enviar Convite"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
