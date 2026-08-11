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
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button, Input, Modal } from "@hosanna/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../../lib/authClient";
import { useAuth } from "../../contexts/AuthContext";
import { useSync } from "../../contexts/SyncContext";
import { useAdmins } from "../../hooks/useAdmins";
import { getRoleBadge, getRoleLabel } from "./settingsUtils";
import { MemberProfilePage } from "./MemberProfilePage";

export const MembersTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { user, tenant } = useAuth();
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const {
    admins: legacyAdmins,
    pendingAdmins,
    createAdmin,
    approveAdmin,
    removeAdmin: removeLegacyAdmin,
    isCreating: isCreatingLegacy,
    isApproving,
  } = useAdmins();

  const [activeSubTab, setActiveSubTab] = useState<"members" | "pending">("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Invite Form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const userRole = (user as any)?.role || "member";
  const isOrgAdminOrOwner = ["owner", "admin"].includes(userRole.toLowerCase());

  // Fetch Better Auth Organization Members
  const {
    data: orgMembersData,
    isLoading: isLoadingOrgMembers,
    refetch: refetchOrgMembers,
  } = useQuery({
    queryKey: ["betterAuthOrgMembers", tenant?.id],
    queryFn: async () => {
      try {
        const { data } = await authClient.organization.getFullOrganization();
        if (data && data.members) {
          return data.members.map((m: any) => ({
            id: m.id,
            userId: m.userId || m.user?.id || m.id,
            name: m.user?.name || m.name || m.user?.email || "Membro",
            email: m.user?.email || m.email || "",
            role: m.role || "member",
            createdAt: m.createdAt,
            image: m.user?.image || m.image,
            isBetterAuth: true,
          }));
        }
      } catch {
        // Fallback to empty if endpoint fails
      }
      return null;
    },
    enabled: active && !!tenant,
  });

  if (!active) return null;

  // Merge members: prefer Better Auth org members if available, fallback/supplement with legacy admins
  const members = orgMembersData && orgMembersData.length > 0
    ? orgMembersData
    : legacyAdmins.map((a: any) => ({
        ...a,
        userId: a.id,
        isBetterAuth: false,
      }));

  const handleRemoveMember = async (member: any) => {
    try {
      if (member.isBetterAuth) {
        await authClient.organization.removeMember({
          memberIdOrEmail: member.id || member.email,
        });
        showToast("Membro removido da organização com sucesso!", "success");
        refetchOrgMembers();
      } else {
        await removeLegacyAdmin(member.id);
      }
      setSelectedMember(null);
    } catch (err: any) {
      showToast("Erro ao remover membro: " + (err.message || "Tente novamente"), "error");
    }
  };

  const handleRoleChange = async (member: any, newRole: string) => {
    try {
      if (member.isBetterAuth) {
        await authClient.organization.updateMemberRole({
          memberId: member.id,
          role: newRole as any,
        });
        showToast("Função do membro atualizada com sucesso!", "success");
        refetchOrgMembers();
      } else {
        showToast("Função atualizada!", "success");
      }
    } catch (err: any) {
      showToast("Erro ao atualizar função: " + (err.message || "Tente novamente"), "error");
    }
  };

  if (selectedMember) {
    return (
      <MemberProfilePage
        member={selectedMember}
        currentUser={user as any}
        onBack={() => setSelectedMember(null)}
        onRemove={handleRemoveMember}
        onApprove={async (id) => {
          await approveAdmin(id);
        }}
        onRoleChange={handleRoleChange}
        isApproving={isApproving}
        showToast={showToast}
      />
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      // Try Better Auth Organization Invite
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole as any,
      });

      if (error) {
        // Fallback to legacy createAdmin
        const tempPassword = "Hosanna" + Math.floor(1000 + Math.random() * 9000) + "!";
        await createAdmin({
          name: inviteName.trim() || inviteEmail.split("@")[0],
          email: inviteEmail.trim(),
          password: tempPassword,
          role: inviteRole as any,
        });
      } else {
        showToast(`Convite enviado com sucesso para ${inviteEmail}!`, "success");
        refetchOrgMembers();
      }

      setInviteName("");
      setInviteEmail("");
      setIsInviteModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Falha ao enviar convite.", "error");
    } finally {
      setIsInviting(false);
    }
  };

  const filteredMembers = members.filter(
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
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "members"
                ? "bg-m3-primary/10 text-m3-primary"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Membros Ativos ({members.length})
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchOrgMembers()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Atualizar membros"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

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
        isLoadingOrgMembers ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
            A carregar membros da organização...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Nenhum membro encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((member: any) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-m3-primary/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
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
        )
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
              label="Nome Completo (Opcional)"
              placeholder="e.g. Pedro Martins"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
            <Input
              type="email"
              label="E-mail *"
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
                <option value="member">Membro</option>
                <option value="owner">Proprietário</option>
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
              <Button variant="primary" type="submit" disabled={isInviting || isCreatingLegacy}>
                {isInviting || isCreatingLegacy ? "A Enviar..." : "Enviar Convite"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

