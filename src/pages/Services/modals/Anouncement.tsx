// ══════════════════════════════════════════════════════════════════════
// ── Announcement Modal ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

import { Button, Modal } from "@hosanna/shared";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DurationField,
  durationInputToSeconds,
  secondsToDurationInput,
} from "./DurationField";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    notes: string;
    duration: number;
  }) => void;
  initial?: {
    title: string;
    content: string;
    notes: string;
    duration?: number;
  };
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(initial?.title || "Avisos da Igreja");
  const [content, setContent] = useState(initial?.content || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [duration, setDuration] = useState(
    secondsToDurationInput(initial?.duration),
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "Avisos da Igreja");
      setContent(initial?.content || "");
      setNotes(initial?.notes || "");
      setDuration(secondsToDurationInput(initial?.duration));
    }
  }, [isOpen, initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Avisos da Igreja">
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#ECFDF5" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#059669", color: "white" }}
          >
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#059669" }}>
              Avisos
            </p>
            <p className="text-[11px] text-slate-500">
              Comunicações e anúncios da comunidade.
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
            placeholder="Ex: Avisos da Semana"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Lista de Avisos
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              "Ex:\n• Ensaio do coral: sábado às 15h\n• Retiro da juventude: 15-17 de Setembro\n• Culto especial: próximo domingo"
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            placeholder="Ex: Responsável: Diácono Pedro"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <DurationField
          value={duration}
          onChange={setDuration}
          accentRingClass="focus:ring-emerald-500"
        />

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
              onSave({
                title,
                content,
                notes,
                duration: durationInputToSeconds(duration),
              });
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
