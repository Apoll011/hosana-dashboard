/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Song,
  Spinner,
} from "@hosanna/shared";
import {
  ArrowUpDown,
  FileText,
  Filter,
  FolderInput,
  FolderTree,
  Music,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { SongForm } from "../../components/forms/SongForm";
import { MoveSongModal } from "../../components/modals/MoveSongModal";
import { useFolders } from "../../hooks/useFolders";
import { useAllSongs } from "../../hooks/useSongs";

interface SongsPageProps {
  hideHeader?: boolean;
  searchQuery?: string;
  sortBy?: "title" | "artist" | "updatedAt";
  sortOrder?: "asc" | "desc";
  selectedKey?: string;
  selectedTag?: string;
  searchFields?: {
    title: boolean;
    artist: boolean;
    content: boolean;
    tags: boolean;
  };
}

export const SongsPage: React.FC<SongsPageProps> = ({
  hideHeader,
  searchQuery: externalSearchQuery,
  sortBy: externalSortBy,
  sortOrder: externalSortOrder,
  selectedKey,
  selectedTag,
  searchFields: externalSearchFields,
}) => {
  const navigate = useNavigate();
  const context = useOutletContext<any>() || {};
  const actualHideHeader = hideHeader ?? context.hideHeader;
  //TODO: Add support
  const actualSearchQuery = externalSearchQuery ?? context.searchQuery ?? "";
  const actualSortBy = externalSortBy ?? context.sortBy ?? "title";
  const actualSortOrder = externalSortOrder ?? context.sortOrder ?? "asc";
  const actualSelectedKey = selectedKey ?? context.selectedKey ?? "";
  const actualSelectedTag = selectedTag ?? context.selectedTag ?? "";
  const actualSearchFields = externalSearchFields ??
    context.searchFields ?? {
      title: true,
      artist: true,
      content: true,
      tags: true,
    };

  // Search, Filtering, Pagination, Sorting State
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [internalSortBy, setInternalSortBy] = useState<
    "title" | "artist" | "updatedAt"
  >("title");
  const [internalSortOrder, setInternalSortOrder] = useState<"asc" | "desc">(
    "asc",
  );
  const [page, setPage] = useState(1);

  const finalSearchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : context.searchQuery !== undefined
        ? context.searchQuery
        : internalSearchQuery;
  const finalSortBy =
    externalSortBy !== undefined
      ? externalSortBy
      : context.sortBy !== undefined
        ? context.sortBy
        : internalSortBy;
  const finalSortOrder =
    externalSortOrder !== undefined
      ? externalSortOrder
      : context.sortOrder !== undefined
        ? context.sortOrder
        : internalSortOrder;

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [
    finalSearchQuery,
    finalSortBy,
    finalSortOrder,
    actualSelectedKey,
    actualSelectedTag,
    actualSearchFields,
    selectedFolder,
  ]);

  const ITEMS_PER_PAGE = 50;

  // Fetch the full cached song list — no per-page API calls
  const { songsQuery, createSong, deleteSong, moveSong } = useAllSongs();

  const { foldersQuery } = useFolders();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<Song | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);

  const folders = Array.isArray(foldersQuery.data?.folders)
    ? foldersQuery.data.folders
    : [];

  const allSongs: Song[] = Array.isArray(songsQuery.data?.songs)
    ? songsQuery.data.songs
    : [];

  // Client-side filtering
  const filteredSongs = React.useMemo(() => {
    let result = allSongs;

    if (finalSearchQuery) {
      const q = finalSearchQuery.toLowerCase();
      result = result.filter((song) => {
        const inTitle = actualSearchFields.title && song.title?.toLowerCase().includes(q);
        const inArtist = actualSearchFields.artist && song.artist?.toLowerCase().includes(q);
        const inContent = actualSearchFields.content && song.content?.toLowerCase().includes(q);
        const inTags = actualSearchFields.tags && song.tags?.some((t) => t.toLowerCase().includes(q));
        return inTitle || inArtist || inContent || inTags;
      });
    }

    if (selectedFolder) {
      if (selectedFolder === "root") {
        result = result.filter((song) => !song.folderId);
      } else {
        result = result.filter((song) => song.folderId === selectedFolder);
      }
    }

    if (actualSelectedKey) {
      result = result.filter((song) => {
        const k = song.content?.match(/\{key:\s*([^}]+)\}/i)?.[1]?.trim();
        return k === actualSelectedKey;
      });
    }

    if (actualSelectedTag) {
      result = result.filter((song) => song.tags?.includes(actualSelectedTag));
    }

    // Client-side sorting
    result = [...result].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (finalSortBy === "title") {
        valA = a.title?.toLowerCase() ?? "";
        valB = b.title?.toLowerCase() ?? "";
      } else if (finalSortBy === "artist") {
        valA = a.artist?.toLowerCase() ?? "";
        valB = b.artist?.toLowerCase() ?? "";
      } else if (finalSortBy === "updatedAt") {
        valA = new Date(a.updatedAt).getTime();
        valB = new Date(b.updatedAt).getTime();
      }

      if (valA < valB) return finalSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return finalSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allSongs, finalSearchQuery, selectedFolder, actualSelectedKey, actualSelectedTag, actualSearchFields, finalSortBy, finalSortOrder]);

  const totalSongs = filteredSongs.length;
  const totalPages = Math.max(1, Math.ceil(totalSongs / ITEMS_PER_PAGE));
  const songsData = filteredSongs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCreateSongSubmit = React.useCallback(
    async (data: {
      title: string;
      artist: string;
      folderId: string | null;
      tags: string[];
    }) => {
      const newSong = await createSong({
        title: data.title,
        artist: data.artist,
        folderId: data.folderId,
        tags: data.tags,
        content: `{title: ${data.title}}\n{artist: ${data.artist}}\n{key: G}\n\n[G]Enter lyrics and chords...`,
      });
      setIsCreateModalOpen(false);
      navigate(`/songs/${newSong.id}`);
    },
    [createSong, navigate],
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;
    await deleteSong(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteSong]);

  return (
    <div
      className={`flex-1 flex flex-col w-full mx-auto space-y-6 animate-in fade-in duration-500 overflow-y-auto h-full ${hideHeader ? "p-6" : "p-4 sm:p-8 max-w-7xl"}`}
    >
      {/* Header Banner */}
      {!actualHideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-m3-text tracking-tighter flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-m3-primary/10 text-m3-primary flex items-center justify-center border border-m3-primary/20">
                <Music className="w-7 h-7" />
              </div>
              Biblioteca de Cânticos
            </h1>
            <p className="text-sm text-m3-secondary font-bold uppercase tracking-widest mt-2 ml-16 opacity-60">
              Gerencie a sua coleção de cifras e pautas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={<FolderTree className="w-5 h-5" />}
              onClick={() => navigate("/folders")}
              className="rounded-2xl py-6 px-6 font-black uppercase tracking-widest text-[11px]"
            >
              Explorador
            </Button>

            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-2xl py-6 px-6 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-m3-primary/20"
            >
              Novo Cântico
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      {!actualHideHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-m3-sidebar/30 border border-m3-border rounded-[28px] shadow-lg shadow-black/5 transition-all">
          <div className="flex-1 min-w-60 max-w-lg">
            <Input
              placeholder="Pesquisar cânticos..."
              value={finalSearchQuery}
              onChange={(e) => {
                setInternalSearchQuery(e.target.value);
                setPage(1);
              }}
              icon={<Search className="w-4 h-4 text-m3-secondary" />}
              className="py-2.5 text-sm rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Folder Filter */}
            <div className="flex items-center gap-2 bg-m3-card border border-m3-border rounded-xl px-3 py-2 text-xs shadow-sm">
              <Filter className="w-3.5 h-3.5 text-m3-primary opacity-70" />
              <select
                value={selectedFolder}
                onChange={(e) => {
                  setSelectedFolder(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-black text-m3-text focus:outline-none cursor-pointer uppercase tracking-wider text-[10px]"
              >
                <option value="">Todas</option>
                <option value="root">Raiz</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-m3-card border border-m3-border rounded-xl px-3 py-2 text-xs shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-m3-primary opacity-70" />
              <select
                value={`${finalSortBy}-${finalSortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split("-") as [
                    "title" | "artist" | "updatedAt",
                    "asc" | "desc",
                  ];
                  if (externalSortBy !== undefined) {
                    // If controlled by parent, we might not want to set internal
                  } else {
                    setInternalSortBy(sb);
                    setInternalSortOrder(so);
                  }
                }}
                className="bg-transparent font-black text-m3-text focus:outline-none cursor-pointer uppercase tracking-wider text-[10px]"
              >
                <option value="title-asc">A-Z</option>
                <option value="title-desc">Z-A</option>
                <option value="artist-asc">Artista</option>
                <option value="updatedAt-desc">Recente</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Table / List View */}
      <div className="bg-m3-card border border-m3-border rounded-4xl shadow-2xl shadow-black/5 overflow-hidden flex flex-col flex-1 transition-all duration-300">
        {songsQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Spinner label="A carregar biblioteca..." />
          </div>
        ) : songsQuery.isError ? (
          <div className="p-12 text-center text-rose-500 font-bold">
            Erro ao carregar cânticos: {(songsQuery.error as Error).message}
          </div>
        ) : songsData.length === 0 ? (
          <EmptyState
            icon={<Music className="w-12 h-12 text-m3-primary opacity-40" />}
            title="Nenhum cântico encontrado"
            description={
              finalSearchQuery || selectedFolder
                ? "A sua pesquisa não retornou resultados. Experimente termos mais genéricos."
                : "A sua biblioteca está vazia. Comece a sua jornada musical agora!"
            }
            actionLabel="Criar Novo Cântico"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-m3-sidebar/40 border-b border-m3-border text-[10px] font-black text-m3-secondary uppercase tracking-[0.2em]">
                  <th className="py-4 px-6">Título & Caminho</th>
                  <th className="py-4 px-6">Artista</th>
                  <th className="py-4 px-6">Pasta</th>
                  <th className="py-4 px-6">Etiquetas</th>
                  <th className="py-4 px-6">Atualização</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-border/30 text-[13px] font-bold">
                {songsData.map((song) => {
                  const folder = folders.find((f) => f.id === song.folderId);
                  return (
                    <tr
                      key={song.id}
                      className="hover:bg-m3-hover/50 transition-all group cursor-pointer"
                      onClick={() => navigate(`/songs/${song.id}`)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col group-hover:translate-x-1 transition-transform">
                          <span className="text-m3-text group-hover:text-m3-primary transition-colors">
                            {song.title}
                          </span>
                          <span className="text-[10px] text-m3-secondary font-black uppercase tracking-widest opacity-60 mt-0.5">
                            {song.path}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-m3-secondary">
                        {song.artist || "—"}
                      </td>

                      <td className="py-4 px-6">
                        {folder ? (
                          <Badge variant="sky">{folder.name}</Badge>
                        ) : (
                          <span className="text-[10px] text-m3-secondary font-black uppercase tracking-widest opacity-40 italic">
                            Raiz
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {song.tags && song.tags.length > 0 ? (
                            song.tags.map((tag) => (
                              <Badge key={tag} variant="slate">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-m3-secondary opacity-30">
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-[11px] text-m3-secondary opacity-70 font-black uppercase tracking-tighter">
                        {new Date(song.updatedAt).toLocaleDateString("pt-PT")}
                      </td>

                      <td
                        className="py-4 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 group-hover:opacity-100 opacity-40 transition-opacity">
                          <button
                            onClick={() => navigate(`/songs/${song.id}`)}
                            title="Abrir Editor"
                            className="p-2 text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-xl cursor-pointer transition-all"
                          >
                            <FileText className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setMoveTarget(song);
                            }}
                            title="Mover"
                            className="p-2 text-m3-secondary hover:text-sky-500 hover:bg-sky-500/10 rounded-xl cursor-pointer transition-all"
                          >
                            <FolderInput className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(song)}
                            title="Apagar"
                            className="p-2 text-m3-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-all"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-m3-sidebar/20 border-t border-m3-border/50">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            total={totalSongs}
            limit={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* CREATE SONG MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Novo Cântico"
      >
        <SongForm
          folders={folders}
          onSubmit={handleCreateSongSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* MOVE SONG MODAL */}
      <MoveSongModal
        isOpen={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        songTitle={moveTarget?.title}
        initialFolderId={moveTarget?.folderId || null}
        folders={folders}
        onConfirm={async (targetFolderId) => {
          if (!moveTarget) return;
          await moveSong({
            id: moveTarget.id,
            folderId: targetFolderId,
            updatedAt: moveTarget.updatedAt,
          });
          setMoveTarget(null);
        }}
      />

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Apagar Cântico"
        message={`Tem a certeza que deseja apagar permanentemente "${deleteTarget?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Apagar Cântico"
      />
    </div>
  );
};
