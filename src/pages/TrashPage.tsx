/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, Button, EmptyState, Spinner } from "@hosanna/shared";
import {
  Calendar,
  FileMusic,
  Folder as FolderIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";
import React from "react";
import { useTrash } from "../hooks/useTrash";

const TYPE_LABELS: Record<string, string> = {
  folder: "Pasta",
  song: "Cântico",
  service: "Culto",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  folder: <FolderIcon className="w-4 h-4 text-amber-500" />,
  song: <FileMusic className="w-4 h-4 text-sky-500" />,
  service: <Calendar className="w-4 h-4 text-emerald-500" />,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const TrashPage: React.FC = () => {
  const { items, isLoading, restoreItem, isRestoring } = useTrash();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Spinner label="A carregar lixo..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col w-full mx-auto p-4 sm:p-8 max-w-7xl">
        <EmptyState
          icon={<Trash2 className="w-12 h-12 text-m3-primary opacity-40" />}
          title="O lixo está vazio"
          description="Os itens apagados aparecem aqui durante 30 dias antes de serem removidos definitivamente."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="overflow-x-auto border border-m3-border/40 rounded-3xl bg-m3-card shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-m3-sidebar/40 border-b border-m3-border text-[10px] font-black text-m3-secondary uppercase tracking-[0.2em]">
              <th className="py-4 px-6">Nome</th>
              <th className="py-4 px-6">Tipo</th>
              <th className="py-4 px-6">Apagado em</th>
              <th className="py-4 px-6">Remoção definitiva</th>
              <th className="py-4 px-6 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-m3-border/30 text-[13px] font-bold">
            {items.map((item) => (
              <tr
                key={`${item.type}-${item.id}`}
                className="hover:bg-m3-hover/50 transition-colors"
              >
                <td className="py-3 px-6 flex items-center gap-2.5">
                  {TYPE_ICONS[item.type]}
                  <span className="truncate">{item.name}</span>
                </td>
                <td className="py-3 px-6">
                  <Badge variant="slate">{TYPE_LABELS[item.type]}</Badge>
                </td>
                <td className="py-3 px-6 text-m3-secondary font-medium">
                  {formatDate(item.updatedAt)}
                </td>
                <td className="py-3 px-6 text-rose-500 font-medium">
                  {formatDate(item.purgeAt)}
                </td>
                <td className="py-3 px-6 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isRestoring}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => restoreItem(item)}
                  >
                    Restaurar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
