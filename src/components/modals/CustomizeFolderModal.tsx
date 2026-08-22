/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Button, Folder, Modal } from "@hosanna/shared";
import { Check, Palette } from "lucide-react";
import {
  FOLDER_COLORS,
  FOLDER_ICONS,
  getFolderColorStyle,
  getFolderIconComponent,
} from "../../utils/folderCustomization";

interface CustomizeFolderModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: string, icon: string) => Promise<void>;
}

export const CustomizeFolderModal: React.FC<CustomizeFolderModalProps> = ({
  folder,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>("default");
  const [selectedIcon, setSelectedIcon] = useState<string>("default");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (folder) {
      setSelectedColor(folder.color || "default");
      setSelectedIcon(folder.icon || "default");
    }
  }, [folder, isOpen]);

  if (!folder) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedColor, selectedIcon);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const PreviewIcon = getFolderIconComponent(selectedIcon);
  const previewColorStyle = getFolderColorStyle(selectedColor);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Personalizar Pasta: ${folder.name}`}
    >
      <div className="flex flex-col gap-6">
        {/* Preview Box */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${previewColorStyle.bgClass} ${previewColorStyle.borderClass} ${previewColorStyle.textClass}`}
          >
            <PreviewIcon className="w-7 h-7 opacity-90" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
              {folder.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ícone: {FOLDER_ICONS.find((i) => i.id === selectedIcon)?.name || "Padrão"} • Cor: {previewColorStyle.name}
            </span>
          </div>
        </div>

        {/* Color Selection */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>Cor da Pasta</span>
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {FOLDER_COLORS.map((c) => {
              const isSelected = selectedColor === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  title={c.name}
                  className={`group relative h-9 w-full rounded-xl flex items-center justify-center transition-all ${c.bgClass} border ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-sky-500 dark:ring-offset-slate-900 scale-105 border-transparent font-bold"
                      : "hover:scale-105 border-slate-200/60 dark:border-slate-700/60"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: c.colorHex }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Selection */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ícone da Pasta (30 Opções)
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-xl">
            {FOLDER_ICONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedIcon === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  title={item.name}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500 font-bold"
                      : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <IconComp className="w-5 h-5 shrink-0" />
                  <span className="text-[9px] truncate w-full leading-tight">
                    {item.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "A guardar..." : "Guardar Personalização"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
