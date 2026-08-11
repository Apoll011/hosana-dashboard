/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal } from "@hosanna/shared";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  UserPlus,
} from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSync } from "../../contexts/SyncContext";
import { authClient } from "../../lib/authClient";
import { MemberProfilePage } from "./MemberProfilePage";
import { getRoleBadge } from "./settingsUtils";

interface OrgMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string | Date;
  image?: string;
  [key: string]: unknown;
}

export const MembersTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { user, organization } = useAuth();
  const { showToast } = useSync();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Invite Form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const userRole = (user as { role?: string })?.role || "member";
  const isOrgAdminOrOwner = ["owner", "admin"].includes(userRole.toLowerCase());

  // Fetch Better Auth Organization Members
  const {
    data: orgMembersData,
    isLoading: isLoadingOrgMembers,
    refetch: refetchOrgMembers,
  } = useQuery({
    queryKey: ["betterAuthOrgMembers", organization?.id],
    queryFn: async () => {
      try {
        const { data } = await authClient.organization.getFullOrganization();
        if (data && data.members) {
          return data.members.map(
            (m: {
              id: string;
              userId?: string;
              user?: {
                id?: string;
                name?: string;
                email?: string;
                image?: string;
              };
              name?: string;
              email?: string;
              role?: string;
              createdAt?: string | Date;
              image?: string;
            }) => ({
              id: m.id,
              userId: m.userId || m.user?.id || m.id,
              name: m.user?.name || m.name || m.user?.email || "Membro",
              email: m.user?.email || m.email || "",
              role: m.role || "member",
              createdAt: m.createdAt,
              image: m.user?.image || m.image,
            }),
          );
        }
      } catch {
        // Fallback to empty if endpoint fails
      }
      return null;
    },
    enabled: active && !!organization,
  });

  if (!active) return null;

  const members: OrgMember[] = orgMembersData || [];

  const handleRemoveMember = async (member: OrgMember) => {
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: member.id || member.email,
      });
      showToast("Membro removido da organização com sucesso!", "success");
      refetchOrgMembers();
      setSelectedMember(null);
    } catch (err: unknown) {
      showToast(
        "Erro ao remover membro: " +
          ((err as Error).message || "Tente novamente"),
        "error",
      );
    }
  };

  const handleRoleChange = async (member: OrgMember, newRole: string) => {
    try {
      await authClient.organization.updateMemberRole({
        memberId: member.id,
        role: newRole as "owner" | "admin" | "member",
      });
      showToast("Função do membro atualizada com sucesso!", "success");
      refetchOrgMembers();
    } catch (err: unknown) {
      showToast(
        "Erro ao atualizar função: " +
          ((err as Error).message || "Tente novamente"),
        "error",
      );
    }
  };

  if (selectedMember) {
    return (
      <MemberProfilePage
        member={selectedMember}
        currentUser={
          user ? { id: user.id, role: (user as { role?: string }).role } : null
        }
        onBack={() => setSelectedMember(null)}
        onRemove={(m) => handleRemoveMember(m as OrgMember)}
        onApprove={async () => {}}
        onRoleChange={(m, role) => handleRoleChange(m as OrgMember, role)}
        isApproving={false}
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
        role: inviteRole as "owner" | "admin" | "member",
      });

      if (error) {
        showToast(`Erro convidando ${inviteEmail}!`, "error");
      } else {
        showToast(
          `Convite enviado com sucesso para ${inviteEmail}!`,
          "success",
        );
        refetchOrgMembers();
      }

      setInviteName("");
      setInviteEmail("");
      setIsInviteModalOpen(false);
    } catch (err: unknown) {
      showToast((err as Error).message || "Falha ao enviar convite.", "error");
    } finally {
      setIsInviting(false);
    }
  };

  const filteredMembers = members.filter(
    (a: OrgMember) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Subtabs & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-m3-primary/10 text-m3-primary flex items-center gap-1.5">
            Membros Ativos ({members.length})
          </span>
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
      {isLoadingOrgMembers ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />A carregar
          membros da organização...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Nenhum membro encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member: OrgMember) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-m3-primary/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
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
                  <p className="text-xs text-slate-500 truncate">
                    {member.email}
                  </p>
                  <div className="mt-1">{getRoleBadge(member.role)}</div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-m3-primary transition-colors shrink-0" />
            </div>
          ))}
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
                <option value="teamLeader">Lider de Equipa</option>
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
              <Button variant="primary" type="submit" disabled={isInviting}>
                {isInviting ? "A Enviar..." : "Enviar Convite"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
