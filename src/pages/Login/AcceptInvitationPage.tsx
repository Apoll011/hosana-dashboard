/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { Button, Spinner } from "@/src/components/common";
import { Building2, Check, ShieldAlert, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../i18n";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";

interface InvitationData {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  inviterId: string;
}

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get("id");
  const { navigate } = useAppNavigate();
  const { refetch, user, isLoading: isAuthLoading } = useAuth();
  const { t } = useI18n();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "accept" | "reject" | null
  >(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!invitationId) {
      setErrorMsg("Identificador de convite inválido ou ausente.");
      setIsFetching(false);
      return;
    }

    // Wait until auth state is settled before redirecting
    if (isAuthLoading) {
      return;
    }

    // If the user is not logged in, save the invitation token and redirect to register
    if (!user) {
      localStorage.setItem("pending_invitation_id", invitationId);
      navigate("/register", { replace: true });
      return;
    }

    const fetchInvitation = async () => {
      setIsFetching(true);
      setErrorMsg("");
      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        });

        if (error || !data) {
          setErrorMsg(
            error?.message ||
              "Não foi possível carregar os detalhes do convite.",
          );
        } else {
          setInvitation(data as unknown as InvitationData);
        }
      } catch (err: unknown) {
        setErrorMsg(
          (err as Error)?.message || "Ocorreu um erro ao carregar o convite.",
        );
      } finally {
        setIsFetching(false);
      }
    };

    fetchInvitation();
  }, [invitationId, user, isAuthLoading, navigate]);

  const handleAccept = async () => {
    if (!invitationId) return;
    setActionLoading("accept");
    setErrorMsg("");

    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Falha ao aceitar o convite.");
        setActionLoading(null);
        return;
      }

      // Clear pending invitation from storage
      localStorage.removeItem("pending_invitation_id");

      setSuccessMsg(t("auth.acceptInvitation.successDesc"));

      await refetch();
      const orgData = data as {
        organization?: { slug?: string };
        slug?: string;
      } | null;
      const orgSlug = orgData?.organization?.slug || orgData?.slug;
      if (orgSlug) {
        localStorage.setItem("active_org_slug", orgSlug);
        await authClient.organization.setActive({ organizationSlug: orgSlug });
        setTimeout(() => {
          navigate(`/${orgSlug}/folders`, { replace: true });
        }, 1000);
      } else {
        setTimeout(() => {
          navigate("/onboarding", { replace: true });
        }, 1000);
      }
    } catch (err: unknown) {
      setErrorMsg(
        (err as Error)?.message || "Erro inesperado ao aceitar convite.",
      );
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!invitationId) return;
    setActionLoading("reject");
    setErrorMsg("");

    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Falha ao recusar o convite.");
        setActionLoading(null);
        return;
      }

      // Clear pending invitation from storage
      localStorage.removeItem("pending_invitation_id");

      setSuccessMsg(t("settings.members.inviteCancelled", { email: "" }));
      setTimeout(() => {
        if (user) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(
        (err as Error)?.message || "Erro inesperado ao recusar convite.",
      );
      setActionLoading(null);
    }
  };

  return (
    <LoginLayout errorMsg={errorMsg} redirectMessage={successMsg}>
      <div className="py-2 text-center">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Spinner size="md" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("common.loading")}
            </p>
          </div>
        ) : invitation ? (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-m3-primary/10 text-m3-primary dark:bg-m3-primary/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {t("auth.acceptInvitation.title")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t("auth.acceptInvitation.invitedTo")}:
              </p>
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-lg font-bold text-slate-900 dark:text-white block">
                  {invitation.organizationName ||
                    invitation.organizationId ||
                    "Organização Hosanna"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block capitalize">
                  {t("settings.account.profile.role")}:{" "}
                  <strong className="text-m3-primary">{invitation.role}</strong>
                </span>
              </div>
            </div>

            {invitation.status !== "pending" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs rounded-xl border border-amber-200 dark:border-amber-800">
                Estado: <strong>{invitation.status}</strong>.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleReject}
                isLoading={actionLoading === "reject"}
                disabled={actionLoading !== null}
                className="h-12 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 hover:border-red-200 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>{t("auth.acceptInvitation.rejectBtn")}</span>
              </Button>

              <Button
                variant="primary"
                onClick={handleAccept}
                isLoading={actionLoading === "accept"}
                disabled={
                  actionLoading !== null || invitation.status !== "pending"
                }
                className="h-12 rounded-xl bg-m3-primary hover:bg-m3-primary-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-m3-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t("auth.acceptInvitation.acceptBtn")}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t("auth.acceptInvitation.invalidDesc")}
            </p>
          </div>
        )}
      </div>
    </LoginLayout>
  );
};
