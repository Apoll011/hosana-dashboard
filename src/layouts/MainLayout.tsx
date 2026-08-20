/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Badge,
  Button,
  Folder,
  Input,
  Modal,
  Song,
  songsApi,
} from "@hosanna/shared";
import {
  AlertTriangle,
  Archive,
  ArrowRightLeft,
  ArrowUpDown,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Church,
  CornerLeftUp,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Filter,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  HardDrive,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  Move,
  Music,
  Plus,
  Printer,
  RotateCw,
  Search,
  Settings,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FolderForm } from "../components/forms/FolderForm";
import { SongForm } from "../components/forms/SongForm";
import { InboxButton, InboxFetchClient } from "../components/Inbox";
import { BatchDeleteModal } from "../components/modals/BatchDeleteModal";
import { BatchMoveModal } from "../components/modals/BatchMoveModal";
import { BatchTagModal } from "../components/modals/BatchTagModal";
import { MoveSongModal } from "../components/modals/MoveSongModal";
import { SyncStatusBadge } from "../components/SyncStatusBadge";
import { ToastContainer } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { useSync } from "../contexts/SyncContext";
import { useFolders } from "../hooks/useFolders";
import { useServices } from "../hooks/useServices";
import { useAllSongs } from "../hooks/useSongs";
import { authClient } from "../lib/authClient";

import { ConversionResult } from "@hosanna/shared";
import { useStatsigClient } from "@statsig/react-bindings";
import { useQueryClient } from "@tanstack/react-query";
import { Action, KBarProvider } from "kbar";
import {
  buildFolderTree,
  FolderTreeItemNode,
  getFolderDescendantIds,
  MoveFolderTreeItem,
} from "../components/explorer";
import { ServiceForm } from "../components/forms/ServiceForm";
import { KBarCommandPaletteUI } from "../components/KBarCommandPalette";
import { CifraClubImportModal } from "../components/modals/CifraModal";
import { getRoleLabel } from "../components/settings/settingsUtils";
import { songImportRegistry } from "../import";
import { Can, CanAll, CanAny } from "../lib/permissions/components";
import { getInitials } from "../utils";
import { ProviderImportResult } from "../utils/import";

interface ContextMenuState {
  x: number;
  y: number;
  type: "folder" | "song" | "canvas";
  item?: Folder | Song | null;
}

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, organization } = useAuth();

  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const isSongsView =
    location.pathname === `${slugPrefix}/songs` ||
    location.pathname === "/songs";
  const isSongEditorView =
    (location.pathname.startsWith(`${slugPrefix}/songs/`) ||
      location.pathname.startsWith("/songs/")) &&
    !isSongsView;
  const isServicesView =
    location.pathname === `${slugPrefix}/services` ||
    location.pathname === "/services";
  const isServiceEditorView =
    (location.pathname.startsWith(`${slugPrefix}/services/`) ||
      location.pathname.startsWith("/services/")) &&
    !isServicesView;

  const isTeamsView = location.pathname.includes("/teams");
  const isSettingsView = location.pathname.includes("/settings");
  const isExplorerView =
    location.pathname.includes("/folders") ||
    (!isSongsView &&
      !isSongEditorView &&
      !isServicesView &&
      !isServiceEditorView &&
      !isTeamsView &&
      !isSettingsView);
  const isEditorView = isSongEditorView || isServiceEditorView;

  // Plus Dropdown State
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] =
    useState(false);

  // User Dropdown State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(event.target as Node)
      ) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const { showToast, triggerSyncCheck } = useSync();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      // Handled via effect watching needRefresh
    },
  });

  useEffect(() => {
    if (needRefresh) {
      showToast({
        type: "info",
        title: "Nova versão disponível",
        description: "Uma nova versão do Hosanna Studio está disponível.",
        duration: 0, // Keep persistent until user interacts or dismisses
        action: {
          label: "Recarregar",
          onClick: () => {
            void updateServiceWorker(true);
          },
        },
      });
    }
  }, [needRefresh, showToast, updateServiceWorker]);

  useEffect(() => {
    const interval = setInterval(() => {
      void triggerSyncCheck();
    }, 60000);
    return () => clearInterval(interval);
  }, [triggerSyncCheck]);

  const queryClient = useQueryClient();
  const { servicesQuery, createService, deleteService } = useServices();
  const allServices = useMemo(
    () => servicesQuery.data || [],
    [servicesQuery.data],
  );

  // Services Archive toggle
  const [showArchived, setShowArchived] = useState(false);
  const { servicesQuery: archivedServicesQuery } = useServices(true);

  const archivedServices = useMemo(
    () => (showArchived ? (archivedServicesQuery.data ?? []) : []),
    [showArchived, archivedServicesQuery.data],
  );

  const { client } = useStatsigClient();

  // Folder state: null = Root directory
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const navigateBackToDrive = () => {
    if (!isExplorerView) {
      navigate(`${slugPrefix}/folders`);
    }
  };

  const handleSelectFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    if (!isExplorerView) {
      navigate(`${slugPrefix}/folders`);
    }
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
    if (isSettingsView) {
      navigate(`${slugPrefix}/folders`);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    () => (localStorage.getItem("viewMode") as "grid" | "list") || "grid",
  );
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    try {
      return (
        (localStorage.getItem("explorer_density") as
          "comfortable" | "compact") || "comfortable"
      );
    } catch {
      return "comfortable";
    }
  });

  const handleDensityChange = (d: "comfortable" | "compact") => {
    setDensity(d);
    try {
      localStorage.setItem("explorer_density", d);
    } catch {}
  };

  // Track page transitions to manage searchQuery persistence like a file system
  const prevPathnameRef = useRef(location.pathname);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true",
  );

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const prevPath = prevPathnameRef.current;
    const currPath = location.pathname;

    if (prevPath !== currPath) {
      const getDomain = (path: string) => {
        if (path === "/songs" || path.startsWith("/songs/")) return "songs";
        if (path === "/services" || path.startsWith("/services/"))
          return "services";
        if (path === "/folders" || path.startsWith("/folders/"))
          return "explorer";
        if (path.startsWith("/settings")) return "settings";
        return "other";
      };

      const prevDomain = getDomain(prevPath);
      const currDomain = getDomain(currPath);

      // Search persists when remaining in same context domain:
      // - Songs domain (songs list, song editor, folder explorer)
      // - Services domain (services list, service editor)
      const isSongDomain =
        (prevDomain === "songs" || prevDomain === "explorer") &&
        (currDomain === "songs" || currDomain === "explorer");

      const isServiceDomain =
        prevDomain === "services" && currDomain === "services";

      const keepSearch = isSongDomain || isServiceDomain;

      if (!keepSearch) {
        setSearchQuery("");
        setSelectedKey("");
        setSelectedTag("");
        setIsFilterPanelOpen(false);
      }
    }

    prevPathnameRef.current = currPath;
  }, [location.pathname]);

  // Multi-Selection State
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(
    new Set(),
  );
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  // Marquee Rubberband Drag Selection State
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const isMouseDownRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialSelectionRef = useRef<{
    folders: Set<string>;
    songs: Set<string>;
  }>({
    folders: new Set(),
    songs: new Set(),
  });

  // Batch Modals State
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchTagOpen, setIsBatchTagOpen] = useState(false);

  const teamsEnabled = client.checkGate("teams");

  // Clear selection on folder navigation
  useEffect(() => {
    setSelectedFolderIds(new Set());
    setSelectedSongIds(new Set());
    setLastClickedId(null);
  }, [currentFolderId]);

  // Drag & Drop & Upload State
  const [_isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isInternalDragActive, setIsInternalDragActive] = useState(false);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(
    null,
  );

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Expanded Folders in Tree View State
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(),
  );

  // API Hooks
  const { foldersQuery, createFolder, renameFolder, moveFolder, deleteFolder } =
    useFolders();

  const songParams = useMemo(() => ({}), []);

  const { songsQuery, moveSong, deleteSong, updateBatchTags } =
    useAllSongs(songParams);

  // Search & Filters State
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchFields, setSearchFields] = useState({
    title: true,
    artist: true,
    content: true,
    tags: true,
  });
  const [sortBy, setSortBy] = useState<"title" | "artist" | "updatedAt">(
    "title",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (isSettingsView) {
      navigate(`${slugPrefix}/folders`);
    }
  };

  const handleSortChange = (
    sb: "title" | "artist" | "updatedAt",
    so: "asc" | "desc",
  ) => {
    setSortBy(sb);
    setSortOrder(so);
    if (isSettingsView) {
      navigate(`${slugPrefix}/folders`);
    }
  };

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSongModalOpen, setIsCreateSongModalOpen] = useState(false);

  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [moveFolderTarget, setMoveFolderTarget] = useState<Folder | null>(null);
  const [targetParentFolderId, setTargetParentFolderId] = useState<
    string | null
  >(null);

  const [isCifraImportOpen, setIsCifraImportOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [deleteAção, setDeleteAção] = useState<"move_to_root" | "delete_songs">(
    "move_to_root",
  );
  const [confirmFolderName, setConfirmFolderName] = useState("");

  const [moveSongTarget, setMoveSongTarget] = useState<Song | null>(null);
  const [targetSongFolderId, setTargetSongFolderId] = useState<string | null>(
    null,
  );

  const [deleteSongTarget, setDeleteSongTarget] = useState<Song | null>(null);

  const allFolders = useMemo(
    () => foldersQuery.data?.folders || [],
    [foldersQuery.data?.folders],
  );
  const allSongs = useMemo(
    () => songsQuery.data?.songs || [],
    [songsQuery.data?.songs],
  );
  const totalSongs = songsQuery.data?.total || 0;
  const totalServices = servicesQuery.data?.length || 0;
  const rootSongsCount = foldersQuery.data?.rootSongsCount || 0;
  const rootFoldersCount = foldersQuery.data?.folders.length || 0;

  // Build tree structure from folders
  const folderTree = useMemo(() => buildFolderTree(allFolders), [allFolders]);

  // Current active folder object (if inside a folder)
  const currentFolder = allFolders.find((f) => f.id === currentFolderId);

  // Set of descendant folder IDs for current active directory
  const descendantFolderIds = useMemo(() => {
    if (currentFolderId === null) {
      return new Set(allFolders.map((f) => f.id));
    }
    return getFolderDescendantIds(currentFolderId, allFolders);
  }, [currentFolderId, allFolders]);

  // Helper: folder path display string
  const getFolderPathString = (folderId: string | null | undefined): string => {
    if (!folderId) return "Raiz";
    const pathList: string[] = [];
    let curr: Folder | undefined = allFolders.find((f) => f.id === folderId);
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      pathList.unshift(curr.name);
      curr = curr.parentId
        ? allFolders.find((f) => f.id === curr?.parentId)
        : undefined;
    }

    return pathList.length > 0 ? pathList.join(" / ") : "Raiz";
  };

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allSongs.forEach((s) => {
      if (s.tags) s.tags.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }, [allSongs]);

  // Compute folder breadcrumbs path from root down to currentFolder
  const folderBreadcrumbs = useMemo(() => {
    if (!currentFolderId) return [];
    const trail: Folder[] = [];
    let curr: Folder | undefined = allFolders.find(
      (f) => f.id === currentFolderId,
    );
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      trail.unshift(curr);
      curr = curr.parentId
        ? allFolders.find((f) => f.id === curr?.parentId)
        : undefined;
    }
    return trail;
  }, [currentFolderId, allFolders]);

  const currentSongId = isSongEditorView
    ? location.pathname.split("/").pop()
    : null;
  const currentSong = useMemo(
    () => allSongs.find((s) => s.id === currentSongId),
    [allSongs, currentSongId],
  );

  const songBreadcrumbs = useMemo(() => {
    if (!currentSong || !currentSong.folderId) return [];
    const trail: Folder[] = [];
    let curr: Folder | undefined = allFolders.find(
      (f) => f.id === currentSong.folderId,
    );
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      trail.unshift(curr);
      curr = curr.parentId
        ? allFolders.find((f) => f.id === curr?.parentId)
        : undefined;
    }
    return trail;
  }, [currentSong, allFolders]);

  const currentSongFileName = useMemo(() => {
    if (!currentSong) return "";
    let title = currentSong.title || "";
    if (
      title.endsWith(".chordpro") ||
      title.endsWith(".pro") ||
      title.endsWith(".txt") ||
      title.endsWith(".chopro")
    ) {
      return title;
    }
    let ext = ".chordpro";
    if (currentSong.path) {
      const match = currentSong.path.match(/\.[a-z0-9]+$/i);
      if (match) ext = match[0];
    }
    return `${title}${ext}`;
  }, [currentSong]);

  const currentServiceId = isServiceEditorView
    ? location.pathname.split("/").pop()
    : null;
  const currentService = useMemo(
    () => allServices.find((s) => s.id === currentServiceId),
    [allServices, currentServiceId],
  );

  const show_folder_tree = client?.checkGate
    ? client.checkGate("show_folder_tree")
    : true;

  const isCommandPaletteEnabled = client?.checkGate
    ? client.checkGate("command_palett")
    : false;

  const kbarActions = useMemo<Action[]>(() => {
    if (!isCommandPaletteEnabled) return [];

    const actions: Action[] = [
      // --- NAVEGAÇÃO ---
      {
        id: "nav-drive",
        name: "Ir para Drive (Início)",
        shortcut: ["g", "d"],
        keywords: "drive inicio home pastas root folders",
        section: "Navegação",
        icon: <HardDrive className="w-4 h-4 text-sky-500" />,
        perform: () => {
          setCurrentFolderId(null);
          navigate(`${slugPrefix}/folders`);
        },
      },
      {
        id: "nav-songs",
        name: "Ir para Biblioteca de Cânticos",
        shortcut: ["g", "s"],
        keywords: "biblioteca canticos musicas songs library",
        section: "Navegação",
        icon: <Music className="w-4 h-4 text-sky-500" />,
        perform: () => navigate(`${slugPrefix}/songs`),
      },
      {
        id: "nav-services",
        name: "Ir para Cultos / Planos",
        shortcut: ["g", "c"],
        keywords: "cultos planos servicos services worship",
        section: "Navegação",
        icon: <Church className="w-4 h-4 text-emerald-500" />,
        perform: () => navigate(`${slugPrefix}/services`),
      },
      {
        id: "nav-settings",
        name: "Ir para Definições do Sistema",
        shortcut: ["g", "t"],
        keywords: "definicoes configuracoes settings preferences",
        section: "Navegação",
        icon: <Settings className="w-4 h-4 text-slate-500" />,
        perform: () => navigate(`${slugPrefix}/settings`),
      },

      // --- AÇÕES RÁPIDAS ---
      {
        id: "action-create-song",
        name: "Criar Novo Cântico",
        shortcut: ["c", "s"],
        keywords: "novo cantico musica adicionar song create add",
        section: "Ações Rápidas",
        icon: <Plus className="w-4 h-4 text-sky-500" />,
        perform: () => setIsCreateSongModalOpen(true),
      },
      {
        id: "action-import-cifra",
        name: "Importar Cântico do CifraClub",
        shortcut: ["c", "i"],
        keywords: "importar cifraclub cifra web url fetch",
        section: "Ações Rápidas",
        icon: <Download className="w-4 h-4 text-sky-500" />,
        perform: () => setIsCifraImportOpen(true),
      },
      {
        id: "action-create-service",
        name: "Criar Novo Plano de Culto",
        shortcut: ["c", "c"],
        keywords: "novo culto plano servico create service worship date",
        section: "Ações Rápidas",
        icon: <Calendar className="w-4 h-4 text-emerald-500" />,
        perform: () => setIsCreateServiceModalOpen(true),
      },
      {
        id: "action-create-folder",
        name: "Criar Nova Pasta",
        shortcut: ["c", "f"],
        keywords: "nova pasta diretorio novapasta create folder directory",
        section: "Ações Rápidas",
        icon: <FolderPlus className="w-4 h-4 text-amber-500" />,
        perform: () => setIsCreateModalOpen(true),
      },
      {
        id: "action-upload-files",
        name: "Importar Ficheiros",
        shortcut: ["u"],
        keywords: "upload carregar ficheiros chordpro sbpbackup import txt pro",
        section: "Ações Rápidas",
        icon: <Upload className="w-4 h-4 text-purple-500" />,
        perform: () => fileInputRef.current?.click(),
      },
    ];

    // --- DYNAMIC FOLDERS ---
    allFolders.forEach((f) => {
      actions.push({
        id: `folder-${f.id}`,
        name: `Pasta: ${f.name}`,
        subtitle: `Caminho: ${getFolderPathString(f.parentId)} (${f.songCount || 0} cânticos)`,
        keywords: `pasta pastas folder folders diretoria directory ${f.name} ${getFolderPathString(f.parentId)}`,
        section: "Pastas",
        icon: <FolderIcon className="w-4 h-4 text-amber-500" />,
        perform: () => {
          handleSelectFolder(f.id);
          navigate(`${slugPrefix}/folders`);
        },
      });
    });

    // --- DYNAMIC SONGS ---
    allSongs.forEach((s) => {
      actions.push({
        id: `song-${s.id}`,
        name: `Cântico: ${s.title}`,
        subtitle: `${s.artist || "Artista Desconhecido"} ${s.tags?.length ? "• " + s.tags.join(", ") : ""}`,
        keywords: `cantico canticos musica musicas song songs louvor ${s.title} ${s.artist || ""} ${(s.tags || []).join(" ")}`,
        section: "Cânticos",
        icon: <FileText className="w-4 h-4 text-sky-500" />,
        perform: () => navigate(`${slugPrefix}/songs/${s.id}`),
      });
    });

    // --- DYNAMIC SERVICES ---
    allServices.forEach((serv) => {
      actions.push({
        id: `service-${serv.id}`,
        name: `Culto: ${serv.name}`,
        subtitle: `Data: ${new Date(serv.date).toLocaleDateString("pt-PT")}`,
        keywords: `culto cultos plano planos service services worship reuniao ${serv.name} ${serv.notes || ""}`,
        section: "Cultos",
        icon: <Calendar className="w-4 h-4 text-emerald-500" />,
        perform: () => navigate(`${slugPrefix}/services/${serv.id}`),
      });
    });

    // --- CURRENT CONTEXT & VIEW ACTIONS ---
    if (isExplorerView) {
      actions.push(
        {
          id: "view-grid",
          name: "Alternar Vista para Grelha",
          keywords: "vista grelha grid view layout",
          section: "Visualização",
          icon: <LayoutGrid className="w-4 h-4 text-slate-500" />,
          perform: () => handleViewModeChange("grid"),
        },
        {
          id: "view-list",
          name: "Alternar Vista para Lista",
          keywords: "vista lista list view table layout",
          section: "Visualização",
          icon: <List className="w-4 h-4 text-slate-500" />,
          perform: () => handleViewModeChange("list"),
        },
        {
          id: "open-filters",
          name: "Abrir Painel de Filtros Avançados",
          keywords: "filtros filter pesquisar tom tag artista",
          section: "Visualização",
          icon: <Filter className="w-4 h-4 text-slate-500" />,
          perform: () => setIsFilterPanelOpen(true),
        },
      );
    }

    if (isSongEditorView && currentSong) {
      actions.push(
        {
          id: "song-print-current",
          name: `Imprimir Cântico: "${currentSong.title}"`,
          keywords: "imprimir print pdf cantico atual",
          section: "Cântico Atual",
          icon: <Printer className="w-4 h-4 text-indigo-500" />,
          perform: () => handlePrintSong(currentSong.id),
        },
        {
          id: "song-move-current",
          name: `Mover Cântico: "${currentSong.title}"`,
          keywords: "mover pasta move folder destination",
          section: "Cântico Atual",
          icon: <Move className="w-4 h-4 text-sky-500" />,
          perform: () => {
            setMoveSongTarget(currentSong);
            setTargetSongFolderId(currentSong.folderId!);
          },
        },
        {
          id: "song-delete-current",
          name: `Eliminar Cântico: "${currentSong.title}"`,
          keywords: "eliminar apagar remover delete remove",
          section: "Cântico Atual",
          icon: <Trash2 className="w-4 h-4 text-rose-500" />,
          perform: () => setDeleteSongTarget(currentSong),
        },
      );
    }

    if (isServiceEditorView && currentService) {
      actions.push({
        id: "service-delete-current",
        name: `Eliminar Culto: "${currentService.name}"`,
        keywords: "eliminar apagar culto delete service",
        section: "Culto Atual",
        icon: <Trash2 className="w-4 h-4 text-rose-500" />,
        perform: async () => {
          await deleteService(currentService.id);
          navigate(`${slugPrefix}/services`);
        },
      });
    }

    // --- CONTA E PREFERÊNCIAS ---
    actions.push(
      {
        id: "toggle-sidebar",
        name: isSidebarCollapsed
          ? "Expandir Barra Lateral"
          : "Recolher Barra Lateral",
        shortcut: ["b", "s"],
        keywords: "sidebar menu barras lateral recolher expandir toggle",
        section: "Definições & Conta",
        icon: <ChevronRight className="w-4 h-4 text-slate-500" />,
        perform: () => setIsSidebarCollapsed(!isSidebarCollapsed),
      },
      {
        id: "user-logout",
        name: "Sair / Terminar Sessão",
        keywords: "sair logout encerrar sessao exit",
        section: "Definições & Conta",
        icon: <LogOut className="w-4 h-4 text-rose-500" />,
        perform: () => logout(),
      },
    );

    return actions;
  }, [
    isCommandPaletteEnabled,
    allFolders,
    allSongs,
    allServices,
    currentFolderId,
    currentSong,
    currentService,
    isExplorerView,
    isSongEditorView,
    isServiceEditorView,
    isSidebarCollapsed,
    navigate,
    logout,
  ]);

  // Is searching or filtering active?
  const isSearchingOrFiltering = Boolean(
    searchQuery.trim() || selectedKey || selectedTag,
  );

  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedKey ? 1 : 0) +
    (selectedTag ? 1 : 0);

  // Subfolders inside current directory or scope search results
  const filteredSubfolders = useMemo(() => {
    let list: Folder[];

    if (!isSearchingOrFiltering) {
      list =
        currentFolderId === null
          ? allFolders.filter((f) => !f.parentId)
          : allFolders.filter((f) => f.parentId === currentFolderId);
    } else {
      const q = searchQuery.toLowerCase().trim();
      list = allFolders.filter((f) => {
        if (f.id === currentFolderId) return false;
        if (currentFolderId !== null && !descendantFolderIds.has(f.id)) {
          return false;
        }
        if (q) {
          return f.name.toLowerCase().includes(q);
        }
        return true;
      });
    }

    return [...list].sort((a, b) => {
      let valA = (a.name || "").toLowerCase();
      let valB = (b.name || "").toLowerCase();

      if (sortBy === "updatedAt") {
        valA = a.createdAt || "";
        valB = b.createdAt || "";
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    allFolders,
    currentFolderId,
    descendantFolderIds,
    isSearchingOrFiltering,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  // Songs inside current directory or scope search results
  const filteredFiles = useMemo(() => {
    let list: Song[];

    if (!isSearchingOrFiltering) {
      list = allSongs.filter((s) => {
        if (currentFolderId === null) {
          return !s.folderId;
        }
        return s.folderId === currentFolderId;
      });
    } else {
      const q = searchQuery.toLowerCase().trim();

      list = allSongs.filter((s) => {
        if (currentFolderId !== null) {
          if (!s.folderId || !descendantFolderIds.has(s.folderId)) {
            return false;
          }
        }

        if (selectedTag && (!s.tags || !s.tags.includes(selectedTag)))
          return false;

        if (q) {
          let matches = false;
          if (searchFields.title && s.title.toLowerCase().includes(q))
            matches = true;
          if (searchFields.artist && s.artist?.toLowerCase().includes(q))
            matches = true;
          if (searchFields.content && s.content?.toLowerCase().includes(q))
            matches = true;
          if (
            searchFields.tags &&
            s.tags?.some((t) => t.toLowerCase().includes(q))
          )
            matches = true;

          const folderName = allFolders
            .find((f) => f.id === s.folderId)
            ?.name.toLowerCase();
          if (folderName && folderName.includes(q)) matches = true;

          if (!matches) return false;
        }

        return true;
      });
    }

    return [...list].sort((a, b) => {
      let valA = (a.title || "").toLowerCase();
      let valB = (b.title || "").toLowerCase();

      if (sortBy === "artist") {
        valA = (a.artist || "").toLowerCase();
        valB = (b.artist || "").toLowerCase();
      } else if (sortBy === "updatedAt") {
        valA = a.updatedAt || "";
        valB = b.updatedAt || "";
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    allSongs,
    currentFolderId,
    descendantFolderIds,
    isSearchingOrFiltering,
    searchQuery,
    selectedKey,
    selectedTag,
    searchFields,
    sortBy,
    sortOrder,
    allFolders,
  ]);

  // Ordered view items for shift-click range selection
  const viewItems = useMemo(() => {
    const folders = filteredSubfolders.map((f) => ({
      id: f.id,
      type: "folder" as const,
      item: f,
    }));
    const songs = filteredFiles.map((s) => ({
      id: s.id,
      type: "song" as const,
      item: s,
    }));
    return [...folders, ...songs];
  }, [filteredSubfolders, filteredFiles]);

  // Selection Handlers (Click, Ctrl+Click, Shift+Click)
  const handleItemClick = useCallback(
    (e: React.MouseEvent, id: string, type: "folder" | "song") => {
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        if (type === "folder") toggleFolderSelect(id);
        else toggleSongSelect(id);
        setLastClickedId(id);
      } else if (e.shiftKey && lastClickedId) {
        const allIds = viewItems.map((v) => v.id);
        const idx1 = allIds.indexOf(lastClickedId);
        const idx2 = allIds.indexOf(id);

        if (idx1 !== -1 && idx2 !== -1) {
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const range = viewItems.slice(start, end + 1);

          const nextFolders = new Set<string>();
          const nextSongs = new Set<string>();

          range.forEach((v) => {
            if (v.type === "folder") nextFolders.add(v.id);
            else nextSongs.add(v.id);
          });

          setSelectedFolderIds(nextFolders);
          setSelectedSongIds(nextSongs);
        } else {
          if (type === "folder") {
            setSelectedFolderIds(new Set([id]));
            setSelectedSongIds(new Set());
          } else {
            setSelectedFolderIds(new Set());
            setSelectedSongIds(new Set([id]));
          }
        }
        setLastClickedId(id);
      } else {
        if (type === "folder") {
          setSelectedFolderIds(new Set([id]));
          setSelectedSongIds(new Set());
        } else {
          setSelectedFolderIds(new Set());
          setSelectedSongIds(new Set([id]));
        }
        setLastClickedId(id);
      }
    },
    [viewItems, lastClickedId],
  );

  const toggleFolderSelect = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSongSelect = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllInCurrentView = () => {
    setSelectedFolderIds(new Set(filteredSubfolders.map((f) => f.id)));
    setSelectedSongIds(new Set(filteredFiles.map((s) => s.id)));
  };

  const clearSelection = () => {
    setSelectedFolderIds(new Set());
    setSelectedSongIds(new Set());
    setLastClickedId(null);
  };

  // Marquee Drag Selection Handler
  const handleWorkspaceMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (target.closest('button, input, a, [role="dialog"], [data-item-id]')) {
        return;
      }

      const isAdditive = e.ctrlKey || e.metaKey;

      isMouseDownRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      if (!isAdditive) {
        clearSelection();
        initialSelectionRef.current = { folders: new Set(), songs: new Set() };
      } else {
        initialSelectionRef.current = {
          folders: new Set(selectedFolderIds),
          songs: new Set(selectedSongIds),
        };
      }
    },
    [selectedFolderIds, selectedSongIds],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (
        !isMouseDownRef.current ||
        !startPosRef.current ||
        !containerRef.current
      )
        return;

      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;
      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width > 4 || height > 4) {
        setSelectionBox({ x: left, y: top, width, height });

        const itemEls =
          containerRef.current.querySelectorAll<HTMLElement>("[data-item-id]");
        const nextFolders = new Set(initialSelectionRef.current.folders);
        const nextSongs = new Set(initialSelectionRef.current.songs);

        itemEls.forEach((el) => {
          const id = el.getAttribute("data-item-id");
          const type = el.getAttribute("data-item-type") as "folder" | "song";
          if (!id || !type) return;

          const rect = el.getBoundingClientRect();

          const intersects = !(
            rect.right < left ||
            rect.left > left + width ||
            rect.bottom < top ||
            rect.top > top + height
          );

          if (intersects) {
            if (type === "folder") nextFolders.add(id);
            else nextSongs.add(id);
          }
        });

        setSelectedFolderIds(nextFolders);
        setSelectedSongIds(nextSongs);
      }
    };

    const handleMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        startPosRef.current = null;
        setSelectionBox(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const totalSelectedCount = selectedFolderIds.size + selectedSongIds.size;

  const selectedFolderObjects = useMemo(
    () => allFolders.filter((f) => selectedFolderIds.has(f.id)),
    [allFolders, selectedFolderIds],
  );

  const disabledFolderIdsForBatchMove = useMemo(() => {
    const disabled = new Set<string>();
    const selectedList = Array.from(selectedFolderIds) as string[];
    selectedList.forEach((id) => disabled.add(id));

    function addDescendants(folderId: string) {
      const children = allFolders.filter((f) => f.parentId === folderId);
      children.forEach((child) => {
        disabled.add(child.id);
        addDescendants(child.id);
      });
    }

    selectedList.forEach((id) => addDescendants(id));
    return disabled;
  }, [selectedFolderIds, allFolders]);

  // Batch Handlers
  const handleBatchMoveConfirm = useCallback(
    async (targetFolderId: string | null) => {
      const folderList = Array.from(selectedFolderIds) as string[];
      const songList = Array.from(selectedSongIds) as string[];

      // OPTIMISTIC UPDATE: snapshot current cache then apply changes immediately
      const prevFoldersData = queryClient.getQueryData(["folders"]);
      const prevSongsData = queryClient.getQueryData(["songs", "all", {}]);

      if (folderList.length > 0) {
        queryClient.setQueryData(
          ["folders"],
          (old: { folders: Folder[] } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              folders: old.folders.map((f: Folder) =>
                folderList.includes(f.id)
                  ? { ...f, parentId: targetFolderId }
                  : f,
              ),
            };
          },
        );
      }

      if (songList.length > 0) {
        queryClient.setQueryData(
          ["songs", "all", {}],
          (old: { songs: Song[] } | undefined) => {
            if (!old || !old.songs) return old;
            return {
              ...old,
              songs: old.songs.map((s: Song) =>
                songList.includes(s.id)
                  ? { ...s, folderId: targetFolderId }
                  : s,
              ),
            };
          },
        );
      }

      clearSelection();

      try {
        for (const fId of folderList) {
          const f = allFolders.find((x) => x.id === fId);
          if (f)
            await moveFolder({
              id: fId,
              parentId: targetFolderId,
              updatedAt: f.updatedAt!,
            });
        }
        for (const sId of songList) {
          const s = allSongs.find((x) => x.id === sId);
          if (s)
            await moveSong({
              id: sId,
              folderId: targetFolderId,
              updatedAt: s.updatedAt,
            });
        }

        showToast(
          `${folderList.length + songList.length} item(ns) movido(s) com sucesso!`,
          "success",
        );
      } catch {
        if (prevFoldersData)
          queryClient.setQueryData(["folders"], prevFoldersData);
        if (prevSongsData)
          queryClient.setQueryData(["songs", "all", {}], prevSongsData);
        showToast(
          "Erro ao mover itens. As alterações foram revertidas.",
          "error",
        );
      }
    },
    [
      selectedFolderIds,
      selectedSongIds,
      allFolders,
      allSongs,
      queryClient,
      moveFolder,
      moveSong,
      showToast,
      clearSelection,
    ],
  );

  const handleBatchDeleteConfirm = async (
    folderAction: "move_to_root" | "delete_songs",
  ) => {
    const folderList = Array.from(selectedFolderIds) as string[];
    const songList = Array.from(selectedSongIds) as string[];

    for (const fId of folderList) {
      await deleteFolder({ id: fId, action: folderAction });
    }
    for (const sId of songList) {
      await deleteSong(sId);
    }

    showToast(
      `${folderList.length + songList.length} item(ns) apagado(s) com sucesso!`,
      "success",
    );
    clearSelection();
  };

  const handleBatchTagConfirm = async (
    tags: string[],
    mode: "append" | "replace" | "remove",
  ) => {
    const songList = Array.from(selectedSongIds) as string[];
    if (songList.length === 0) return;
    await updateBatchTags({ songIds: songList, tags, mode });
    clearSelection();
  };

  // Auto-expand parent folders when selecting a folder
  useEffect(() => {
    if (currentFolderId && allFolders.length > 0) {
      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        let curr = allFolders.find((f) => f.id === currentFolderId);
        while (curr) {
          next.add(curr.id);
          if (!curr.parentId) break;
          curr = allFolders.find((f) => f.id === curr?.parentId);
        }
        return next;
      });
    }
  }, [currentFolderId, allFolders]);

  // Close context menu on window click or escape
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };

    window.addEventListener("click", handleCloseMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleCloseMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        clearSelection();
        return;
      }

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        if (!isExplorerView) return;
        e.preventDefault();
        selectAllInCurrentView();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (totalSelectedCount === 0) return;
        e.preventDefault();

        if (totalSelectedCount === 1) {
          if (selectedFolderIds.size === 1) {
            const folder = allFolders.find(
              (f) => f.id === Array.from(selectedFolderIds)[0],
            );
            if (folder) setDeleteTarget(folder);
          } else {
            const song = allSongs.find(
              (s) => s.id === Array.from(selectedSongIds)[0],
            );
            if (song) setDeleteSongTarget(song);
          }
        } else {
          setIsBatchDeleteOpen(true);
        }
        return;
      }

      if (e.key === "Enter") {
        if (totalSelectedCount !== 1) return;
        if (selectedFolderIds.size === 1) {
          handleSelectFolder(Array.from(selectedFolderIds)[0]);
        } else if (selectedSongIds.size === 1) {
          navigate(`${slugPrefix}/songs/${Array.from(selectedSongIds)[0]}`);
        }
      }
    };

    window.addEventListener("click", handleCloseMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleCloseMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    totalSelectedCount,
    selectedFolderIds,
    selectedSongIds,
    allFolders,
    allSongs,
    isExplorerView,
  ]);

  const toggleExpand = (id: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Context Menu trigger
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: "folder" | "song", item: Folder | Song) => {
      e.preventDefault();
      e.stopPropagation();

      const isAlreadySelected =
        type === "folder"
          ? selectedFolderIds.has(item.id)
          : selectedSongIds.has(item.id);

      if (!isAlreadySelected) {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          if (type === "folder") {
            setSelectedFolderIds(new Set([item.id]));
            setSelectedSongIds(new Set());
          } else {
            setSelectedFolderIds(new Set());
            setSelectedSongIds(new Set([item.id]));
          }
          setLastClickedId(item.id);
        } else {
          if (type === "folder") toggleFolderSelect(item.id);
          else toggleSongSelect(item.id);
          setLastClickedId(item.id);
        }
      }

      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 280);

      setContextMenu({ x, y, type, item });
    },
    [selectedFolderIds, selectedSongIds],
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-item-id]")) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 300);

      setContextMenu({ x, y, type: "canvas", item: null });
    },
    [currentFolder],
  );

  // Folder Actions
  const handleCreateFolderSubmit = async (name: string) => {
    await createFolder({ name, parentId: currentFolderId });
    setIsCreateModalOpen(false);
  };

  const handleRenameFolderSubmit = async (name: string) => {
    if (!renameTarget) return;
    await renameFolder({
      id: renameTarget.id,
      name,
      updatedAt: renameTarget.updatedAt!,
    });
    setRenameTarget(null);
  };

  const handleMoveFolderSubmit = async () => {
    if (!moveFolderTarget) return;
    await moveFolder({
      id: moveFolderTarget.id,
      parentId: targetParentFolderId,
      updatedAt: moveFolderTarget.updatedAt!,
    });
    setMoveFolderTarget(null);
  };

  const handleDeleteFolderSubmit = async () => {
    if (!deleteTarget) return;
    if (
      deleteAção === "delete_songs" &&
      confirmFolderName.trim() !== deleteTarget.name.trim()
    ) {
      showToast(
        "O nome da pasta inserido não é igual ao nome da pasta.",
        "error",
      );
      return;
    }
    await deleteFolder({ id: deleteTarget.id, action: deleteAção });
    if (currentFolderId === deleteTarget.id) {
      setCurrentFolderId(null);
    }
    setDeleteTarget(null);
    setConfirmFolderName("");
    setDeleteAção("move_to_root");
  };

  // Song Actions
  const handleCreateSongSubmit = async (data: {
    title: string;
    artist: string;
    folderId: string | null;
    tags: string[];
  }) => {
    const song = await songsApi.createSong({
      title: data.title,
      artist: data.artist,
      folderId: data.folderId,
      content: `{title: ${data.title}}\n{artist: ${data.artist}}\n\n[G] Exemplo de tom e cifra...`,
      tags: data.tags,
    });
    await Promise.all([songsQuery.refetch(), foldersQuery.refetch()]);
    setIsCreateSongModalOpen(false);
    showToast("Cântico criado com sucesso!", "success");
    navigate(`${slugPrefix}/songs/${song.id}`);
  };

  const handlePrintSongs = async () => {
    setContextMenu(null);
    selectedSongIds.forEach(async (_id) => {
      //const html = await printApi.printSong(id);
      //printHtmlDirectly(html);
    });
  };

  const handlePrintSong = async (_id: string) => {
    setContextMenu(null);
    //const html = await printApi.printSong(id);
    //printHtmlDirectly(html);
  };

  const handlePrintFolders = async () => {
    setContextMenu(null);
    selectedFolderIds.forEach(async (_id) => {
      //const html = await printApi.printFolder(id);
      //printHtmlDirectly(html);
    });
  };

  const handlePrintFolder = async (_id: string) => {
    setContextMenu(null);
    //const html = await printApi.printFolder(id);
    //printHtmlDirectly(html);
  };

  const handleCifraClubSubmit = async (
    chordpro: ConversionResult,
    artist: string,
    title: string,
  ) => {
    const song = await songsApi.createSong({
      title,
      artist,
      folderId: currentFolderId,
      content: `{title: ${title}}\n{artist: ${artist}}\n\n${chordpro.chordpro}`,
      tags: ["cifraclub"],
    });
    await Promise.all([songsQuery.refetch(), foldersQuery.refetch()]);
    setIsCreateSongModalOpen(false);
    showToast("Cântico importado com sucesso!", "success");
    navigate(`${slugPrefix}/songs/${song.id}`);
  };

  const handleCreateServiceSubmit = async (data: {
    name: string;
    date: string;
    notes: string;
  }) => {
    const newService = await createService({
      name: data.name,
      date: data.date,
      notes: data.notes,
      elements: [],
    });
    setIsCreateServiceModalOpen(false);
    navigate(`${slugPrefix}/services/${newService.id}`);
  };

  const handleDeleteSongSubmit = async () => {
    if (!deleteSongTarget) return;
    await deleteSong(deleteSongTarget.id);
    setDeleteSongTarget(null);
  };

  const showToastImportResult = (result: ProviderImportResult) => {
    if (result.created > 0) {
      const targetFolderName = currentFolder
        ? currentFolder.name
        : "Diretório Raiz";
      showToast(
        `${result.created} ficheiro(s) ${result.fileTypeName} carregado(s) com sucesso para "${targetFolderName}"!`,
        "success",
      );
    }

    if (result.failed > 0) {
      showToast(
        `Erro ao carregar ${result.failed} ficheiro(s)  ${result.fileTypeName}`,
        "error",
      );
    }

    if (result.ignored > 0) {
      showToast(
        `Ignorado ${result.ignored} ficheiro(s) ${result.fileTypeName}`,
        "warning",
      );
    }
  };

  const processAndUploadFiles = async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploadingFiles(true);
    const result = await songImportRegistry.importFiles(fileList, {
      folderId: currentFolderId,
    });

    result.results.forEach((r) => {
      showToastImportResult(r);
    });

    await Promise.all([songsQuery.refetch(), foldersQuery.refetch()]);

    setIsUploadingFiles(false);
  };

  const handleChordProFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAndUploadFiles(Array.from(files));
    }
    if (e.target) e.target.value = "";
  };

  // Drag & Drop Handlers for Folder Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInternalDragActive) return; // não mostra overlay de upload durante drag interno
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (isInternalDragActive) {
      setIsInternalDragActive(false);
      return; // era um drag interno que escapou de uma pasta — ignora como upload
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processAndUploadFiles(Array.from(files));
    }
  };

  const handleItemDragStart = useCallback(
    (e: React.DragEvent, id: string, type: "folder" | "song") => {
      const isSelected =
        type === "folder" ? selectedFolderIds.has(id) : selectedSongIds.has(id);

      if (!isSelected) {
        if (type === "folder") {
          setSelectedFolderIds(new Set([id]));
          setSelectedSongIds(new Set());
        } else {
          setSelectedFolderIds(new Set());
          setSelectedSongIds(new Set([id]));
        }
        setLastClickedId(id);
      }

      // Compute total items that will be dragged
      const willFolders =
        !isSelected && type === "folder"
          ? new Set([id])
          : isSelected
            ? selectedFolderIds
            : type === "folder"
              ? new Set([...selectedFolderIds, id])
              : selectedFolderIds;
      const willSongs =
        !isSelected && type === "song"
          ? new Set([id])
          : isSelected
            ? selectedSongIds
            : type === "song"
              ? new Set([...selectedSongIds, id])
              : selectedSongIds;
      const totalDragging = willFolders.size + willSongs.size;

      if (totalDragging > 1) {
        // Build a stacked ghost drag image
        const ghost = document.createElement("div");
        ghost.style.cssText = [
          "position:fixed",
          "top:-2000px",
          "left:-2000px",
          "width:150px",
          "height:60px",
          "pointer-events:none",
          "z-index:9999",
        ].join(";");

        const stackCount = Math.min(totalDragging, 3);
        for (let i = stackCount - 1; i >= 0; i--) {
          const card = document.createElement("div");
          const rotation = (i - Math.floor(stackCount / 2)) * 4;
          const yOffset = i * -3;
          card.style.cssText = [
            "position:absolute",
            "width:140px",
            "height:44px",
            "background:white",
            "border:2px solid rgba(2,132,199,0.6)",
            "border-radius:14px",
            "box-shadow:0 4px 16px rgba(0,0,0,0.18)",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            `transform:rotate(${rotation}deg) translateY(${yOffset}px)`,
            "font-size:12px",
            "font-weight:800",
            "color:#0284c7",
            "letter-spacing:0.05em",
            "font-family:system-ui,sans-serif",
            `top:${(stackCount - 1 - i) * 3}px`,
            "left:0",
          ].join(";");
          if (i === 0) {
            card.textContent = `${totalDragging} itens`;
          }
          ghost.appendChild(card);
        }

        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 70, 22);
        requestAnimationFrame(() => {
          if (document.body.contains(ghost)) document.body.removeChild(ghost);
        });
      }

      setIsInternalDragActive(true);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/x-app-internal-drag", "true");
    },
    [selectedFolderIds, selectedSongIds],
  );

  const handleItemDragEnd = useCallback(() => {
    setIsInternalDragActive(false);
    setDropTargetFolderId(null);
  }, []);

  const handleFolderDragOver = useCallback(
    (e: React.DragEvent, folderId: string) => {
      if (!isInternalDragActive) return;
      e.preventDefault();
      e.stopPropagation();

      if (disabledFolderIdsForBatchMove.has(folderId)) {
        e.dataTransfer.dropEffect = "none";
        return;
      }
      e.dataTransfer.dropEffect = "move";
      setDropTargetFolderId(folderId);
    },
    [isInternalDragActive, disabledFolderIdsForBatchMove],
  );

  const handleFolderDragLeave = useCallback(
    (e: React.DragEvent, folderId: string) => {
      e.stopPropagation();
      setDropTargetFolderId((prev) => (prev === folderId ? null : prev));
    },
    [],
  );

  const handleFolderDrop = useCallback(
    async (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const wasInternalDrag = isInternalDragActive;
      setDropTargetFolderId(null);
      setIsInternalDragActive(false);

      if (!wasInternalDrag || disabledFolderIdsForBatchMove.has(folderId))
        return;

      // Move direto, sem modal de confirmação
      await handleBatchMoveConfirm(folderId);
    },
    [
      isInternalDragActive,
      disabledFolderIdsForBatchMove,
      handleBatchMoveConfirm,
    ],
  );

  const totalItemsCount = filteredSubfolders.length + filteredFiles.length;

  const layoutContent = (
    <>
      {isCommandPaletteEnabled && <KBarCommandPaletteUI />}
      <div className="h-dvh max-h-dvh w-full flex flex-row overflow-hidden bg-m3-bg">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={`${isSidebarOpen ? "flex absolute inset-y-0 left-0 z-50 bg-m3-sidebar shadow-2xl" : "hidden"} md:flex md:relative md:bg-m3-sidebar/30 ${
            isSidebarCollapsed ? "md:w-20" : "md:w-64"
          } w-72 border-r border-m3-border p-4 flex-col gap-1 select-none shrink-0 transition-all duration-300 z-30`}
          role="navigation"
        >
          {/* Integrated Sidebar Header */}
          <div
            className="flex items-center justify-between mb-4 mt-2 select-none px-1"
            role="banner"
          >
            <div
              className={`flex items-center ${isSidebarCollapsed ? "justify-center w-full" : "gap-3"}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-m3-border/50 bg-m3-card transition-transform hover:scale-105 shadow-xs shrink-0">
                <img
                  src="/favicon.png"
                  alt="Hosanna Studio"
                  className="w-10 h-10 object-contain rounded-lg"
                />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <h1 className="font-display font-black text-xl tracking-tighter text-slate-900 dark:text-slate-100 leading-none truncate">
                    Hosanna Studio
                  </h1>
                  {organization && (
                    <span className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-32.5">
                      {organization?.metadata?.shortName || organization.slug}
                    </span>
                  )}
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="hidden md:flex p-1.5 rounded-xl hover:bg-m3-hover text-m3-secondary hover:text-m3-text border border-transparent hover:border-m3-border/60 transition-all cursor-pointer shrink-0"
                title="Recolher menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="hidden md:flex w-full py-2 items-center justify-center rounded-xl bg-m3-card/50 hover:bg-m3-hover border border-m3-border/40 text-m3-secondary hover:text-m3-text transition-all cursor-pointer mb-3 shadow-xs"
              title="Expandir menu"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {!isSidebarCollapsed && (
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-m3-secondary opacity-60">
              Menu Principal
            </div>
          )}

          <button
            onClick={() => {
              setCurrentFolderId(null);
              navigate(`${slugPrefix}/folders`);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            title={
              isSidebarCollapsed
                ? `Drive da ${organization?.metadata?.shortName}`
                : undefined
            }
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
              isExplorerView && currentFolderId === null
                ? "bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-sm"
                : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
            }`}
          >
            <div
              className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
            >
              <HardDrive
                className={`w-4.5 h-4.5 ${isExplorerView && currentFolderId === null ? "text-m3-primary" : "text-m3-secondary"}`}
              />
              {!isSidebarCollapsed && (
                <span>Drive da {organization?.metadata?.shortName}</span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <Badge
                variant={
                  isExplorerView && currentFolderId === null ? "sky" : "slate"
                }
              >
                {rootSongsCount + rootFoldersCount}
              </Badge>
            )}
          </button>

          <button
            onClick={() => {
              navigate(`${slugPrefix}/songs`);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            title={isSidebarCollapsed ? `Biblioteca` : undefined}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
              isSongsView
                ? "bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-sm"
                : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
            }`}
          >
            <div
              className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
            >
              {" "}
              <Music
                className={`w-4.5 h-4.5 ${isSongsView ? "text-m3-primary" : "text-m3-secondary"}`}
              />
              {!isSidebarCollapsed && <span>Biblioteca</span>}
            </div>
            {!isSidebarCollapsed && (
              <Badge variant={isSongsView ? "sky" : "slate"}>
                {totalSongs}
              </Badge>
            )}{" "}
          </button>

          <button
            onClick={() => {
              navigate(`${slugPrefix}/services`);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            title={isSidebarCollapsed ? `Cultos` : undefined}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
              isServicesView
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
            }`}
          >
            <div
              className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
            >
              {" "}
              <Church
                className={`w-4.5 h-4.5 ${isServicesView ? "text-emerald-500" : "text-m3-secondary"}`}
              />
              {!isSidebarCollapsed && <span>Cultos</span>}
            </div>
            {!isSidebarCollapsed && (
              <Badge variant={isServicesView === null ? "sky" : "slate"}>
                {totalServices}
              </Badge>
            )}
          </button>

          {teamsEnabled && (
            <button
              onClick={() => {
                navigate(`${slugPrefix}/teams`);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              title={isSidebarCollapsed ? `Equipas` : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
                isTeamsView
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm"
                  : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
              }`}
            >
              <div
                className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
              >
                <Users
                  className={`w-4.5 h-4.5 ${isTeamsView ? "text-amber-500" : "text-m3-secondary"}`}
                />
                {!isSidebarCollapsed && <span>Equipas</span>}
              </div>
            </button>
          )}

          {!isSidebarCollapsed && show_folder_tree && (
            <>
              <div className="mt-6 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-m3-secondary opacity-60">
                Pastas ({allFolders.length})
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                {folderTree.map((node) => (
                  <FolderTreeItemNode
                    key={node.folder.id}
                    node={node}
                    currentFolderId={currentFolderId}
                    onSelectFolder={(id) => {
                      handleSelectFolder(id);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    onContextMenu={handleContextMenu}
                    expandedFolderIds={expandedFolderIds}
                    toggleExpand={toggleExpand}
                  />
                ))}
              </div>
            </>
          )}
          {(isSidebarCollapsed || !show_folder_tree) && (
            <div className="flex-1" />
          )}

          {user && (
            <div
              className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 relative shrink-0"
              ref={userMenuRef}
            >
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={isSidebarCollapsed ? user.name : undefined}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
              >
                <div
                  className={`flex items-center ${isSidebarCollapsed ? "" : "gap-2"} min-w-0`}
                >
                  <div className="w-7 h-7 rounded-full bg-linear-to-tr from-[#0284c7] to-sky-400 flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0">
                    {user.image ? (
                      <img
                        src={user.image as string}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.name}
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        {getRoleLabel(user.role ?? "guest")}
                      </span>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate(`${slugPrefix}/settings`);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-[#0284c7]" />
                    Definições
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Container (Toolbar + Content) */}
        <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-0 h-full w-full overflow-hidden">
          {/* Hidden File Input for Multiple ChordPro Uploads */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pro,.chordpro,.txt,.chopro"
            onChange={handleChordProFileUpload}
            className="hidden"
          />

          {/* Explorador de Ficheiros Window Container */}
          <div
            className="bg-m3-card border md:border-none border-m3-border rounded-4xl md:rounded-none shadow-2xl md:shadow-none shadow-black/10 overflow-hidden flex flex-col flex-1 h-full transition-all duration-300"
            role="main"
          >
            {/* Explorer Address Bar & Toolbar */}
            {(isExplorerView ||
              isSongsView ||
              isServicesView ||
              isSettingsView ||
              isEditorView) && (
              <div className="p-3 sm:p-4 bg-m3-sidebar/40 border-b border-m3-border/50 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                {/* Navigation Controls & Address Bar */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full md:w-auto">
                  {/* Mobile Sidebar Toggle */}
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden p-2.5 rounded-2xl border transition-all text-m3-primary border-m3-primary/30 hover:bg-m3-primary hover:text-white bg-m3-card cursor-pointer shadow-sm shrink-0"
                  >
                    <Menu className="w-4.5 h-4.5" />
                  </button>
                  {/* Up / Back Button */}
                  <button
                    onClick={() => {
                      if (isExplorerView) {
                        handleSelectFolder(currentFolder?.parentId || null);
                      } else {
                        navigate(-1);
                      }
                    }}
                    disabled={isExplorerView && currentFolderId === null}
                    title={
                      isExplorerView
                        ? currentFolderId === null
                          ? "No Nível Raiz"
                          : currentFolder?.parentId
                            ? "Subir um nível"
                            : "Subir para a pasta Raiz"
                        : "Voltar"
                    }
                    className={`p-2.5 rounded-2xl border transition-all ${
                      isExplorerView && currentFolderId === null
                        ? "text-m3-secondary/30 bg-m3-bg border-m3-border/30 cursor-not-allowed opacity-50"
                        : "text-m3-primary border-m3-primary/30 hover:bg-m3-primary hover:text-white bg-m3-card cursor-pointer shadow-sm hover:shadow-m3-primary/20"
                    }`}
                  >
                    <CornerLeftUp className="w-4.5 h-4.5" />
                  </button>

                  {/* Address Path Bar */}
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-m3-bg border border-m3-border rounded-2xl text-[13px] overflow-x-auto select-none hide-scrollbar shadow-inner min-w-0">
                    <button
                      onClick={() => {
                        handleSelectFolder(null);
                        navigate(`${slugPrefix}/folders`);
                      }}
                      className={`flex items-center gap-2 font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
                        currentFolderId === null && isExplorerView
                          ? "text-m3-primary"
                          : "text-m3-secondary hover:text-m3-text"
                      }`}
                    >
                      <HardDrive
                        className={`w-4 h-4 ${currentFolderId === null && isExplorerView ? "text-m3-primary" : "text-m3-secondary"}`}
                      />
                      <span>Início</span>
                    </button>

                    {isExplorerView &&
                      folderBreadcrumbs.map((folder, index) => {
                        const isLast = index === folderBreadcrumbs.length - 1;
                        return (
                          <React.Fragment key={folder.id}>
                            <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                            {isLast ? (
                              <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                                <FolderOpen className="w-4 h-4" />
                                <span>{folder.name}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSelectFolder(folder.id)}
                                className="flex items-center gap-2 font-bold text-m3-secondary hover:text-m3-text transition-all cursor-pointer shrink-0"
                              >
                                <FolderIcon className="w-4 h-4 opacity-70" />
                                <span>{folder.name}</span>
                              </button>
                            )}
                          </React.Fragment>
                        );
                      })}

                    {isSongsView && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                        <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                          <Music className="w-4 h-4" />
                          <span>Biblioteca</span>
                        </div>
                      </>
                    )}

                    {isSongEditorView && (
                      <>
                        {songBreadcrumbs.map((folder) => (
                          <React.Fragment key={folder.id}>
                            <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                            <button
                              onClick={() => {
                                handleSelectFolder(folder.id);
                                navigate(`${slugPrefix}/folders`);
                              }}
                              className="flex items-center gap-2 font-bold text-m3-secondary hover:text-m3-text transition-all cursor-pointer shrink-0"
                            >
                              <FolderIcon className="w-4 h-4 opacity-70" />
                              <span>{folder.name}</span>
                            </button>
                          </React.Fragment>
                        ))}

                        {currentSong && (
                          <>
                            <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                            <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                              <FileText className="w-4 h-4" />
                              <span>{currentSongFileName}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {isServicesView && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                        <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                          <Calendar className="w-4 h-4" />
                          <span>Cultos</span>
                        </div>
                      </>
                    )}

                    {isServiceEditorView && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                        <button
                          onClick={() => navigate(`${slugPrefix}/services`)}
                          className="flex items-center gap-2 font-bold text-m3-secondary hover:text-m3-text transition-all cursor-pointer shrink-0"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Cultos</span>
                        </button>
                        {currentService && (
                          <>
                            <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                            <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                              <Calendar className="w-4 h-4" />
                              <span>{currentService.name}.service</span>
                            </div>
                            <div
                              className="ml-auto mr-2 inline-flex items-center gap-1.5 rounded-full
                                    px-3 py-1.5 text-xs font-semibold
                                    bg-m3-primary-light text-m3-primary
                                    border border-m3-primary"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {new Date(
                                  currentService.date,
                                ).toLocaleDateString("pt-PT", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {isSettingsView && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                        <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                          <Settings className="w-4 h-4" />
                          <span>Definições</span>
                        </div>
                      </>
                    )}

                    {isTeamsView && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                        <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                          <Users className="w-4 h-4" />
                          <span>Equipas</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Search, Notifications & Plus Action */}
                <div className="flex items-center gap-3 w-full md:w-auto overflow-visible hide-scrollbar pb-1 md:pb-0 justify-end">
                  {/* Search Input */}
                  {(isExplorerView || isSongsView || isServicesView) && (
                    <div className="relative w-full sm:w-64">
                      <Input
                        placeholder={
                          isServicesView
                            ? "Pesquisar cultos..."
                            : isSongsView
                              ? "Pesquisar biblioteca..."
                              : currentFolder
                                ? `Pesquisar pastas...`
                                : "Pesquisar pastas..."
                        }
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            handleSearchChange("");
                          }
                        }}
                        icon={<Search className="w-4 h-4 text-m3-secondary" />}
                        className="py-2.5 text-sm pr-9 rounded-2xl"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => handleSearchChange("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-m3-secondary hover:text-m3-text hover:bg-m3-hover rounded-lg cursor-pointer transition-all"
                          title="Limpar pesquisa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <SyncStatusBadge className="shrink-0" showText={false} />

                  <InboxButton
                    client={authClient as InboxFetchClient}
                    className="shrink-0"
                  />

                  <CanAny
                    permissions={[
                      "song.create",
                      "folder.create",
                      "song.import",
                      "service.create",
                    ]}
                  >
                    <div className="relative shrink-0 ml-1" ref={plusMenuRef}>
                      <button
                        onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                        className="w-10 h-10 rounded-2xl bg-m3-primary text-white flex items-center justify-center border border-m3-primary font-black text-lg shadow-xl shadow-m3-primary/20 hover:bg-m3-primary-dark hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Criar..."
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      {isPlusMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-64 bg-m3-card border border-m3-border rounded-3xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-m3-secondary opacity-60">
                            Criar Novo
                          </div>
                          <Can permission="song.create">
                            <button
                              onClick={() => {
                                setIsPlusMenuOpen(false);
                                setIsCreateSongModalOpen(true);
                              }}
                              className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-m3-text hover:bg-m3-hover rounded-2xl transition-all cursor-pointer text-left group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Music className="w-4 h-4" />
                              </div>
                              Novo Cântico
                            </button>
                          </Can>
                          <Can permission="song.import">
                            <button
                              onClick={() => {
                                setIsPlusMenuOpen(false);
                                setIsCifraImportOpen(true);
                              }}
                              className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-m3-text hover:bg-m3-hover rounded-2xl transition-all cursor-pointer text-left group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Music className="w-4 h-4" />
                              </div>
                              Importar Cânticos de um outro Provedor
                            </button>
                          </Can>
                          <Can permission="service.create">
                            <button
                              onClick={() => {
                                setIsPlusMenuOpen(false);
                                setIsCreateServiceModalOpen(true);
                              }}
                              className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-m3-text hover:bg-m3-hover rounded-2xl transition-all cursor-pointer text-left group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Calendar className="w-4 h-4" />
                              </div>
                              Novo Plano de Culto
                            </button>
                          </Can>
                          <Can permission="folder.create">
                            <button
                              onClick={() => {
                                setIsPlusMenuOpen(false);
                                setIsCreateModalOpen(true);
                              }}
                              className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-m3-text hover:bg-m3-hover rounded-2xl transition-all cursor-pointer text-left group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <FolderPlus className="w-4 h-4" />
                              </div>
                              Nova Pasta
                            </button>
                          </Can>
                        </div>
                      )}
                    </div>
                  </CanAny>
                </div>
              </div>
            )}

            {/* Secondary Toolbar: Filters, Sorting, View Mode & Density */}
            {(isExplorerView || isServicesView || isSongsView) && (
              <div className="px-4 py-2.5 bg-m3-sidebar/20 border-b border-m3-border/40 flex items-center justify-between gap-3 flex-wrap">
                {/* Left Side: Filter button, Archive button (services), Sort dropdown */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Filter Pop-Up Panel Trigger Button */}
                  {isExplorerView && (
                    <button
                      onClick={() => {
                        navigateBackToDrive();
                        setIsFilterPanelOpen(true);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer relative ${
                        activeFiltersCount > 0
                          ? "bg-m3-primary/10 border-m3-primary text-m3-primary shadow-lg shadow-m3-primary/10"
                          : "bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text hover:border-m3-primary/30"
                      }`}
                      title="Abrir Filtros Avançados"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filtros</span>
                      {activeFiltersCount > 0 && (
                        <span className="w-4.5 h-4.5 rounded-full bg-m3-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Archive Toggle Button (Services View) */}
                  {isServicesView && (
                    <button
                      type="button"
                      onClick={() => setShowArchived((v) => !v)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
                        showArchived
                          ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/10"
                          : "bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text hover:border-amber-500/30"
                      }`}
                      title={
                        showArchived
                          ? "Ocultar arquivados"
                          : "Mostrar arquivados"
                      }
                    >
                      <Archive className="w-4 h-4" />
                      <span>Arquivados</span>
                      {showArchived && archivedServices.length > 0 && (
                        <span className="w-4.5 h-4.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                          {archivedServices.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Sort Control Button */}
                  <div className="flex items-center gap-2 bg-m3-bg border border-m3-border rounded-2xl px-3 py-1.5 text-xs transition-all hover:border-m3-primary/30">
                    <ArrowUpDown className="w-4 h-4 text-m3-secondary shrink-0" />
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [sb, so] = e.target.value.split("-") as [
                          "title" | "artist" | "updatedAt",
                          "asc" | "desc",
                        ];
                        handleSortChange(sb, so);
                      }}
                      className="bg-transparent font-bold text-m3-text focus:outline-none cursor-pointer text-[11px] uppercase tracking-wider"
                      title={
                        isServicesView
                          ? "Organizar cultos"
                          : "Organizar ficheiros"
                      }
                    >
                      {isServicesView ? (
                        <>
                          <option value="updatedAt-desc">Data: Recente</option>
                          <option value="updatedAt-asc">Data: Antiga</option>
                          <option value="title-asc">Nome (A-Z)</option>
                          <option value="title-desc">Nome (Z-A)</option>
                        </>
                      ) : (
                        <>
                          <option value="title-asc">Nome (A-Z)</option>
                          <option value="title-desc">Nome (Z-A)</option>
                          <option value="artist-asc">Artista (A-Z)</option>
                          <option value="updatedAt-desc">Data Recente</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Right Side: View Mode Toggle & Density Selector */}
                <div className="flex items-center gap-2.5">
                  {/* View Mode Toggle (hidden in Songs view) */}
                  {!isSongsView && (
                    <div className="flex items-center p-1 bg-m3-bg rounded-2xl border border-m3-border select-none shrink-0 shadow-inner">
                      <button
                        onClick={() => handleViewModeChange("grid")}
                        title="Vista em Grelha"
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          viewMode === "grid"
                            ? "bg-m3-card text-m3-primary shadow-lg shadow-black/10"
                            : "text-m3-secondary hover:text-m3-text"
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewModeChange("list")}
                        title="Vista em Lista"
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          viewMode === "list"
                            ? "bg-m3-card text-m3-primary shadow-lg shadow-black/10"
                            : "text-m3-secondary hover:text-m3-text"
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Density Selector (Confortável / Compacto) */}
                  <div className="flex items-center gap-2 bg-m3-bg border border-m3-border rounded-2xl px-3 py-1.5 text-xs transition-all hover:border-m3-primary/30">
                    <LayoutGrid className="w-4 h-4 text-m3-primary shrink-0" />
                    <select
                      value={density}
                      onChange={(e) =>
                        handleDensityChange(
                          e.target.value as "comfortable" | "compact",
                        )
                      }
                      className="bg-transparent font-bold text-m3-text focus:outline-none cursor-pointer text-[11px] uppercase tracking-wider"
                      title="Densidade de visualização"
                    >
                      <option value="comfortable">Confortável</option>
                      <option value="compact">Compacto</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-900 overflow-hidden">
              <Outlet
                context={{
                  filteredSubfolders,
                  filteredFiles,
                  viewMode,
                  density,
                  setDensity: handleDensityChange,
                  isSearchingOrFiltering,
                  currentFolder,
                  searchQuery,
                  handleItemClick,
                  handleSelectFolder,
                  handleContextMenu,
                  getFolderPathString,
                  selectedFolderIds,
                  selectedSongIds,
                  foldersQuery,
                  songsQuery,
                  setIsCreateSongModalOpen,
                  fileInputRef,
                  sortBy,
                  sortOrder,
                  hideHeader: true,
                  selectedKey,
                  selectedTag,
                  searchFields,
                  containerRef,
                  handleWorkspaceMouseDown,
                  handleCanvasContextMenu,
                  handleDragOver,
                  handleDragLeave,
                  handleDrop,
                  isDraggingOver,
                  totalItemsCount,
                  currentFolderId,
                  selectionBox,
                  isInternalDragActive,
                  dropTargetFolderId,
                  dragDisabledFolderIds: disabledFolderIdsForBatchMove,
                  handleItemDragStart,
                  handleItemDragEnd,
                  handleFolderDragOver,
                  handleFolderDragLeave,
                  handleFolderDrop,
                  showArchived,
                  setShowArchived,
                  archivedServices,
                  archivedServicesQuery,
                }}
              />
            </div>

            {/* Status Bar */}
            {isExplorerView && (
              <div className="h-10 bg-m3-sidebar/40 border-t border-m3-border px-6 flex items-center justify-between text-[10px] text-m3-secondary font-black uppercase tracking-widest select-none">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 opacity-60" />
                    {currentFolder ? `/${currentFolder.name}` : "/ (Raiz)"}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span>{filteredSubfolders.length} Pastas</span>
                  <span>{filteredFiles.length} Ficheiros</span>
                  <span className="text-m3-primary">
                    {totalItemsCount} Total
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer />

      {totalSelectedCount > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-3xl shadow-2xl px-5 py-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-xs font-black uppercase tracking-widest px-2">
            {totalSelectedCount} itens selecionados
          </span>

          <div className="h-6 w-px bg-white/20 dark:bg-slate-900/20" />

          <CanAny permissions={["song.update", "folder.update"]}>
            <Button
              size="sm"
              variant="ghost"
              icon={<Move className="w-4 h-4" />}
              onClick={() => setIsBatchMoveOpen(true)}
              className="text-white! dark:text-slate-900! hover:bg-white/10! dark:hover:bg-slate-900/10!"
            >
              Mover
            </Button>
          </CanAny>

          <CanAny permissions={["song.delete", "folder.delete"]}>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setIsBatchDeleteOpen(true)}
              className="text-rose-400! hover:bg-rose-500/10!"
            >
              Eliminar
            </Button>
          </CanAny>

          <Button
            size="sm"
            variant="ghost"
            icon={<X className="w-4 h-4" />}
            onClick={clearSelection}
            className="text-white/70! dark:text-slate-900/70! hover:bg-white/10! dark:hover:bg-slate-900/10!"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* FLOATING CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "canvas" ? (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-0.5 truncate flex items-center justify-between">
                <span>
                  {currentFolder ? currentFolder.name : "Diretório Raiz"}
                </span>
                <span className="text-[9px] text-slate-400 font-normal">
                  Opções
                </span>
              </div>

              <Can permission="folder.create">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>Nova Pasta</span>
                </button>
              </Can>

              <Can permission="song.create">
                <button
                  onClick={() => {
                    setIsCreateSongModalOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#0284c7]" />
                  <span>Novo Cântico</span>
                </button>
              </Can>

              <Can permission="song.import">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#0284c7]" />
                  <span>Carregar Ficheiros</span>
                </button>
              </Can>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

              <button
                onClick={() => {
                  selectAllInCurrentView();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-slate-500" />
                <span>Selecionar Tudo</span>
              </button>

              <button
                onClick={() => {
                  foldersQuery.refetch();
                  songsQuery.refetch();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-slate-500" />
                <span>Atualizar Vista</span>
              </button>
            </>
          ) : totalSelectedCount > 1 ? (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0284c7] border-b border-slate-100 dark:border-slate-800/80 mb-0.5 truncate flex items-center justify-between">
                <span>Seleção Múltipla</span>
                <Badge variant="sky">{totalSelectedCount}</Badge>
              </div>

              {selectedSongIds.size > 0 && (
                <>
                  <Can permission="song.update">
                    <button
                      onClick={() => {
                        setIsBatchTagOpen(true);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
                    >
                      <Tag className="w-4 h-4 text-[#0284c7]" />
                      <span>Etiquetar {selectedSongIds.size} cântico(s)</span>
                    </button>
                  </Can>
                  <Can permission="export.pdf">
                    <button
                      onClick={handlePrintSongs}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#0284c7]" />
                      <span>Imprimir {selectedSongIds.size} cântico(s)</span>
                    </button>
                  </Can>
                </>
              )}

              {selectedFolderIds.size > 0 && (
                <Can permission="export.pdf">
                  <button
                    onClick={handlePrintFolders}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#0284c7]" />
                    <span>Imprimir {selectedFolderIds.size} Pastas</span>
                  </button>
                </Can>
              )}

              <CanAll permissions={["song.update", "folder.update"]}>
                <button
                  onClick={() => {
                    setIsBatchMoveOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
                >
                  <Move className="w-4 h-4 text-emerald-500" />
                  <span>Mover {totalSelectedCount} itens</span>
                </button>
              </CanAll>

              <CanAll permissions={["song.delete", "folder.delete"]}>
                <button
                  onClick={() => {
                    setIsBatchDeleteOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Apagar {totalSelectedCount} itens</span>
                </button>
              </CanAll>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

              <button
                onClick={() => {
                  clearSelection();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Desmarcar seleção</span>
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-0.5 truncate">
                {contextMenu.type === "folder"
                  ? (contextMenu.item as Folder).name
                  : (contextMenu.item as Song).title}
              </div>

              {contextMenu.type === "folder" ? (
                <>
                  <button
                    onClick={() => {
                      handleSelectFolder((contextMenu.item as Folder).id);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span>Abrir Pasta</span>
                  </button>

                  <Can permission="folder.update">
                    <button
                      onClick={() => {
                        setRenameTarget(contextMenu.item as Folder);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                    >
                      <Edit2 className="w-4 h-4 text-[#0284c7]" />
                      <span>Mudar Nome da Pasta</span>
                    </button>

                    <button
                      onClick={() => {
                        const folder = contextMenu.item as Folder;
                        setMoveFolderTarget(folder);
                        setTargetParentFolderId(folder.parentId || null);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                    >
                      <Move className="w-4 h-4 text-emerald-500" />
                      <span>Mover Pasta</span>
                    </button>
                  </Can>

                  <Can permission="export.pdf">
                    <button
                      onClick={async () => {
                        await handlePrintFolder(
                          (contextMenu.item as Folder).id,
                        );
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                    >
                      <Printer className="w-4 h-4 text-emerald-500" />
                      <span>Imprimir Pasta</span>
                    </button>
                  </Can>

                  <Can permission="folder.delete">
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                    <button
                      onClick={() => {
                        setDeleteTarget(contextMenu.item as Folder);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-left"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Apagar Pasta</span>
                    </button>
                  </Can>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate(
                        `${slugPrefix}/songs/${(contextMenu.item as Song).id}`,
                      );
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                  >
                    <ExternalLink className="w-4 h-4 text-[#0284c7]" />
                    <span>Abrir / Editar Cântico</span>
                  </button>
                  <Can permission="song.update">
                    <button
                      onClick={() => {
                        const song = contextMenu.item as Song;
                        setMoveSongTarget(song);
                        setTargetSongFolderId(song.folderId || null);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                      <span>Mover Cântico</span>
                    </button>

                    <button
                      onClick={() => {
                        const song = contextMenu.item as Song;
                        setSelectedSongIds(new Set([song.id]));
                        setIsBatchTagOpen(true);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                    >
                      <Tag className="w-4 h-4 text-[#0284c7]" />
                      <span>Etiquetar Cântico</span>
                    </button>
                  </Can>
                  <Can permission="export.pdf">
                    <button
                      onClick={async () => {
                        handlePrintSong((contextMenu.item as Song).id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
                    >
                      <Printer className="w-4 h-4 text-emerald-500" />
                      <span>Imprimir Cântico</span>
                    </button>
                  </Can>

                  <Can permission="song.delete">
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                    <button
                      onClick={() => {
                        setDeleteSongTarget(contextMenu.item as Song);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-left"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Apagar Cântico</span>
                    </button>
                  </Can>
                </>
              )}
            </>
          )}
        </div>
      )}

      <CifraClubImportModal
        isOpen={isCifraImportOpen}
        handleClose={() => {
          setIsCifraImportOpen(false);
        }}
        handleSave={handleCifraClubSubmit}
      />

      {/* CREATE SONG MODAL */}
      <Modal
        isOpen={isCreateSongModalOpen}
        onClose={() => setIsCreateSongModalOpen(false)}
        title={
          currentFolder
            ? `Criar Novo Cântico em "${currentFolder.name}"`
            : "Criar Novo Cântico na Raiz"
        }
      >
        <SongForm
          initialValues={{ folderId: currentFolderId }}
          folders={allFolders}
          onSubmit={handleCreateSongSubmit}
          onCancel={() => setIsCreateSongModalOpen(false)}
        />
      </Modal>

      {/* CREATE SERVICE MODAL */}
      <Modal
        isOpen={isCreateServiceModalOpen}
        onClose={() => setIsCreateServiceModalOpen(false)}
        title="Criar Plano de Culto"
      >
        <ServiceForm
          onSubmit={handleCreateServiceSubmit}
          onCancel={() => setIsCreateServiceModalOpen(false)}
        />
      </Modal>

      {/* CREATE FOLDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          currentFolder
            ? `Criar Pasta dentro de "${currentFolder.name}"`
            : "Criar Nova Pasta na Raiz"
        }
      >
        <FolderForm
          onSubmit={handleCreateFolderSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* RENAME FOLDER MODAL */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={`Mudar Nome da Pasta "${renameTarget?.name}"`}
      >
        <FolderForm
          initialName={renameTarget?.name || ""}
          title="Atualizar Nome da Pasta"
          onSubmit={handleRenameFolderSubmit}
          onCancel={() => setRenameTarget(null)}
        />
      </Modal>

      {/* MOVE FOLDER MODAL (TREE HIERARCHY) */}
      <Modal
        isOpen={!!moveFolderTarget}
        onClose={() => setMoveFolderTarget(null)}
        title={`Mover Pasta "${moveFolderTarget?.name}"`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecione uma nova pasta de destino para{" "}
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
                <span>Diretório Raiz (Top Level)</span>
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
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleMoveFolderSubmit}>
              Mover Pasta
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
          setDeleteAção("move_to_root");
        }}
        title={`Apagar Pasta "${deleteTarget?.name}"`}
      >
        {(deleteTarget?.folderCount || 0) + (deleteTarget?.songCount || 0) >
        0 ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <span>
                Selecione como tratar os conteúdos dentro desta pasta:
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="radio"
                  name="deleteAção"
                  value="move_to_root"
                  checked={deleteAção === "move_to_root"}
                  onChange={() => {
                    setDeleteAção("move_to_root");
                    setConfirmFolderName("");
                  }}
                  className="text-[#0284c7] focus:ring-[#0284c7]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Mover Conteúdos para a Raiz (Recomendado)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Mantém as cifras dos cânticos na biblioteca sem categoria de
                    pasta.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-rose-200 dark:border-rose-950 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                <input
                  type="radio"
                  name="deleteAção"
                  value="delete_songs"
                  checked={deleteAção === "delete_songs"}
                  onChange={() => setDeleteAção("delete_songs")}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Apagar pasta e todos os conteúdos nela contidos
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Apaga permanentemente a pasta E todos os ficheiros de
                    cânticos e pastas e os conteudoes das mesmas, dentro dela.
                  </span>
                </div>
              </label>
            </div>

            {deleteAção === "delete_songs" && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Confirmação Adicional de Segurança</span>
                </div>
                <p className="text-rose-900 dark:text-rose-200 text-[11px] leading-relaxed">
                  Esta ação é irreversível. Para confirmar a eliminação
                  permanente da pasta e de todos os seus cânticos, escreva o
                  nome da pasta{" "}
                  <strong className="font-extrabold underline">
                    {deleteTarget?.name}
                  </strong>{" "}
                  abaixo:
                </p>
                <Input
                  placeholder={`Escreva "${deleteTarget?.name}" para confirmar`}
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
                  setDeleteAção("move_to_root");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={
                  deleteAção === "delete_songs" &&
                  confirmFolderName.trim() !== deleteTarget?.name?.trim()
                }
                onClick={handleDeleteFolderSubmit}
              >
                Confirmar Eliminação
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Apagar pasta
                  </span>
                  <span className="text-[11px] text-slate-500">
                    A pasta está vazia e será eliminada
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteTarget(null);
                    setConfirmFolderName("");
                    setDeleteAção("move_to_root");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    deleteAção === "delete_songs" &&
                    confirmFolderName.trim() !== deleteTarget?.name?.trim()
                  }
                  onClick={handleDeleteFolderSubmit}
                >
                  Confirmar Eliminação
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
        onConfirm={async (targetFolderId) => {
          if (!moveSongTarget) return;
          await moveSong({
            id: moveSongTarget.id,
            folderId: targetFolderId,
            updatedAt: moveSongTarget.updatedAt,
          });
          setMoveSongTarget(null);
        }}
      />

      {/* DELETE SONG MODAL */}
      <Modal
        isOpen={!!deleteSongTarget}
        onClose={() => setDeleteSongTarget(null)}
        title={`Apagar Cântico "${deleteSongTarget?.title}"`}
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>
              Tem a certeza que deseja apagar permanentemente{" "}
              <strong>&quot;{deleteSongTarget?.title}&quot;</strong>? Isto
              também irá removê-lo de quaisquer cultos agendados.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setDeleteSongTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteSongSubmit}>
              Apagar Cântico
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
        onConfirm={handleBatchMoveConfirm}
      />

      {/* BATCH DELETE MODAL */}
      <BatchDeleteModal
        isOpen={isBatchDeleteOpen}
        onClose={() => setIsBatchDeleteOpen(false)}
        selectedFolders={selectedFolderObjects}
        selectedSongsCount={selectedSongIds.size}
        onConfirm={handleBatchDeleteConfirm}
      />

      {/* BATCH TAG MODAL */}
      <BatchTagModal
        isOpen={isBatchTagOpen}
        onClose={() => setIsBatchTagOpen(false)}
        selectedSongIds={Array.from(selectedSongIds)}
        onConfirm={handleBatchTagConfirm}
      />

      {/* ADVANCED FILTER POPUP MODAL */}
      <Modal
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title="Filtros Avançados de Pesquisa"
      >
        <div className="space-y-5 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            Âmbito de pesquisa:{" "}
            <span className="font-bold text-[#0284c7]">
              {currentFolder
                ? `Pasta "${currentFolder.name}" e Subpastas`
                : "Todo o Explorador (Diretório Raiz)"}
            </span>
          </p>

          {/* Tag / Category Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Categoria / Etiqueta
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
                Todas as Categorias
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
              Campos de Pesquisa de Texto
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
                <span>Título / Nome</span>
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
                <span>Artista / Autor</span>
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
                <span>Letra / Conteúdo</span>
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
                <span>Etiquetas / Tags</span>
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedKey("");
                setSelectedTag("");
                setSearchQuery("");
                setSearchFields({
                  title: true,
                  artist: true,
                  content: true,
                  tags: true,
                });
              }}
            >
              Limpar Filtros
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsFilterPanelOpen(false)}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Modal>

      {/* Marquee rubberband drag selection box */}
      {selectionBox && (
        <div
          style={{
            position: "fixed",
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            pointerEvents: "none",
            zIndex: 100,
          }}
          className="border-2 border-[#0284c7] bg-[#0284c7]/25 rounded-lg shadow-xl backdrop-blur-[1px]"
        />
      )}
    </>
  );

  if (isCommandPaletteEnabled) {
    return <KBarProvider actions={kbarActions}>{layoutContent}</KBarProvider>;
  }

  return layoutContent;
};
