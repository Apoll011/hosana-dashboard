/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Folder } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFolders: Folder[];
  selectedSongsCount: number;
  onConfirm: (folderAction: 'move_to_root' | 'delete_songs') => Promise<void>;
}

export const BatchDeleteModal: React.FC<BatchDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedFolders,
  selectedSongsCount,
  onConfirm,
}) => {
  const [folderAction, setFolderAction] = useState<'move_to_root' | 'delete_songs'>('move_to_root');
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderAction('move_to_root');
      setConfirmText('');
    }
  }, [isOpen]);

  const hasFolders = selectedFolders.length > 0;
  const foldersWithSongs = selectedFolders.filter((f) => (f.songCount || 0) > 0);
  const totalItems = selectedFolders.length + selectedSongsCount;

  const requiresTypedConfirmation = hasFolders && folderAction === 'delete_songs';
  // Expected text: name of first folder if 1 folder, or 'APAGAR' if multiple
  const expectedConfirmText =
    selectedFolders.length === 1 ? selectedFolders[0].name.trim() : 'APAGAR';

  const isConfirmDisabled =
    requiresTypedConfirmation && confirmText.trim() !== expectedConfirmText;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(folderAction);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apagar ${totalItems} Item(ns) Selecionado(s)`}
    >
      <div className="flex flex-col gap-4">
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            Está prestes a apagar{' '}
            <strong>
              {selectedFolders.length > 0 && `${selectedFolders.length} pasta(s)`}
              {selectedFolders.length > 0 && selectedSongsCount > 0 && ' e '}
              {selectedSongsCount > 0 && `${selectedSongsCount} cântico(s)`}
            </strong>
            .
          </p>
        </div>

        {hasFolders && (
          <div className="flex flex-col gap-2.5 mt-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              O que fazer com os cânticos dentro das pastas selecionadas?
            </span>

            <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <input
                type="radio"
                name="batchFolderAction"
                value="move_to_root"
                checked={folderAction === 'move_to_root'}
                onChange={() => {
                  setFolderAction('move_to_root');
                  setConfirmText('');
                }}
                className="text-[#0284c7] focus:ring-[#0284c7] mt-0.5"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Preservar cânticos (Mover para o Nível Raiz)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Apaga apenas as pastas e move os seus cânticos para a raiz sem perder dados.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40">
              <input
                type="radio"
                name="batchFolderAction"
                value="delete_songs"
                checked={folderAction === 'delete_songs'}
                onChange={() => setFolderAction('delete_songs')}
                className="text-rose-600 focus:ring-rose-500 mt-0.5"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Apagar permanentemente as pastas e todos os seus cânticos
                </span>
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400">
                  Ação destrutiva. Apaga as pastas e todos os cânticos nelas contidos.
                </span>
              </div>
            </label>
          </div>
        )}

        {requiresTypedConfirmation && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Confirmação de Segurança</span>
            </div>
            <p className="text-rose-900 dark:text-rose-200 text-[11px] leading-relaxed">
              Para confirmar a eliminação de{' '}
              <strong className="font-extrabold underline">{expectedConfirmText}</strong>, escreva exatamente o nome abaixo:
            </p>
            <Input
              placeholder={`Escreva "${expectedConfirmText}" para confirmar`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-xs"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            isLoading={isLoading}
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Apagar {totalItems} Item(ns)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
