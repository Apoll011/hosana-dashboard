// ══════════════════════════════════════════════════════════════════════
// ── Reading Modal ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

import { Button, Modal } from "@hosanna/shared";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    passage: string;
    notes: string;
  }) => void;
  initial?: { title: string; content: string; passage: string; notes: string };
}

export const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(initial?.title || "Leitura Responsiva");
  const [content, setContent] = useState(initial?.content || "");
  const [passage, setPassage] = useState(initial?.passage || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "Leitura Responsiva");
      setContent(initial?.content || "");
      setPassage(initial?.passage || "");
      setNotes(initial?.notes || "");
    }
  }, [isOpen, initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leitura Responsiva">
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#F3E8FF" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#7E22CE", color: "white" }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#7E22CE" }}>
              Leitura Responsiva
            </p>
            <p className="text-[11px] text-slate-500">
              Leitura alternada entre dirigente e congregação.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Leitura Responsiva"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Passagem
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            placeholder="Ex: Salmos 136"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Conteúdo da Leitura
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ex: Dirigente: Rendei graças ao Senhor&#10;Congregação: Porque ele é bom..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Dirigente: irmã Maria"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title, content, passage, notes });
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
