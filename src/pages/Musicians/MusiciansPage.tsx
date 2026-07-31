/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Modal,
  MusicianToken,
  Spinner,
} from "@hosanna/shared";
import {
  Clock,
  Copy,
  Lock,
  Plus,
  QrCode,
  Share2,
  Smartphone,
  Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MusicianTokenForm } from "../../components/forms/MusicianTokenForm";
import { useSync } from "../../contexts/SyncContext";
import { useMusicians } from "../../hooks/useMusicians";

interface MusiciansPageProps {
  hideHeader?: boolean;
}

export const MusiciansPage: React.FC<MusiciansPageProps> = ({ hideHeader }) => {
  const { showToast } = useSync();
  const context = useOutletContext<any>() || {};
  const actualHideHeader = hideHeader ?? context.hideHeader;
  const {
    tokensQuery,
    createToken,
    revokeToken,
    regenerateToken,
    deleteTokenPermanently,
  } = useMusicians();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeQrModalToken, setActiveQrModalToken] = useState<
    (MusicianToken & { token?: string; qrCode?: string }) | null
  >(null);
  const [revokeTarget, setRevokeTarget] = useState<MusicianToken | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const tokens = tokensQuery.data || [];

  const handleCreateTokenSubmit = async (data: {
    name: string;
    expiresAt: string;
  }) => {
    const newToken = await createToken(data);
    setIsCreateModalOpen(false);
    setActiveQrModalToken(newToken);
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    await revokeToken({
      id: revokeTarget.id,
      updatedAt: revokeTarget.updatedAt,
    });
    setRevokeTarget(null);
  };

  const handleRegenerate = async (tok: MusicianToken) => {
    const newToken = await regenerateToken({
      id: tok.id,
      updatedAt: tok.updatedAt,
    });
    setActiveQrModalToken(newToken);
  };

  const copyShareUrl = (
    token: MusicianToken & { token?: string; accessUrl?: string },
  ) => {
    const accessUrl =
      token.accessUrl ||
      `${window.location.origin}/musician-access?token=${token.token}`;
    if (!token.token && !token.accessUrl) {
      showToast(
        "Acesso indisponível. Por favor, regenere a senha para ver a nova ligação.",
        "error",
      );
      return;
    }
    navigator.clipboard.writeText(accessUrl);
    setCopiedTokenId(token.id);
    showToast(
      "Ligação de acesso para músicos copiada para a área de transferência!",
      "success",
    );
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  return (
    <div
      className={`flex-1 flex flex-col w-full mx-auto space-y-6 overflow-y-auto h-full ${hideHeader ? "p-6" : "p-4 sm:p-6 max-w-7xl"}`}
    >
      {/* Header Banner */}
      {!actualHideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <QrCode className="w-6 h-6 text-[#0284c7]" />
              Acesso a Músicos e Códigos QR
            </h1>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Gerar Senha de Músico
          </Button>
        </div>
      )}

      {/* Floating Action Button for when header is hidden */}
      {hideHeader && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Gerar Senha de Músico
          </Button>
        </div>
      )}

      {/* Tokens List */}
      {tokensQuery.isLoading ? (
        <Spinner label="A carregar chaves de acesso a músicos..." />
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={<Smartphone className="w-8 h-8" />}
          title="Sem senhas ativas"
          description="Gere um código QR ou senha para os membros da equipa visualizarem as pautas do culto nos seus dispositivos."
          actionLabel="Gerar Primeira Senha"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokens.map((tok) => {
            const isExpired = new Date(tok.expiresAt) < new Date();
            const isRevoked = tok.status === "revoked";
            const isActive = !isExpired && !isRevoked;
            const accessUrl = `${window.location.origin}/musician-access?token=${tok.token}`;

            return (
              <div
                key={tok.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={isActive ? "emerald" : "rose"}>
                      {isActive
                        ? "Senha Ativa"
                        : isRevoked
                          ? "Revogada"
                          : "Expirada"}
                    </Badge>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          onClick={() => handleRegenerate(tok)}
                          className="text-[10px] font-bold text-[#0284c7] hover:underline p-1 cursor-pointer"
                          title="Gerar nova senha (a antiga deixará de funcionar)"
                        >
                          Regenerar
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRevokeTarget(tok);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Revogar Acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {tok.name}
                  </h3>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                      <Lock className="w-3 h-3" />
                      <span>{tok.tokenPreview}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(tok.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Placeholder for listed tokens (since secret is not stored) */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-center opacity-40">
                      <QrCode className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-400 max-w-[140px]">
                      O código QR só é visível no momento da criação para sua
                      segurança.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Share2 className="w-3.5 h-3.5" />}
                    onClick={() => handleRegenerate(tok)}
                    className="flex-1 text-[11px]"
                  >
                    Regenerar & Ver QR
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TOKEN MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Gerar Senha de Acesso a Músico"
      >
        <MusicianTokenForm
          onSubmit={handleCreateTokenSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* DISPLAY FULL QR CODE MODAL */}
      <Modal
        isOpen={!!activeQrModalToken}
        onClose={() => setActiveQrModalToken(null)}
        title={`Código QR do Músico — ${activeQrModalToken?.name}`}
      >
        {activeQrModalToken && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-md">
              {activeQrModalToken.qrCode ? (
                <img
                  src={activeQrModalToken.qrCode}
                  alt="QR Code"
                  className="w-[220px] h-[220px]"
                />
              ) : activeQrModalToken.token ? (
                <QRCodeSVG
                  value={`${window.location.origin}/musician-access?token=${activeQrModalToken.token}`}
                  size={220}
                />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-400 italic text-xs">
                  Acesso indisponível. Por favor, regenere a senha.
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 max-w-sm">
              Digitalize este código QR com a câmara do telemóvel para
              visualizar as cifras do culto de domingo imediatamente.
            </p>

            <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                icon={<Copy className="w-4 h-4" />}
                onClick={() => copyShareUrl(activeQrModalToken)}
              >
                Copiar Ligação
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveQrModalToken(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* REVOKE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevokeConfirm}
        title="Revogar Senha de Acesso"
        message={`Tem a certeza de que deseja revogar a senha de acesso "${revokeTarget?.name}"? Os músicos que usam esta ligação perderão o acesso imediatamente.`}
        confirmText="Revogar Senha"
      />
    </div>
  );
};
