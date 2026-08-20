import {
  Calendar,
  ChevronRight,
  Church,
  Download,
  Filter,
  FolderPlus,
  HardDrive,
  LayoutGrid,
  List,
  LogOut,
  Moon,
  Move,
  Music,
  Plus,
  Printer,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import React, { useMemo } from "react";
import { Song } from "@hosanna/shared";
import {
  CommandAction,
  FolderItem,
  ServiceItem,
  SongItem,
} from "../command-palette.types";
import { CommandPaletteProvider } from "../contexts/CommandPaletteContext";
import { useRxDbSearch } from "../hooks/useRxDbSearch";
import { CommandPaletteModal } from "./modals/CommandPaletteModal";

export interface HosannaCommandPaletteProps {
  children: React.ReactNode;
  slugPrefix: string;
  navigate: (path: string) => void;
  logout: () => void;
  // State from view contexts
  currentFolderId?: string | null;
  currentSong?: Song | null;
  currentService?: ServiceItem | null;
  isExplorerView?: boolean;
  isSongEditorView?: boolean;
  isServiceEditorView?: boolean;
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  setCurrentFolderId: (id: string | null) => void;
  setIsCreateSongModalOpen: (v: boolean) => void;
  setIsCifraImportOpen: (v: boolean) => void;
  setIsCreateServiceModalOpen: (v: boolean) => void;
  setIsCreateModalOpen: (v: boolean) => void;
  setIsFilterPanelOpen: (v: boolean) => void;
  handleViewModeChange: (mode: "grid" | "list") => void;
  handlePrintSong: (id: string) => void;
  setMoveSongTarget: (song: Song | null) => void;
  setTargetSongFolderId: (folderId: string) => void;
  setDeleteSongTarget: (song: Song | null) => void;
  deleteService: (id: string) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  // RxDB finders
  searchSongsDb: (query: string) => Promise<SongItem[]>;
  searchFoldersDb: (query: string) => Promise<FolderItem[]>;
  searchServicesDb: (query: string) => Promise<ServiceItem[]>;
  getFolderPathString: (parentId?: string | null) => string;
  isDataLoading?: boolean;
}

function InnerPalette(
  props: HosannaCommandPaletteProps & { staticActions: CommandAction[] },
) {
  const { isSearching } = useRxDbSearch({
    slugPrefix: props.slugPrefix,
    navigate: props.navigate,
    searchSongsDb: props.searchSongsDb,
    isDataLoading: props.isDataLoading,
    searchFoldersDb: props.searchFoldersDb,
    searchServicesDb: props.searchServicesDb,
    getFolderPathString: props.getFolderPathString,
  });

  return (
    <CommandPaletteModal
      staticActions={props.staticActions}
      isSearchingDb={isSearching}
    />
  );
}

export function HosannaCommandPalette(props: HosannaCommandPaletteProps) {
  const {
    slugPrefix,
    navigate,
    logout,
    currentSong,
    currentService,
    isExplorerView,
    isSongEditorView,
    isServiceEditorView,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setCurrentFolderId,
    setIsCreateSongModalOpen,
    setIsCifraImportOpen,
    setIsCreateServiceModalOpen,
    setIsCreateModalOpen,
    setIsFilterPanelOpen,
    handleViewModeChange,
    handlePrintSong,
    setMoveSongTarget,
    setTargetSongFolderId,
    setDeleteSongTarget,
    deleteService,
    fileInputRef,
  } = props;

  const staticActions = useMemo<CommandAction[]>(() => {
    const actions: CommandAction[] = [
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

      // --- TEMA E PREFERÊNCIAS ---
      {
        id: "toggle-theme",
        name: "Alternar Tema Claro / Escuro",
        shortcut: ["t", "t"],
        keywords: "tema dark light modo escuro claro theme",
        section: "Definições & Conta",
        icon: <Moon className="w-4 h-4 text-amber-500" />,
        perform: () => {
          const isDark = document.documentElement.classList.toggle("dark");
          localStorage.setItem("theme", isDark ? "dark" : "light");
        },
      },
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
    ];

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
            if (currentSong.folderId)
              setTargetSongFolderId(currentSong.folderId);
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

    return actions;
  }, [
    slugPrefix,
    isExplorerView,
    isSongEditorView,
    isServiceEditorView,
    currentSong,
    currentService,
    isSidebarCollapsed,
    navigate,
    logout,
  ]);

  return (
    <CommandPaletteProvider staticActions={staticActions}>
      <InnerPalette {...props} staticActions={staticActions} />
      {props.children}
    </CommandPaletteProvider>
  );
}

export const HosannaCommandPaletteTriggerButton: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { togglePalette } = useCommandPalette();
  return (
    <button
      onClick={togglePalette}
      className={`flex items-center gap-2 px-3 py-2 bg-m3-card hover:bg-m3-hover border border-m3-border rounded-2xl text-xs font-medium text-m3-secondary hover:text-m3-text transition-all cursor-pointer shadow-xs ${className || ""}`}
      title="Abrir Menu de Comandos (Ctrl+K / Cmd+K)"
    >
      <span className="hidden sm:inline font-semibold">Comandos</span>
      <kbd className="px-1.5 py-0.5 rounded-md bg-m3-bg border border-m3-border text-[10px] font-mono font-bold text-m3-secondary">
        ⌘K
      </kbd>
    </button>
  );
};

