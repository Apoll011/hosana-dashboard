/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, ConfirmDialog, EmptyState, Spinner } from "@/src/components/common";
import { AddSongsToCollectionModal } from "@/src/components/modals/AddSongsToCollectionModal";
import { CreateCollectionModal } from "@/src/components/modals/CreateCollectionModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useCollection, useCollections } from "@/src/hooks/useCollections";
import { useAllSongs } from "@/src/hooks/useSongs";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import { Song } from "@/src/types";
import {
  getFolderColorStyle,
  getFolderIconComponent,
} from "@/src/utils/folderCustomization";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  ExternalLink,
  FolderKanban,
  MoreHorizontal,
  Music2,
  Plus,
  Printer,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";

export const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const { organization } = useAuth();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";

  const { data: collection, isLoading: isCollectionLoading } = useCollection(
    id || null,
  );

  const { searchQuery } = useOutletContext<{
    searchQuery: string;
  }>();

  const {
    updateCollection,
    deleteCollection,
    addSongsToCollection,
    removeSongsFromCollection,
    printCollection,
  } = useCollections();

  const { granted: canUpdateCollection } = useCan("collection.update");

  const { songsQuery } = useAllSongs();
  const allSongs = useMemo(
    () => (Array.isArray(songsQuery.data?.songs) ? songsQuery.data.songs : []),
    [songsQuery.data?.songs],
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals & menus
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [songToRemove, setSongToRemove] = useState<Song | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [activeSongMenuId, setActiveSongMenuId] = useState<string | null>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(e.target as Node)
      ) {
        setIsHeaderMenuOpen(false);
      }
      setActiveSongMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Songs in this collection (union of both sides of the relationship)
  const songsInCollection = useMemo(() => {
    if (!collection) return [];
    const songIdSet = new Set(collection.songIds || []);
    return allSongs.filter(
      (song) =>
        songIdSet.has(song.id) ||
        (Array.isArray(song.collectionIds) &&
          song.collectionIds.includes(collection.id)),
    );
  }, [collection, allSongs]);

  // Apply both global and local search filters
  const filteredSongs = useMemo(() => {
    let result = songsInCollection;
    const gq = searchQuery.trim().toLowerCase();
    if (gq) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(gq) ||
          s.artist.toLowerCase().includes(gq) ||
          s.tags?.some((tag) => tag.toLowerCase().includes(gq)),
      );
    }
    return result;
  }, [songsInCollection, searchQuery]);

  // Pagination
  const totalSongs = filteredSongs.length;
  const totalPages = Math.ceil(totalSongs / itemsPerPage) || 1;
  const paginatedSongs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSongs.slice(start, start + itemsPerPage);
  }, [filteredSongs, currentPage]);

  const handleUpdate = async (data: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    image?: string | null;
  }) => {
    if (!collection) return;
    await updateCollection({ id: collection.id, ...data });
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!collection) return;
    await deleteCollection(collection.id);
    navigate(`${slugPrefix}/collections`);
  };

  const handleAddSongs = async (songIds: string[]) => {
    if (!collection) return;
    await addSongsToCollection(collection.id, songIds);
  };

  const handleRemoveSong = async () => {
    if (!collection || !songToRemove) return;
    await removeSongsFromCollection(collection.id, [songToRemove.id]);
    setSongToRemove(null);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isCollectionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!collection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <EmptyState
          icon={<FolderKanban className="w-8 h-8" />}
          title={t("collectionsPage.notFoundTitle")}
          description={t("collectionsPage.notFoundDesc")}
          actionLabel={t("collectionsPage.backToCollections")}
          onAction={() => navigate(`${slugPrefix}/collections`)}
        />
      </div>
    );
  }

  const IconComp = getFolderIconComponent(collection.icon);
  const colorStyle = getFolderColorStyle(collection.color);
  const songCount = songsInCollection.length;
  const isFiltering = searchQuery.trim() !== "";

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-m3-bg">
      {/* Identity strip */}
      <div className="relative w-full overflow-hidden border-b border-m3-border">
        {collection.image ? (
          <img
            src={collection.image}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(90deg, ${colorStyle.colorHex}22 0%, ${colorStyle.colorHex}55 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-m3-card/80 backdrop-blur-sm" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4">
          <div
            className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center text-white shrink-0 border border-white/20"
            style={{ backgroundColor: colorStyle.colorHex }}
          >
            <IconComp className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-title text-m3-text truncate">
              {collection.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-caption">
                {t(
                  `collectionsPage.songCount.${songCount === 1 ? "one" : "other"}`,
                  { count: songCount },
                )}
              </span>
              {collection.description && (
                <>
                  <span className="text-m3-border">·</span>
                  <span className="text-caption line-clamp-1">
                    {collection.description}
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            ref={headerMenuRef}
            className="flex items-center gap-2 shrink-0"
          >
            <Can permission="export.pdf">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() =>
                  void printCollection(collection, songsInCollection)
                }
                title={t("print.buttons.printCollection")}
              >
                <span className="hidden sm:inline">{t("common.print")}</span>
              </Button>
            </Can>
            <Can permission="collection.update">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddSongsModalOpen(true)}
              >
                {t("collectionsPage.addSongs")}
              </Button>
            </Can>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen((v) => !v)}
                className="p-2 min-h-10 min-w-10 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-m3-border bg-m3-card text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
                title={t("explorer.moreOptions")}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {isHeaderMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] z-30 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Can permission="export.pdf">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        void printCollection(collection, songsInCollection);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-text hover:bg-m3-hover rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                    >
                      <Printer className="w-3.5 h-3.5 text-m3-secondary" />
                      {t("print.buttons.printCollection")}
                    </button>
                  </Can>
                  <Can permission="collection.update">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-text hover:bg-m3-hover rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-m3-primary" />
                      {t("collectionsPage.editCollection")}
                    </button>
                  </Can>
                  <Can permission="collection.update">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsAddSongsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-text hover:bg-m3-hover rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500" />
                      {t("collectionsPage.addSongs")}
                    </button>
                  </Can>
                  <Can permission="collection.delete">
                    <div className="my-1 h-px bg-m3-border mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-danger hover:bg-m3-danger/10 rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("collectionsPage.deleteTitle")}
                    </button>
                  </Can>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4">
        {paginatedSongs.length === 0 ? (
          <EmptyState
            icon={<Music2 className="w-8 h-8" />}
            title={
              songsInCollection.length === 0
                ? t("collectionsPage.emptyTitle")
                : t("collectionsPage.noSearchResultsTitle")
            }
            description={
              songsInCollection.length === 0
                ? t("collectionsPage.emptyDesc")
                : t("collectionsPage.noSearchResultsDesc", {
                    query: searchQuery,
                  })
            }
            actionLabel={
              !isFiltering && canUpdateCollection
                ? t("collectionsPage.addSongs")
                : undefined
            }
            onAction={
              !isFiltering && canUpdateCollection
                ? () => setIsAddSongsModalOpen(true)
                : undefined
            }
          />
        ) : (
          /* Song table */
          <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col transition-all">
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_6.5rem] gap-3 items-center px-6 py-3.5 border-b border-m3-border bg-m3-sidebar/40">
              <span className="text-label text-center">#</span>
              <span className="text-label">{t("songsPage.titlePath")}</span>
              <span className="hidden sm:block text-label text-right">
                {t("songsPage.tags")}
              </span>
              <span className="text-label text-right">
                {t("songsPage.actions")}
              </span>
            </div>

            <div className="divide-y divide-m3-border/30 text-sm font-semibold">
              {paginatedSongs.map((song, index) => {
                const globalIndex =
                  (currentPage - 1) * itemsPerPage + index + 1;
                const keyMatch = song.content
                  ?.match(/\{key:\s*([^}]+)\}/i)?.[1]
                  ?.trim();
                const isMenuOpen = activeSongMenuId === song.id;

                return (
                  <div
                    key={song.id}
                    className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_6.5rem] gap-3 items-center px-6 py-3.5 transition-colors select-none cursor-pointer text-m3-text hover:bg-m3-hover/50"
                  >
                    <span
                      className="text-center text-caption tabular-nums"
                      onClick={() => navigate(`${slugPrefix}/songs/${song.id}`)}
                    >
                      {globalIndex}
                    </span>

                    <div
                      className="flex flex-col min-w-0"
                      onClick={() => navigate(`${slugPrefix}/songs/${song.id}`)}
                    >
                      <span className="truncate font-semibold">{song.title}</span>
                      <span className="text-caption mt-0.5 truncate">
                        {song.artist || "—"}
                      </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
                      {keyMatch && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                          {keyMatch}
                        </span>
                      )}
                      {song.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-m3-sidebar text-m3-secondary border border-m3-border"
                        >
                          {tag}
                        </span>
                      ))}
                      {(song.tags?.length ?? 0) > 2 && (
                        <span className="text-caption">
                          +{(song.tags?.length ?? 0) - 2}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`${slugPrefix}/songs/${song.id}`)
                        }
                        className="p-1.5 text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-[var(--radius-md)] cursor-pointer transition-colors"
                        title={t("collectionsPage.viewSong")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <Can permission="collection.update">
                        <button
                          type="button"
                          onClick={() => setSongToRemove(song)}
                          className="p-1.5 text-m3-secondary hover:text-m3-danger hover:bg-m3-danger/10 rounded-[var(--radius-md)] cursor-pointer transition-colors"
                          title={t("collectionsPage.removeFromCollection")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Can>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSongMenuId(isMenuOpen ? null : song.id);
                          }}
                          className={`p-1.5 rounded-[var(--radius-md)] transition-colors cursor-pointer ${
                            isMenuOpen
                              ? "bg-m3-primary/10 text-m3-primary"
                              : "text-m3-secondary hover:text-m3-text hover:bg-m3-hover"
                          }`}
                          title={t("explorer.moreOptions")}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] z-30 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSongMenuId(null);
                                navigate(`${slugPrefix}/songs/${song.id}`);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-text hover:bg-m3-hover rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                            >
                              <Music2 className="w-3.5 h-3.5 text-m3-primary" />
                              {t("collectionsPage.viewSong")}
                            </button>
                            {song.tags && song.tags.length > 0 && (
                              <div className="px-3 py-1.5 flex flex-wrap gap-1">
                                {song.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-m3-sidebar text-m3-secondary"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="h-px bg-m3-border mx-1" />
                            <Can permission="collection.update">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSongMenuId(null);
                                  setSongToRemove(song);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-m3-danger hover:bg-m3-danger/10 rounded-[var(--radius-md)] transition-colors cursor-pointer text-left"
                              >
                                <X className="w-3.5 h-3.5" />
                                {t("collectionsPage.removeFromCollection")}
                              </button>
                            </Can>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-m3-sidebar/30 border-t border-m3-border flex items-center justify-between text-xs">
                <span className="text-m3-secondary font-medium">
                  {t("collectionsPage.paginationInfo", {
                    from: Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      totalSongs,
                    ),
                    to: Math.min(currentPage * itemsPerPage, totalSongs),
                    total: totalSongs,
                  })}
                </span>
                <div className="flex items-center gap-1 bg-m3-card border border-m3-border rounded-xl p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      if (p === 1 || p === totalPages) return true;
                      return Math.abs(p - currentPage) <= 1;
                    })
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-m3-secondary opacity-50">
                              …
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              currentPage === p
                                ? "bg-m3-primary text-white shadow-sm"
                                : "hover:bg-m3-hover text-m3-text"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      <CreateCollectionModal
        isOpen={isEditModalOpen}
        collection={collection}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdate}
      />

      <AddSongsToCollectionModal
        isOpen={isAddSongsModalOpen}
        collection={collection}
        allSongs={allSongs}
        onClose={() => setIsAddSongsModalOpen(false)}
        onAddSongs={handleAddSongs}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t("collectionsPage.deleteTitle")}
        message={t("collectionsPage.deletePermanentMessage", {
          name: collection.name,
        })}
        confirmText={t("collectionsPage.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={Boolean(songToRemove)}
        onClose={() => setSongToRemove(null)}
        onConfirm={handleRemoveSong}
        title={t("collectionsPage.removeSongTitle")}
        message={t("collectionsPage.removeSongMessage", {
          title: songToRemove?.title ?? "",
        })}
        confirmText={t("collectionsPage.removeFromCollection")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
};
