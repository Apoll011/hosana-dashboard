import { Button } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Archive, Printer, Trash2, X } from "lucide-react";
import React from "react";

interface BatchActionFloatingBarProps {
  selectedCount: number;
  itemLabel?: string;
  onArchive?: () => void;
  onPrint?: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const BatchActionFloatingBar: React.FC<BatchActionFloatingBarProps> = ({
  selectedCount,
  itemLabel = "cultos",
  onArchive,
  onPrint,
  onDelete,
  onCancel,
}) => {
  if (selectedCount <= 1) return null;
  const { t } = useI18n();
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-3xl shadow-2xl px-5 py-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span className="text-xs font-black uppercase tracking-widest px-2">
        {selectedCount} {itemLabel} selecionados
      </span>
      <div className="h-6 w-px bg-white/20 dark:bg-slate-900/20" />
      {onPrint && (
        <Button
          size="sm"
          variant="ghost"
          icon={<Printer className="w-4 h-4" />}
          onClick={onPrint}
          className="text-sky-400! hover:bg-sky-500/10!"
        >
          {t("common.print")}
        </Button>
      )}
      {onArchive && (
        <Button
          size="sm"
          variant="ghost"
          icon={<Archive className="w-4 h-4" />}
          onClick={onArchive}
          className="text-amber-400! hover:bg-amber-500/10!"
        >
          {t("common.archive")}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        icon={<Trash2 className="w-4 h-4" />}
        onClick={onDelete}
        className="text-rose-400! hover:bg-rose-500/10!"
      >
        {t("common.delete")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<X className="w-4 h-4" />}
        onClick={onCancel}
        className="text-white/70! dark:text-slate-900/70! hover:bg-white/10! dark:hover:bg-slate-900/10!"
      >
        {t("common.cancel")}
      </Button>
    </div>
  );
};
