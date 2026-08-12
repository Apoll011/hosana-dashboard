/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, Button, Input, Modal } from "@hosanna/shared";
import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface BatchTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSongIds: string[];
  onConfirm: (
    tags: string[],
    mode: "append" | "replace" | "remove",
  ) => Promise<void>;
}

const PRESET_CATEGORIES = [
  "Louvor",
  "Adoração",
  "Comunhão",
  "Ceia",
  "Natal",
  "Páscoa",
  "Crianças",
  "Oração",
  "Agradecimento",
  "Entrada",
  "Ofertório",
  "Envio",
  "Festivo",
  "Acústico",
  "Jovens",
];

export const BatchTagModal: React.FC<BatchTagModalProps> = ({
  isOpen,
  onClose,
  selectedSongIds,
  onConfirm,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [mode, setMode] = useState<"append" | "replace" | "remove">("append");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTags([]);
      setCustomTag("");
      setMode("append");
    }
  }, [isOpen]);

  const togglePresetTag = (preset: string) => {
    if (tags.includes(preset)) {
      setTags(tags.filter((t) => t !== preset));
    } else {
      setTags([...tags, preset]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setCustomTag("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleConfirm = async () => {
    if (tags.length === 0 && mode !== "replace") return;
    setIsLoading(true);
    try {
      await onConfirm(tags, mode);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const count = selectedSongIds.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Etiquetar ${count} Cântico(s) em Lote`}
    >
      <div className="flex flex-col gap-5 text-slate-700 dark:text-slate-300">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Selecione categorias predefinidas ou introduza etiquetas
          personalizadas para atribuir a{" "}
          <strong className="text-slate-900 dark:text-slate-100">
            {count} cântico(s) selecionado(s)
          </strong>
          .
        </p>

        {/* Mode Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
            Modo de Aplicação
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("append")}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                mode === "append"
                  ? "bg-white dark:bg-slate-900 text-[#0284c7] shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setMode("replace")}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                mode === "replace"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Substituir
            </button>
            <button
              type="button"
              onClick={() => setMode("remove")}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                mode === "remove"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Remover
            </button>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            {mode === "append" &&
              "• Acrescenta estas etiquetas mantendo as existentes nos cânticos."}
            {mode === "replace" &&
              "• Substitui todas as etiquetas existentes pelas etiquetas selecionadas abaixo."}
            {mode === "remove" &&
              "• Remove estas etiquetas específicas de todos os cânticos selecionados."}
          </span>
        </div>

        {/* Preset Categories */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            Categorias & Temas Sugeridos
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            {PRESET_CATEGORIES.map((cat) => {
              const isSelected = tags.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => togglePresetTag(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer select-none ${
                    isSelected
                      ? "bg-[#0284c7] text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0284c7]"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-3" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Tag Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Nova Tag Personalizada
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ex: Jovens, Ministração, Solo..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={handleKeyDown}
                icon={<TagIcon className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              icon={<Plus className="w-4 h-4 text-[#0284c7]" />}
              onClick={handleAddCustomTag}
              disabled={!customTag.trim()}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Selected Tags Preview */}
        {tags.length > 0 && (
          <div className="flex flex-col gap-1.5 p-3 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">
              Etiquetas a {mode === "remove" ? "remover" : "aplicar"} (
              {tags.length})
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={mode === "remove" ? "rose" : "sky"}
                  className="flex items-center gap-1 text-xs py-1 px-2.5"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-rose-500 rounded p-0.5 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            isLoading={isLoading}
            onClick={handleConfirm}
            disabled={tags.length === 0 && mode !== "replace"}
            icon={<TagIcon className="w-4 h-4" />}
          >
            Aplicar em {count} Cântico(s)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
