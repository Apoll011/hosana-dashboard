import { Button, Folder, Song, Spinner } from "@hosanna/shared";
import {
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  MoreVertical,
  Plus,
  Upload,
} from "lucide-react";
import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

interface FolderExplorerContext {
  filteredSubfolders: Folder[];
  filteredFiles: Song[];
  viewMode: "grid" | "list";
  isSearchingOrFiltering: boolean;
  currentFolder: Folder | undefined;
  searchQuery: string;
  handleItemClick: (
    e: React.MouseEvent,
    id: string,
    type: "folder" | "song",
  ) => void;
  handleSelectFolder: (id: string | null) => void;
  handleContextMenu: (
    e: React.MouseEvent,
    type: "folder" | "song",
    item: Folder | Song,
  ) => void;
  getFolderPathString: (folderId: string | null | undefined) => string;
  selectedFolderIds: Set<string>;
  selectedSongIds: Set<string>;
  foldersQuery: { isLoading: boolean };
  songsQuery: { isLoading: boolean };
  setIsCreateSongModalOpen: (open: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  handleWorkspaceMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasContextMenu: (e: React.MouseEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  isDraggingOver: boolean;
  totalItemsCount: number;
  currentFolderId: string | null;
  selectionBox: { x: number; y: number; width: number; height: number } | null;

  /* Internal item drag & drop */
  isInternalDragActive: boolean;
  dropTargetFolderId: string | null;
  dragDisabledFolderIds: Set<string>;
  handleItemDragStart: (
    e: React.DragEvent,
    id: string,
    type: "folder" | "song",
  ) => void;
  handleItemDragEnd: () => void;
  handleFolderDragOver: (e: React.DragEvent, folderId: string) => void;
  handleFolderDragLeave: (e: React.DragEvent, folderId: string) => void;
  handleFolderDrop: (e: React.DragEvent, folderId: string) => void;
}

const DEFAULT_CONTEXT: FolderExplorerContext = {
  filteredSubfolders: [],
  filteredFiles: [],
  viewMode: "grid",
  isSearchingOrFiltering: false,
  currentFolder: undefined,
  searchQuery: "",
  handleItemClick: () => {},
  handleSelectFolder: () => {},
  handleContextMenu: () => {},
  getFolderPathString: () => "",
  selectedFolderIds: new Set(),
  selectedSongIds: new Set(),
  foldersQuery: { isLoading: false },
  songsQuery: { isLoading: false },
  setIsCreateSongModalOpen: () => {},
  fileInputRef: { current: null },
  containerRef: { current: null },
  handleWorkspaceMouseDown: () => {},
  handleCanvasContextMenu: () => {},
  handleDragOver: () => {},
  handleDragLeave: () => {},
  handleDrop: () => {},
  isDraggingOver: false,
  totalItemsCount: 0,
  currentFolderId: null,
  selectionBox: null,
  isInternalDragActive: false,
  dropTargetFolderId: null,
  dragDisabledFolderIds: new Set(),
  handleItemDragStart: () => {},
  handleItemDragEnd: () => {},
  handleFolderDragOver: () => {},
  handleFolderDragLeave: () => {},
  handleFolderDrop: () => {},
};

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

interface FolderGridCardProps {
  folder: Folder;
  isSelected: boolean;
  isSearchingOrFiltering: boolean;
  isDropTarget: boolean;
  isDropDisabled: boolean;
  isInternalDragActive: boolean;
  getFolderPathString: (folderId: string | null | undefined) => string;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const FolderGridCard: React.FC<FolderGridCardProps> = ({
  folder,
  isSelected,
  isSearchingOrFiltering,
  isDropTarget,
  isDropDisabled,
  isInternalDragActive,
  getFolderPathString,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const showDisabledDuringDrag = isInternalDragActive && isDropDisabled;

  return (
    <div
      data-item-id={folder.id}
      data-item-type="folder"
      draggable
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(e);
      }}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm hover:shadow-xl active:scale-95 select-none ${
        isDropTarget && !isDropDisabled
          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 ring-4 ring-emerald-300/40 border-dashed shadow-lg scale-[1.02]"
          : isSelected
            ? "border-m3-primary bg-m3-primary/10 ring-4 ring-m3-primary/10 shadow-lg"
            : "border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40"
      } ${showDisabledDuringDrag ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e);
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all z-10 cursor-pointer ${
          isSelected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus:opacity-100"
        }`}
        title="Mais opções"
        aria-label="Mais opções"
      >
        <MoreVertical className="w-4.5 h-4.5" />
      </button>

      <div className="w-14 h-14 rounded-2xl bg-m3-primary/10 border border-m3-primary/20 flex items-center justify-center text-m3-primary mb-3 group-hover:scale-110 transition-transform">
        <FolderIcon className="w-8 h-8 opacity-80" />
      </div>

      <span className="text-sm font-black text-m3-text transition-colors truncate w-full px-1">
        {folder.name}
      </span>

      <span className="text-[10px] text-m3-secondary font-bold uppercase tracking-wider mt-0.5 opacity-70">
        {(folder.songCount || 0) + (folder.folderCount || 0)} Items
      </span>

      {isSearchingOrFiltering && (
        <span className="text-[10px] font-black text-m3-primary uppercase tracking-widest bg-m3-primary/10 px-2 py-0.5 rounded-lg mt-2 truncate max-w-full">
          {getFolderPathString(folder.parentId)}
        </span>
      )}
    </div>
  );
};

interface SongGridCardProps {
  song: Song;
  isSelected: boolean;
  isSearchingOrFiltering: boolean;
  getFolderPathString: (folderId: string | null | undefined) => string;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const SongGridCard: React.FC<SongGridCardProps> = ({
  song,
  isSelected,
  isSearchingOrFiltering,
  getFolderPathString,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
}) => (
  <div
    data-item-id={song.id}
    data-item-type="song"
    draggable
    onClick={onClick}
    onDoubleClick={(e) => {
      e.stopPropagation();
      onDoubleClick(e);
    }}
    onContextMenu={onContextMenu}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm hover:shadow-xl active:scale-95 select-none ${
      isSelected
        ? "border-m3-primary bg-m3-primary/10 ring-4 ring-m3-primary/10 shadow-lg"
        : "border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40"
    }`}
  >
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onContextMenu(e);
      }}
      className={`absolute top-3 right-3 p-1.5 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all z-10 cursor-pointer ${
        isSelected
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus:opacity-100"
      }`}
      title="Mais opções"
      aria-label="Mais opções"
    >
      <MoreVertical className="w-4.5 h-4.5" />
    </button>

    <div className="w-14 h-14 rounded-2xl bg-m3-primary-light/20 border border-m3-primary/20 flex items-center justify-center text-m3-primary mb-3 group-hover:scale-110 transition-transform">
      <FileText className="w-8 h-8 opacity-80" />
    </div>

    {song.song_number && (
      <span className="text-[10px] font-bold bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded-lg border border-neutral-200 dark:border-slate-700">
        Nº {song.song_number}
      </span>
    )}

    <span className="text-sm font-black text-m3-text transition-colors truncate w-full px-1">
      {song.title}
    </span>

    <span className="text-[10px] text-m3-secondary font-bold truncate w-full px-1 mt-0.5 opacity-70">
      {song.artist || "Cifra"}
    </span>

    {isSearchingOrFiltering && (
      <span className="text-[10px] font-black text-m3-secondary uppercase tracking-widest bg-m3-bg px-2 py-0.5 rounded-lg mt-2 truncate max-w-full border border-m3-border/50">
        {getFolderPathString(song.folderId)}
      </span>
    )}
  </div>
);

interface FolderTableRowProps {
  folder: Folder;
  isSelected: boolean;
  isSearchingOrFiltering: boolean;
  isDropTarget: boolean;
  isDropDisabled: boolean;
  isInternalDragActive: boolean;
  getFolderPathString: (folderId: string | null | undefined) => string;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const FolderTableRow: React.FC<FolderTableRowProps> = ({
  folder,
  isSelected,
  isSearchingOrFiltering,
  isDropTarget,
  isDropDisabled,
  isInternalDragActive,
  getFolderPathString,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const showDisabledDuringDrag = isInternalDragActive && isDropDisabled;

  return (
    <tr
      data-item-id={folder.id}
      data-item-type="folder"
      draggable
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(e);
      }}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`cursor-pointer transition-all group select-none ${
        isDropTarget && !isDropDisabled
          ? "bg-emerald-50 dark:bg-emerald-950/30 outline outline-dashed outline-emerald-400 -outline-offset-2"
          : isSelected
            ? "bg-m3-primary/10 text-m3-primary"
            : "hover:bg-m3-hover/50 text-m3-text"
      } ${showDisabledDuringDrag ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
          <FolderIcon className="w-5 h-5 text-m3-primary opacity-80" />
          <span>{folder.name}</span>
        </div>
      </td>
      <td className="py-4 px-6 text-m3-secondary opacity-70">Pasta</td>
      {isSearchingOrFiltering && (
        <td className="py-4 px-6 text-m3-primary/80">
          {getFolderPathString(folder.parentId)}
        </td>
      )}
      <td className="py-4 px-6 text-m3-secondary">
        {folder.songCount || 0} Musicas
      </td>
      <td className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="lg"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDoubleClick(e);
            }}
          >
            Abrir
          </Button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
            className="p-2 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-m3-hover dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mais opções"
            aria-label="Mais opções"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

interface SongTableRowProps {
  song: Song;
  isSelected: boolean;
  isSearchingOrFiltering: boolean;
  getFolderPathString: (folderId: string | null | undefined) => string;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const SongTableRow: React.FC<SongTableRowProps> = ({
  song,
  isSelected,
  isSearchingOrFiltering,
  getFolderPathString,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
}) => (
  <tr
    data-item-id={song.id}
    data-item-type="song"
    draggable
    onClick={onClick}
    onDoubleClick={(e) => {
      e.stopPropagation();
      onDoubleClick(e);
    }}
    onContextMenu={onContextMenu}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    className={`cursor-pointer transition-all group select-none ${
      isSelected
        ? "bg-m3-primary/10 text-m3-primary"
        : "hover:bg-m3-hover/50 text-m3-text"
    }`}
  >
    <td className="py-4 px-6">
      <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
        <FileText className="w-5 h-5 text-m3-primary opacity-80" />
        <span>{song.title}</span>
      </div>
    </td>
    <td className="py-4 px-6 text-m3-secondary opacity-70">Cifra</td>
    {isSearchingOrFiltering && (
      <td className="py-4 px-6 text-m3-secondary font-medium">
        {getFolderPathString(song.folderId)}
      </td>
    )}
    <td className="py-4 px-6 text-m3-secondary">{song.artist || "—"}</td>
    <td className="py-4 px-6 text-right">
      <div className="flex items-center justify-end gap-1">
        <Button
          size="lg"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDoubleClick(e);
          }}
        >
          Editar
        </Button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
          className="p-2 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-m3-hover dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Mais opções"
          aria-label="Mais opções"
        >
          <MoreVertical className="w-4.5 h-4.5" />
        </button>
      </div>
    </td>
  </tr>
);

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export const FoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<FolderExplorerContext>() ?? DEFAULT_CONTEXT;

  const {
    filteredSubfolders,
    filteredFiles,
    viewMode,
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
    containerRef,
    handleWorkspaceMouseDown,
    handleCanvasContextMenu,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDraggingOver,
    totalItemsCount,
    currentFolderId,
    isInternalDragActive,
    dropTargetFolderId,
    dragDisabledFolderIds,
    handleItemDragStart,
    handleItemDragEnd,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
  } = context;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleWorkspaceMouseDown}
      onContextMenu={handleCanvasContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900 relative transition-all select-none min-h-75 h-full ${
        isDraggingOver
          ? "ring-4 ring-inset ring-[#0284c7] bg-sky-50/50 dark:bg-sky-950/30"
          : ""
      }`}
    >
      {/* Drag Over Overlay (só para upload externo, nunca durante drag interno) */}
      {isDraggingOver && !isInternalDragActive && (
        <div className="absolute inset-0 bg-[#0284c7]/10 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-16 h-16 rounded-3xl bg-[#0284c7] text-white flex items-center justify-center shadow-lg mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[#0284c7]">
            Solte os ficheiros aqui
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
            Os ficheiros serão importados a "
            {currentFolder ? currentFolder.name : "Diretório Raiz"}"
          </p>
        </div>
      )}

      {foldersQuery.isLoading || songsQuery.isLoading ? (
        <div className="h-full flex items-center justify-center p-12">
          <Spinner label="A carregar explorador de ficheiros..." />
        </div>
      ) : totalItemsCount === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center my-8 select-none">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-center text-amber-500 mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {searchQuery
              ? "Nenhum ficheiro ou pasta correspondente"
              : "Esta Pasta está Vazia"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {searchQuery
              ? `Nenhum item em "${currentFolder ? currentFolder.name : "Raiz"}" corresponde a "${searchQuery}".`
              : currentFolderId === null
                ? "Ainda não existem pastas nem cânticos na raiz."
                : `Ainda não foram adicionados cânticos à pasta "${currentFolder?.name}".`}
          </p>

          {!searchQuery && (
            <div className="flex flex-col items-center gap-3 mt-6">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateSongModalOpen(true)}
              >
                Novo Cântico
              </Button>

              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Ou
              </span>

              <button
                onClick={() => fileInputRef?.current?.click()}
                className="text-xs font-medium text-[#0284c7] hover:underline flex items-center gap-1.5 cursor-pointer bg-sky-50/80 dark:bg-sky-950/40 px-4 py-2 rounded-xl border border-sky-200 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  Arraste e solte ficheiros aqui ou clique para carregar
                </span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredSubfolders.map((folder) => (
            <FolderGridCard
              key={folder.id}
              folder={folder}
              isSelected={selectedFolderIds.has(folder.id)}
              isSearchingOrFiltering={isSearchingOrFiltering}
              isDropTarget={dropTargetFolderId === folder.id}
              isDropDisabled={dragDisabledFolderIds.has(folder.id)}
              isInternalDragActive={isInternalDragActive}
              getFolderPathString={getFolderPathString}
              onClick={(e) => handleItemClick(e, folder.id, "folder")}
              onDoubleClick={() => handleSelectFolder(folder.id)}
              onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
              onDragStart={(e) => handleItemDragStart(e, folder.id, "folder")}
              onDragEnd={handleItemDragEnd}
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={(e) => handleFolderDragLeave(e, folder.id)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
            />
          ))}

          {filteredFiles.map((song) => (
            <SongGridCard
              key={song.id}
              song={song}
              isSelected={selectedSongIds.has(song.id)}
              isSearchingOrFiltering={isSearchingOrFiltering}
              getFolderPathString={getFolderPathString}
              onClick={(e) => handleItemClick(e, song.id, "song")}
              onDoubleClick={() => navigate(`/songs/${song.id}`)}
              onContextMenu={(e) => handleContextMenu(e, "song", song)}
              onDragStart={(e) => handleItemDragStart(e, song.id, "song")}
              onDragEnd={handleItemDragEnd}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="bg-m3-sidebar/40 border-b border-m3-border text-[10px] font-black text-m3-secondary uppercase tracking-[0.2em]">
                <th className="py-4 px-6">Nome</th>
                <th className="py-4 px-6">Tipo</th>
                {isSearchingOrFiltering && (
                  <th className="py-4 px-6">Localização</th>
                )}
                <th className="py-4 px-6">Detalhes</th>
                <th className="py-4 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-m3-border/30 text-[13px] font-bold">
              {filteredSubfolders.map((folder) => (
                <FolderTableRow
                  key={folder.id}
                  folder={folder}
                  isSelected={selectedFolderIds.has(folder.id)}
                  isSearchingOrFiltering={isSearchingOrFiltering}
                  isDropTarget={dropTargetFolderId === folder.id}
                  isDropDisabled={dragDisabledFolderIds.has(folder.id)}
                  isInternalDragActive={isInternalDragActive}
                  getFolderPathString={getFolderPathString}
                  onClick={(e) => handleItemClick(e, folder.id, "folder")}
                  onDoubleClick={() => handleSelectFolder(folder.id)}
                  onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
                  onDragStart={(e) =>
                    handleItemDragStart(e, folder.id, "folder")
                  }
                  onDragEnd={handleItemDragEnd}
                  onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                  onDragLeave={(e) => handleFolderDragLeave(e, folder.id)}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                />
              ))}

              {filteredFiles.map((song) => (
                <SongTableRow
                  key={song.id}
                  song={song}
                  isSelected={selectedSongIds.has(song.id)}
                  isSearchingOrFiltering={isSearchingOrFiltering}
                  getFolderPathString={getFolderPathString}
                  onClick={(e) => handleItemClick(e, song.id, "song")}
                  onDoubleClick={() => navigate(`/songs/${song.id}`)}
                  onContextMenu={(e) => handleContextMenu(e, "song", song)}
                  onDragStart={(e) => handleItemDragStart(e, song.id, "song")}
                  onDragEnd={handleItemDragEnd}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
