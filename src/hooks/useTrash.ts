/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { getDatabase } from "../db";
import { useFolders } from "./useFolders";
import { useServices } from "./useServices";
import { useSongs } from "./useSongs";

export interface TrashItem {
  id: string;
  type: "folder" | "song" | "service";
  name: string;
  updatedAt: string;
  purgeAt: string | null;
}

export function useTrash() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { restoreFolder, isRestoring: isRestoringFolder } = useFolders();
  const { restoreSong, isRestoring: isRestoringSong } = useSongs();
  const { restoreService, isRestoring: isRestoringService } = useServices();

  useEffect(() => {
    let isSubscribed = true;
    const subs: { unsubscribe: () => void }[] = [];

    async function subscribeTrash() {
      const db = await getDatabase();
      if (!isSubscribed) return;

      let latestFolders: TrashItem[] = [];
      let latestSongs: TrashItem[] = [];
      let latestServices: TrashItem[] = [];

      const emit = () => {
        setItems([...latestFolders, ...latestSongs, ...latestServices]);
        setIsLoading(false);
      };

      subs.push(
        db.folders.find({ selector: { deleted: true } }).$.subscribe((docs) => {
          if (!isSubscribed) return;
          latestFolders = docs.map((d) => ({
            id: d.id,
            type: "folder" as const,
            name: d.name,
            updatedAt: d.updatedAt,
            purgeAt: d.purgeAt ?? null,
          }));
          emit();
        }),
      );

      subs.push(
        db.songs.find({ selector: { deleted: true } }).$.subscribe((docs) => {
          if (!isSubscribed) return;
          latestSongs = docs.map((d) => ({
            id: d.id,
            type: "song" as const,
            name: d.title,
            updatedAt: d.updatedAt,
            purgeAt: d.purgeAt ?? null,
          }));
          emit();
        }),
      );

      subs.push(
        db.services
          .find({ selector: { deleted: true } })
          .$.subscribe((docs) => {
            if (!isSubscribed) return;
            latestServices = docs.map((d) => ({
              id: d.id,
              type: "service" as const,
              name: d.name,
              updatedAt: d.updatedAt,
              purgeAt: d.purgeAt ?? null,
            }));
            emit();
          }),
      );
    }

    void subscribeTrash();

    return () => {
      isSubscribed = false;
      subs.forEach((s) => s.unsubscribe());
    };
  }, []);

  const restoreItem = async (item: TrashItem) => {
    if (item.type === "folder") await restoreFolder(item.id);
    else if (item.type === "song") await restoreSong(item.id);
    else await restoreService(item.id);
  };

  return {
    items,
    isLoading,
    restoreItem,
    isRestoring: isRestoringFolder || isRestoringSong || isRestoringService,
  };
}
