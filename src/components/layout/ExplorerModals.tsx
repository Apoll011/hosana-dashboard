/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Button,
  ConversionResult,
  Folder,
  Input,
  Modal,
  Song,
} from "@hosanna/shared";
import { AlertTriangle, HardDrive } from "lucide-react";
import { useI18n } from "../../i18n";
import { FolderForm } from "../forms/FolderForm";
import { SongForm } from "../forms/SongForm";
import { ServiceForm } from "../forms/ServiceForm";
import {
  MoveFolderTreeItem,
  FolderTreeNode,
  getFolderDescendantIds,
} from "../explorer";
import { CifraClubImportModal } from "../modals/CifraModal";
import { MoveSongModal } from "../modals/MoveSongModal";
import { BatchMoveModal } from "../modals/BatchMoveModal";
import { BatchDeleteModal } from "../modals/BatchDeleteModal";
import { BatchTagModal } from "../modals/BatchTagModal";
import { CustomizeFolderModal } from "../modals/CustomizeFolderModal";

interface ExplorerModalsProps {
  // CifraClub
  isCifraImportOpen: boolean;
  setIsCifraImportOpen: (v: boolean) => void;
  onCifraClubSubmit: (
    chordpro: ConversionResult,
    artist: string,
    title: string,
  ) => Promise<void>;

  // Create Song
  isCreateSongModalOpen: boolean;
  setIsCreateSongModalOpen: (v: boolean) => void;
  currentFolder: Folder | undefined;
  currentFolderId: string | null;
  allFolders: Folder[];
  onCreateSongSubmit: (data: {
    title: string;
    artist: string;
    folderId: string | null;
    tags: string[];
  }) => Promise<void>;

  // Create Service
  isCreateServiceModalOpen: boolean;
  setIsCreateServiceModalOpen: (v: boolean) => void;
  onCreateServiceSubmit: (data: {
    name: string;
    date: string;
    notes: string;
  }) => Promise<void>;

  // Create Folder
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
  onCreateFolderSubmit: (name: string) => Promise<void>;

  // Rename Folder
  renameTarget: Folder | null;
  setRenameTarget: (f: Folder | null) => void;
  onRenameFolderSubmit: (name: string) => Promise<void>;

  // Customize Folder
  customizeTarget?: Folder | null;
  setCustomizeTarget?: (f: Folder | null) => void;
  onCustomizeFolderSubmit?: (color: string, icon: string) => Promise<void>;

  // Move Folder
  moveFolderTarget: Folder | null;
  setMoveFolderTarget: (f: Folder | null) => void;
  targetParentFolderId: string | null;
  setTargetParentFolderId: (id: string | null) => void;
  folderTree: FolderTreeNode[];
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
  onMoveFolderSubmit: () => Promise<void>;

  // Delete Folder
  deleteTarget: Folder | null;
  setDeleteTarget: (f: Folder | null) => void;
  deleteAcao: "move_to_root" | "delete_songs";
  setDeleteAcao: (a: "move_to_root" | "delete_songs") => void;
  confirmFolderName: string;
  setConfirmFolderName: (n: string) => void;
  onDeleteFolderSubmit: () => Promise<void>;

  // Move Song
  moveSongTarget: Song | null;
  setMoveSongTarget: (s: Song | null) => void;
  targetSongFolderId: string | null;
  onMoveSongConfirm: (targetFolderId: string | null) => Promise<void>;

  // Delete Song
  deleteSongTarget: Song | null;
  setDeleteSongTarget: (s: Song | null) => void;
  onDeleteSongSubmit: () => Promise<void>;

  // Batch modals
  isBatchMoveOpen: boolean;
  setIsBatchMoveOpen: (v: boolean) => void;
  selectedFolderIds: Set<string>;
  selectedSongIds: Set<string>;
  disabledFolderIdsForBatchMove: Set<string>;
  onBatchMoveConfirm: (targetFolderId: string | null) => Promise<void>;

  isBatchDeleteOpen: boolean;
  setIsBatchDeleteOpen: (v: boolean) => void;
  selectedFolderObjects: Folder[];
  onBatchDeleteConfirm: (
    folderAction: "move_to_root" | "delete_songs",
  ) => Promise<void>;

  isBatchTagOpen: boolean;
  setIsBatchTagOpen: (v: boolean) => void;
  onBatchTagConfirm: (
    tags: string[],
    mode: "append" | "replace" | "remove",
  ) => Promise<void>;

  // Advanced Filter Modal
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (v: boolean) => void;
  selectedTag: string;
  setSelectedTag: (t: string) => void;
  availableTags: string[];
  searchFields: {
    title: boolean;
    artist: boolean;
    content: boolean;
    tags: boolean;
  };
  setSearchFields: React.Dispatch<
    React.SetStateAction<{
      title: boolean;
      artist: boolean;
      content: boolean;
      tags: boolean;
    }>
  >;
  onClearFilters: () => void;
}

export const ExplorerModals: React.FC<ExplorerModalsProps> = ({
  isCifraImportOpen,
  setIsCifraImportOpen,
  onCifraClubSubmit,
  isCreateSongModalOpen,
  setIsCreateSongModalOpen,
  currentFolder,
  currentFolderId,
  allFolders,
  onCreateSongSubmit,
  isCreateServiceModalOpen,
  setIsCreateServiceModalOpen,
  onCreateServiceSubmit,
  isCreateModalOpen,
  setIsCreateModalOpen,
  onCreateFolderSubmit,
  renameTarget,
  setRenameTarget,
  onRenameFolderSubmit,
  customizeTarget,
  setCustomizeTarget,
  onCustomizeFolderSubmit,
  moveFolderTarget,
  setMoveFolderTarget,
  targetParentFolderId,
  setTargetParentFolderId,
  folderTree,
  expandedFolderIds,
  toggleExpand,
  onMoveFolderSubmit,
  deleteTarget,
  setDeleteTarget,
  deleteAcao,
  setDeleteAcao,
  confirmFolderName,
  setConfirmFolderName,
  onDeleteFolderSubmit,
  moveSongTarget,
  setMoveSongTarget,
  targetSongFolderId,
  onMoveSongConfirm,
  deleteSongTarget,
  setDeleteSongTarget,
  onDeleteSongSubmit,
  isBatchMoveOpen,
  setIsBatchMoveOpen,
  selectedFolderIds,
  selectedSongIds,
  disabledFolderIdsForBatchMove,
  onBatchMoveConfirm,
  isBatchDeleteOpen,
  setIsBatchDeleteOpen,
  selectedFolderObjects,
  onBatchDeleteConfirm,
  isBatchTagOpen,
  setIsBatchTagOpen,
  onBatchTagConfirm,
  isFilterPanelOpen,
  setIsFilterPanelOpen,
  selectedTag,
  setSelectedTag,
  availableTags,
  searchFields,
  setSearchFields,
  onClearFilters,
}) => {
  const { t } = useI18n();

  return (
    <>
      <CifraClubImportModal
        isOpen={isCifraImportOpen}
        handleClose={() => setIsCifraImportOpen(false)}
        handleSave={onCifraClubSubmit}
      />

      {/* CREATE SONG MODAL */}
      <Modal
        isOpen={isCreateSongModalOpen}
        onClose={() => setIsCreateSongModalOpen(false)}
        title={
          currentFolder
            ? t("explorer.modals.createSongInFolder", {
                folder: currentFolder.name,
              })
            : t("explorer.modals.createSongInRoot")
        }
      >
        <SongForm
          initialValues={{ folderId: currentFolderId }}
          folders={allFolders}
          onSubmit={onCreateSongSubmit}
          onCancel={() => setIsCreateSongModalOpen(false)}
        />
      </Modal>

      {/* CREATE SERVICE MODAL */}
      <Modal
        isOpen={isCreateServiceModalOpen}
        onClose={() => setIsCreateServiceModalOpen(false)}
        title={t("explorer.modals.createServiceTitle")}
      >
        <ServiceForm
          onSubmit={onCreateServiceSubmit}
          onCancel={() => setIsCreateServiceModalOpen(false)}
        />
      </Modal>

      {/* CREATE FOLDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          currentFolder
            ? t("explorer.modals.createFolderInFolder", {
                folder: currentFolder.name,
              })
            : t("explorer.modals.createFolderInRoot")
        }
      >
        <FolderForm
          onSubmit={onCreateFolderSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* RENAME FOLDER MODAL */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={t("explorer.modals.renameFolderTitle", {
          folder: renameTarget?.name || "",
        })}
      >
        <FolderForm
          initialName={renameTarget?.name || ""}
          title={t("explorer.modals.updateFolderName")}
          onSubmit={onRenameFolderSubmit}
          onCancel={() => setRenameTarget(null)}
        />
      </Modal>

      {/* CUSTOMIZE FOLDER MODAL */}
      {customizeTarget && setCustomizeTarget && onCustomizeFolderSubmit && (
        <CustomizeFolderModal
          isOpen={!!customizeTarget}
          folder={customizeTarget}
          onClose={() => setCustomizeTarget(null)}
          onSave={onCustomizeFolderSubmit}
        />
      )}

      {/* MOVE FOLDER MODAL (TREE HIERARCHY) */}
      <Modal
        isOpen={!!moveFolderTarget}
        onClose={() => setMoveFolderTarget(null)}
        title={t("explorer.modals.moveFolderTitle", {
          folder: moveFolderTarget?.name || "",
        })}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("explorer.modals.selectDestFolder")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {moveFolderTarget?.name}
            </strong>
            :
          </p>

          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <input
                type="radio"
                name="targetFolderParent"
                value="root"
                checked={targetParentFolderId === null}
                onChange={() => setTargetParentFolderId(null)}
                className="text-[#0284c7] focus:ring-[#0284c7]"
              />
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <HardDrive className="w-4 h-4 text-[#0284c7]" />
                <span>{t("explorer.modals.rootTopLevel")}</span>
              </div>
            </label>

            {/* Hierarchical Tree of Folders with Disabled Check for Self/Descendants */}
            <div className="flex flex-col gap-1.5 mt-1">
              {folderTree.map((node) => (
                <MoveFolderTreeItem
                  key={node.folder.id}
                  node={node}
                  selectedFolderId={targetParentFolderId}
                  onSelect={setTargetParentFolderId}
                  disabledFolderIds={
                    moveFolderTarget
                      ? getFolderDescendantIds(moveFolderTarget.id, allFolders)
                      : undefined
                  }
                  expandedFolderIds={expandedFolderIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setMoveFolderTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={onMoveFolderSubmit}>
              {t("explorer.modals.moveFolderBtn")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE FOLDER MODAL */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setConfirmFolderName("");
          setDeleteAcao("move_to_root");
        }}
        title={t("explorer.modals.deleteFolderTitle", {
          folder: deleteTarget?.name || "",
        })}
      >
        {(deleteTarget?.folderCount || 0) + (deleteTarget?.songCount || 0) >
        0 ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <span>{t("explorer.modals.selectDeleteFolderOption")}</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="radio"
                  name="deleteAcao"
                  value="move_to_root"
                  checked={deleteAcao === "move_to_root"}
                  onChange={() => {
                    setDeleteAcao("move_to_root");
                    setConfirmFolderName("");
                  }}
                  className="text-[#0284c7] focus:ring-[#0284c7]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t("explorer.modals.moveContentsToRoot")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t("explorer.modals.moveContentsToRootDesc")}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-rose-200 dark:border-rose-950 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                <input
                  type="radio"
                  name="deleteAcao"
                  value="delete_songs"
                  checked={deleteAcao === "delete_songs"}
                  onChange={() => setDeleteAcao("delete_songs")}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {t("explorer.modals.deleteFolderAndContents")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t("explorer.modals.deleteFolderAndContentsDesc")}
                  </span>
                </div>
              </label>
            </div>

            {deleteAcao === "delete_songs" && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{t("explorer.modals.additionalSecurity")}</span>
                </div>
                <p className="text-rose-900 dark:text-rose-200 text-[11px] leading-relaxed">
                  {t("explorer.modals.deleteFolderIrreversible")}{" "}
                  <strong className="font-extrabold underline">
                    {deleteTarget?.name}
                  </strong>{" "}
                  abaixo:
                </p>
                <Input
                  placeholder={t("explorer.modals.writeToConfirm", {
                    name: deleteTarget?.name || "",
                  })}
                  value={confirmFolderName}
                  onChange={(e) => setConfirmFolderName(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmFolderName("");
                  setDeleteAcao("move_to_root");
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                disabled={
                  deleteAcao === "delete_songs" &&
                  confirmFolderName.trim() !== deleteTarget?.name?.trim()
                }
                onClick={onDeleteFolderSubmit}
              >
                {t("explorer.modals.confirmDelete")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t("explorer.modals.emptyFolderDelete")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t("explorer.modals.emptyFolderDeleteDesc")}
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteTarget(null);
                    setConfirmFolderName("");
                    setDeleteAcao("move_to_root");
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    deleteAcao === "delete_songs" &&
                    confirmFolderName.trim() !== deleteTarget?.name?.trim()
                  }
                  onClick={onDeleteFolderSubmit}
                >
                  {t("explorer.modals.confirmDelete")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MOVE SONG MODAL (TREE HIERARCHY) */}
      <MoveSongModal
        isOpen={!!moveSongTarget}
        onClose={() => setMoveSongTarget(null)}
        songTitle={moveSongTarget?.title}
        initialFolderId={targetSongFolderId}
        folders={allFolders}
        onConfirm={onMoveSongConfirm}
      />

      {/* DELETE SONG MODAL */}
      <Modal
        isOpen={!!deleteSongTarget}
        onClose={() => setDeleteSongTarget(null)}
        title={t("explorer.modals.deleteSongTitle", {
          title: deleteSongTarget?.title || "",
        })}
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>
              {t("explorer.modals.deleteSongWarning", {
                title: deleteSongTarget?.title || "",
              })}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setDeleteSongTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={onDeleteSongSubmit}>
              {t("explorer.modals.deleteSongBtn")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* BATCH MOVE MODAL */}
      <BatchMoveModal
        isOpen={isBatchMoveOpen}
        onClose={() => setIsBatchMoveOpen(false)}
        selectedFoldersCount={selectedFolderIds.size}
        selectedSongsCount={selectedSongIds.size}
        disabledFolderIds={disabledFolderIdsForBatchMove}
        folders={allFolders}
        onConfirm={onBatchMoveConfirm}
      />

      {/* BATCH DELETE MODAL */}
      <BatchDeleteModal
        isOpen={isBatchDeleteOpen}
        onClose={() => setIsBatchDeleteOpen(false)}
        selectedFolders={selectedFolderObjects}
        selectedSongsCount={selectedSongIds.size}
        onConfirm={onBatchDeleteConfirm}
      />

      {/* BATCH TAG MODAL */}
      <BatchTagModal
        isOpen={isBatchTagOpen}
        onClose={() => setIsBatchTagOpen(false)}
        selectedSongIds={Array.from(selectedSongIds)}
        onConfirm={onBatchTagConfirm}
      />

      {/* ADVANCED FILTER POPUP MODAL */}
      <Modal
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title={t("explorer.modals.filterTitle")}
      >
        <div className="space-y-5 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {t("explorer.modals.searchScope")}{" "}
            <span className="font-bold text-[#0284c7]">
              {currentFolder
                ? t("explorer.modals.scopeFolder", {
                    folder: currentFolder.name,
                  })
                : t("explorer.modals.scopeRoot")}
            </span>
          </p>

          {/* Tag / Category Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("explorer.modals.categoryTag")}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setSelectedTag("")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedTag === ""
                    ? "bg-[#0284c7] text-white border-[#0284c7]"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {t("explorer.modals.allCategories")}
              </button>
              {availableTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    selectedTag === tag
                      ? "bg-[#0284c7] text-white border-[#0284c7]"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Search Fields Toggles */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("explorer.modals.searchFields")}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={searchFields.title}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      title: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span>{t("explorer.modals.fieldTitle")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={searchFields.artist}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      artist: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span>{t("explorer.modals.fieldArtist")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={searchFields.content}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      content: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span>{t("explorer.modals.fieldContent")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={searchFields.tags}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      tags: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span>{t("explorer.modals.fieldTags")}</span>
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
            >
              {t("explorer.modals.clearFilters")}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsFilterPanelOpen(false)}
            >
              {t("explorer.modals.applyFilters")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
