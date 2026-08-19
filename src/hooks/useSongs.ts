/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { GetSongsParams, Song } from "@hosanna/shared";
import { useSync } from "../contexts/SyncContext";
import { getDatabase, SongDocType } from "../db";

function useSongMutations() {
  const { showToast } = useSync();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingBatchTags, setIsUpdatingBatchTags] = useState(false);

  const createSong = useCallback(
    async (data: Partial<Song>) => {
      setIsCreating(true);
      try {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = data.id || crypto.randomUUID();
        const newSong: SongDocType = {
          id,
          title: data.title || "Sem título",
          artist: data.artist || "",
          content: data.content || "",
          folderId: data.folderId ?? (data as any).folder ?? null,
          path: data.path || `${data.title || "Sem título"}.pro`,
          tags: Array.isArray(data.tags) ? data.tags : [],
          song_number: data.song_number ?? null,
          createdAt: data.createdAt || now,
          updatedAt: now,
          _deleted: false,
        };

        const doc = await db.songs.insert(newSong);
        const result = doc.toJSON() as Song;
        showToast(`Cântico "${result.title}" criado com sucesso!`, "success");
        return result;
      } catch (err: any) {
        showToast(err.message || "Falha ao criar cântico", "error");
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [showToast],
  );

  const updateSong = useCallback(
    async (songUpdate: { id: string; data?: Partial<Song> } | Song) => {
      setIsUpdating(true);
      try {
        const db = await getDatabase();
        const id =
          "id" in songUpdate && "data" in songUpdate
            ? songUpdate.id
            : (songUpdate as Song).id;
        const data =
          "data" in songUpdate ? (songUpdate as any).data : songUpdate;

        const doc = await db.songs.findOne(id).exec();
        const now = new Date().toISOString();

        if (doc) {
          await doc.patch({
            ...data,
            updatedAt: now,
            _deleted: false,
          });
          const updated = doc.toJSON() as Song;
          showToast(`Cântico "${updated.title}" guardado`, "success");
          return updated;
        } else {
          // If not existing locally yet, upsert
          const newDoc = await db.songs.upsert({
            id,
            title: data.title || "Sem título",
            artist: data.artist || "",
            content: data.content || "",
            folderId: data.folderId ?? data.folder ?? null,
            path: data.path || `${data.title || "Sem título"}.pro`,
            tags: data.tags || [],
            song_number: data.song_number ?? null,
            createdAt: data.createdAt || now,
            updatedAt: now,
            _deleted: false,
            ...data,
          });
          const result = newDoc.toJSON() as Song;
          showToast(`Cântico "${result.title}" guardado`, "success");
          return result;
        }
      } catch (err: any) {
        showToast(err.message || "Falha ao guardar cântico", "error");
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [showToast],
  );

  const deleteSong = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        const db = await getDatabase();
        const doc = await db.songs.findOne(id).exec();
        if (doc) {
          // Soft delete so RxDB replication pushes tombstone to server
          await doc.patch({
            _deleted: true,
            updatedAt: new Date().toISOString(),
          });
        }
        showToast("Cântico apagado", "info");
      } catch (err: any) {
        showToast(err.message || "Falha ao apagar cântico", "error");
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [showToast],
  );

  const moveSong = useCallback(
    async ({
      id,
      folderId,
      newPath,
    }: {
      id: string;
      folderId: string | null;
      updatedAt?: string;
      newPath?: string;
    }) => {
      setIsUpdating(true);
      try {
        const db = await getDatabase();
        const doc = await db.songs.findOne(id).exec();
        const now = new Date().toISOString();
        if (doc) {
          const patchObj: Partial<SongDocType> = {
            folderId: folderId ?? null,
            updatedAt: now,
          };
          if (newPath) {
            patchObj.path = newPath;
          }
          await doc.patch(patchObj);
          showToast("Cântico movido", "success");
          return doc.toJSON() as Song;
        }
      } catch (err: any) {
        showToast(err.message || "Falha ao mover cântico", "error");
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [showToast],
  );

  const updateBatchTags = useCallback(
    async (params: {
      songIds: string[];
      tags: string[];
      mode?: "append" | "replace" | "remove";
    }) => {
      setIsUpdatingBatchTags(true);
      try {
        const db = await getDatabase();
        const mode = params.mode || "replace";
        const now = new Date().toISOString();

        let count = 0;
        for (const id of params.songIds) {
          const doc = await db.songs.findOne(id).exec();
          if (doc) {
            let nextTags = [...(doc.tags || [])];
            if (mode === "replace") {
              nextTags = [...params.tags];
            } else if (mode === "append") {
              const set = new Set([...nextTags, ...params.tags]);
              nextTags = Array.from(set);
            } else if (mode === "remove") {
              const toRemove = new Set(params.tags);
              nextTags = nextTags.filter((t) => !toRemove.has(t));
            }
            await doc.patch({
              tags: nextTags,
              updatedAt: now,
            });
            count++;
          }
        }

        showToast(`Etiquetas atualizadas em ${count} cântico(s)!`, "success");
        return { count };
      } catch (err: any) {
        showToast(
          err.message || "Falha ao atualizar etiquetas em lote",
          "error",
        );
        throw err;
      } finally {
        setIsUpdatingBatchTags(false);
      }
    },
    [showToast],
  );

  return {
    createSong,
    updateSong,
    deleteSong,
    moveSong,
    updateBatchTags,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingBatchTags,
  };
}

export function useSongs(params: GetSongsParams = {}) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mutations = useSongMutations();
  const folder = params.folder;

  useEffect(() => {
    let isSubscribed = true;
    let rxSub: { unsubscribe: () => void } | null = null;

    async function subscribeSongs() {
      try {
        const db = await getDatabase();
        if (!isSubscribed) return;

        let query = db.songs.find({
          selector: {
            _deleted: {
              $ne: true,
            },
          },
        });

        if (folder !== undefined) {
          query = db.songs.find({
            selector: {
              _deleted: { $ne: true },
              folderId: folder,
            },
          });
        }

        rxSub = query.$.subscribe((docs) => {
          if (!isSubscribed) return;
          let items = docs.map((d) => d.toJSON() as Song);

          if (params.search) {
            const q = params.search.toLowerCase();
            items = items.filter(
              (s) =>
                s.title?.toLowerCase().includes(q) ||
                s.artist?.toLowerCase().includes(q) ||
                s.content?.toLowerCase().includes(q) ||
                s.tags?.some((t) => t.toLowerCase().includes(q)),
            );
          }

          setSongs(items);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Failed to query songs from RxDB", err);
        setIsLoading(false);
      }
    }

    void subscribeSongs();

    return () => {
      isSubscribed = false;
      if (rxSub) rxSub.unsubscribe();
    };
  }, [folder, params.search]);

  const songsQuery = {
    data: {
      songs,
      total: songs.length,
      page: 1,
      totalPages: 1,
    },
    isLoading,
    isPending: isLoading,
    isError: false,
    error: null,
    refetch: async () => {},
  };

  return { songsQuery, ...mutations };
}

export function useAllSongs(params: GetSongsParams = {}) {
  return useSongs(params);
}

export function useSong(id: string | null) {
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);

  useEffect(() => {
    if (!id) {
      setSong(null);
      setIsLoading(false);
      return;
    }

    let isSubscribed = true;
    let rxSub: { unsubscribe: () => void } | null = null;

    async function subscribeSong() {
      try {
        const db = await getDatabase();
        if (!isSubscribed) return;

        rxSub = db.songs.findOne(id).$.subscribe((doc) => {
          if (!isSubscribed) return;
          if (doc && !doc._deleted) {
            setSong(doc.toJSON() as Song);
          } else {
            setSong(null);
          }
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Failed to find song in RxDB", err);
        setIsLoading(false);
      }
    }

    void subscribeSong();

    return () => {
      isSubscribed = false;
      if (rxSub) rxSub.unsubscribe();
    };
  }, [id]);

  return {
    data: song,
    isLoading,
    isPending: isLoading,
    isError: false,
    error: null,
    refetch: async () => {},
  };
}
