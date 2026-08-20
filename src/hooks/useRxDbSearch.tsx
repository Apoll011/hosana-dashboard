import { Calendar, Folder as FolderIcon, Music } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommandAction,
  FolderItem,
  ServiceItem,
  SongItem,
} from "../command-palette.types";
import { useCommandPalette } from "../contexts/CommandPaletteContext";

interface UseRxDbSearchProps {
  slugPrefix: string;
  navigate: (path: string) => void;
  isDataLoading?: boolean;
  searchSongsDb: (query: string) => Promise<SongItem[]>;
  searchFoldersDb: (query: string) => Promise<FolderItem[]>;
  searchServicesDb: (query: string) => Promise<ServiceItem[]>;
  getFolderPathString: (parentId?: string | null) => string;
}

export function useRxDbSearch({
  slugPrefix,
  navigate,
  isDataLoading = false,
  searchSongsDb,
  searchFoldersDb,
  searchServicesDb,
  getFolderPathString,
}: UseRxDbSearchProps) {
  const {
    searchQuery,
    registerDynamicActions,
    unregisterDynamicActions,
    closePalette,
  } = useCommandPalette();
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    // Hide dynamic items unless user types >= 2 characters
    if (trimmed.length < 2) {
      unregisterDynamicActions("rxdb-results");
      setIsDebouncing(false);
      return;
    }

    let isSubscribed = true;
    setIsDebouncing(true);

    const timer = setTimeout(async () => {
      try {
        const [songs, folders, services] = await Promise.all([
          searchSongsDb(trimmed),
          searchFoldersDb(trimmed),
          searchServicesDb(trimmed),
        ]);

        if (!isSubscribed) return;

        const results: CommandAction[] = [];

        // Folders
        folders.forEach((f) => {
          results.push({
            id: `folder-${f.id}`,
            name: f.name,
            subtitle: `Caminho: ${getFolderPathString(f.parentId)} (${f.songCount || 0} cânticos)`,
            keywords: `${f.name} pasta folder diretorio`,
            section: "Pastas",
            icon: <FolderIcon className="w-4 h-4 text-amber-500" />,
            perform: () => {
              navigate(`${slugPrefix}/folders?id=${f.id}`);
              closePalette();
            },
          });
        });

        // Songs
        songs.forEach((s) => {
          results.push({
            id: `song-${s.id}`,
            name: s.title,
            subtitle: s.artist || "Artista Desconhecido",
            badge: s.key ? `Tom: ${s.key}` : undefined,
            keywords: `${s.title} ${s.artist || ""} ${(s.tags || []).join(" ")} musica cantico`,
            section: "Cânticos",
            icon: <Music className="w-4 h-4 text-sky-500" />,
            perform: () => {
              navigate(`${slugPrefix}/songs/${s.id}`);
              closePalette();
            },
          });
        });

        // Services
        services.forEach((srv) => {
          results.push({
            id: `service-${srv.id}`,
            name: srv.name,
            subtitle: `Data: ${new Date(srv.date).toLocaleDateString("pt-PT")}`,
            keywords: `${srv.name} culto reuniao plano`,
            section: "Cultos",
            icon: <Calendar className="w-4 h-4 text-emerald-500" />,
            perform: () => {
              navigate(`${slugPrefix}/services/${srv.id}`);
              closePalette();
            },
          });
        });

        registerDynamicActions("rxdb-results", results);
      } catch (err) {
        console.error("Erro na pesquisa:", err);
      } finally {
        if (isSubscribed) setIsDebouncing(false);
      }
    }, 120); // Fast 120ms debounce for loaded data

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [
    searchQuery,
    searchSongsDb,
    searchFoldersDb,
    searchServicesDb,
    slugPrefix,
    navigate,
    getFolderPathString,
    registerDynamicActions,
    unregisterDynamicActions,
    closePalette,
  ]);

  return {
    isSearching:
      isDebouncing || (searchQuery.trim().length >= 2 && isDataLoading),
  };
}
