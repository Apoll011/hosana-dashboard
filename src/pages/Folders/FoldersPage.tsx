import React, { useState, useEffect, DragEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Folder, Song } from '../../types';
import {
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  Plus,
  Upload,
  Move,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';

// ==========================================
// 1. TIPAGENS (Interfaces)
// ==========================================

export interface SelectionBoxType {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExplorerContextType {
  filteredSubfolders: Folder[];
  filteredFiles: Song[];
  viewMode: 'grid' | 'list';
  isSearchingOrFiltering: boolean;
  currentFolder: Folder | null;
  actualSearchQuery: string;
  selectedFolderIds: Set<string>;
  selectedSongIds: Set<string>;
  foldersQuery: { isLoading: boolean };
  songsQuery: { isLoading: boolean };
  fileInputRef: React.RefObject<HTMLInputElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isDraggingOver: boolean;
  totalItemsCount: number;
  currentFolderId: string | null;
  selectionBox: SelectionBoxType | null;

  handleItemClick: (e: React.MouseEvent, id: string, type: 'folder' | 'song') => void;
  handleSelectFolder: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, type: 'folder' | 'song', item: Folder | Song) => void;
  getFolderPathString: (folderId: string | null) => string;
  setIsCreateSongModalOpen: (open: boolean) => void;
  
  handleWorkspaceMouseDown: (e: React.MouseEvent) => void;
  handleCanvasContextMenu: (e: React.MouseEvent) => void;
  
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  handleMoveItems?: (targetFolderId: string) => void;
  handleDeleteSelected?: () => void;
  clearSelection?: () => void;
  selectAll?: () => void;
  overrideSelection?: (id: string, type: 'folder' | 'song') => void; // Para selecionar apenas 1 item no onDragStart
}

interface BaseItemProps {
  item: any;
  type: 'folder' | 'song';
  isSelected: boolean;
  isSearchingOrFiltering: boolean;
  getFolderPathString: (id: string | null) => string;
  onClick: (e: React.MouseEvent, id: string, type: 'folder' | 'song') => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, type: 'folder' | 'song', item: any) => void;
  
  // Props para o Drag & Drop Interno
  onDragStart: (e: DragEvent, id: string, type: 'folder' | 'song') => void;
  onDropItem?: (e: DragEvent, targetFolderId: string) => void;
  isInvalidDropTarget?: boolean;
}

const GridCard: React.FC<BaseItemProps & { icon: React.ReactNode, title: string, subtitle: string, contextId: string | null }> = ({
  item, type, isSelected, isSearchingOrFiltering, getFolderPathString,
  onClick, onDoubleClick, onContextMenu, onDragStart, onDropItem, isInvalidDropTarget,
  icon, title, subtitle, contextId
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    if (type !== 'folder' || isInvalidDropTarget) return;
    e.preventDefault(); // Necessário para permitir o drop
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent) => {
    if (type !== 'folder' || isInvalidDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDropItem) onDropItem(e, item.id);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id, type)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => onClick(e, item.id, type)}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => onContextMenu(e, type, item)}
      className={`p-5 rounded-[24px] border transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm hover:shadow-xl active:scale-95 select-none
        ${isSelected ? 'border-m3-primary bg-m3-primary/10 ring-4 ring-m3-primary/10 shadow-lg' : 'border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40'}
        ${isDragOver && type === 'folder' ? 'ring-4 ring-dashed ring-sky-500 bg-sky-50 dark:bg-sky-900/30' : ''}
      `}
    >
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform
        ${type === 'folder' ? 'bg-m3-primary/10 border-m3-primary/20 text-m3-primary' : 'bg-m3-primary-light/20 border-m3-primary/20 text-m3-primary'}
      `}>
        {icon}
      </div>
      <span className="text-sm font-black text-m3-text transition-colors truncate w-full px-1">{title}</span>
      <span className="text-[10px] text-m3-secondary font-bold uppercase tracking-wider mt-0.5 opacity-70 truncate w-full px-1">{subtitle}</span>
      
      {isSearchingOrFiltering && (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mt-2 truncate max-w-full border
          ${type === 'folder' ? 'text-m3-primary bg-m3-primary/10 border-transparent' : 'text-m3-secondary bg-m3-bg border-m3-border/50'}
        `}>
          {getFolderPathString(contextId)}
        </span>
      )}
    </div>
  );
};

const TableRow: React.FC<BaseItemProps & { icon: React.ReactNode, title: string, subtitle: string, contextId: string | null, actionLabel: string }> = ({
  item, type, isSelected, isSearchingOrFiltering, getFolderPathString,
  onClick, onDoubleClick, onContextMenu, onDragStart, onDropItem, isInvalidDropTarget,
  icon, title, subtitle, contextId, actionLabel
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    if (type !== 'folder' || isInvalidDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent) => {
    if (type !== 'folder' || isInvalidDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDropItem) onDropItem(e, item.id);
  };

  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, item.id, type)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => onClick(e, item.id, type)}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => onContextMenu(e, type, item)}
      className={`cursor-pointer transition-all group select-none
        ${isSelected ? 'bg-m3-primary/10 text-m3-primary' : 'hover:bg-m3-hover/50 text-m3-text'}
        ${isDragOver && type === 'folder' ? 'border-2 border-dashed border-sky-500 bg-sky-50 dark:bg-sky-900/30' : ''}
      `}
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
          {icon}
          <span>{title}</span>
        </div>
      </td>
      <td className="py-4 px-6 text-m3-secondary opacity-70">{type === 'folder' ? 'Pasta' : 'Cifra'}</td>
      {isSearchingOrFiltering && (
        <td className="py-4 px-6 text-m3-secondary font-medium">{getFolderPathString(contextId)}</td>
      )}
      <td className="py-4 px-6 text-m3-secondary">{subtitle}</td>
      <td className="py-4 px-6 text-right">
        <Button size="xs" variant="ghost">{actionLabel}</Button>
      </td>
    </tr>
  );
};


export const FoldersPage: React.FC = () => {
  const navigate = useNavigate();
  // Utiliza a interface criada para termos tipagem correta
  const context = useOutletContext<ExplorerContextType>(); 

  const {
    filteredSubfolders = [],
    filteredFiles = [],
    viewMode = 'grid',
    isSearchingOrFiltering = false,
    currentFolder,
    actualSearchQuery = '',
    selectedFolderIds = new Set(),
    selectedSongIds = new Set(),
    foldersQuery = { isLoading: false },
    songsQuery = { isLoading: false },
    fileInputRef,
    containerRef,
    isDraggingOver = false,
    totalItemsCount = 0,
    currentFolderId = null,
    selectionBox = null,
    
    handleItemClick,
    handleSelectFolder,
    handleContextMenu,
    getFolderPathString,
    setIsCreateSongModalOpen,
    handleWorkspaceMouseDown,
    handleCanvasContextMenu,
    
    // External D&D
    handleDragOver: handleExternalDragOver,
    handleDragLeave: handleExternalDragLeave,
    handleDrop: handleExternalDrop,

    // Novas ações integradas via context
    handleMoveItems,
    handleDeleteSelected,
    clearSelection,
    selectAll,
    overrideSelection
  } = context;

  const totalSelected = selectedFolderIds.size + selectedSongIds.size;

  // ----------------------------------------
  // Lógica de Atalhos de Teclado
  // ----------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver a escrever num input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      // Ctrl+A / Cmd+A : Selecionar Tudo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (selectAll) selectAll();
      } 
      // Delete / Backspace : Eliminar Selecionados
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (totalSelected > 0 && handleDeleteSelected) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } 
      // Escape : Limpar Seleção
      else if (e.key === 'Escape') {
        if (totalSelected > 0 && clearSelection) {
          e.preventDefault();
          clearSelection();
        }
      } 
      // Enter : Abrir pasta ou ficheiro (se apenas 1 selecionado)
      else if (e.key === 'Enter' && totalSelected === 1) {
        e.preventDefault();
        if (selectedFolderIds.size === 1) {
          handleSelectFolder(Array.from(selectedFolderIds)[0]);
        } else if (selectedSongIds.size === 1) {
          navigate(`/songs/${Array.from(selectedSongIds)[0]}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSelected, selectedFolderIds, selectedSongIds, selectAll, handleDeleteSelected, clearSelection, handleSelectFolder, navigate]);

  // ----------------------------------------
  // Lógica Drag & Drop Interno
  // ----------------------------------------
  const handleInternalDragStart = (e: DragEvent, id: string, type: 'folder' | 'song') => {
    const isSelected = type === 'folder' ? selectedFolderIds.has(id) : selectedSongIds.has(id);
    
    // Se arrastar algo não selecionado, limpar a seleção atual e selecionar apenas esse
    if (!isSelected && overrideSelection) {
      overrideSelection(id, type);
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'internal_explorer' }));
  };

  const handleInternalDrop = (e: DragEvent, targetFolderId: string) => {
    if (handleMoveItems) {
      handleMoveItems(targetFolderId);
    }
  };


  return (
    <div
      ref={containerRef}
      onMouseDown={handleWorkspaceMouseDown}
      onContextMenu={handleCanvasContextMenu}
      onDragOver={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDrop={handleExternalDrop}
      className={`flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900 relative transition-all select-none min-h-[300px] h-full ${
        isDraggingOver ? 'ring-4 ring-inset ring-[#0284c7] bg-sky-50/50 dark:bg-sky-950/30' : ''
      }`}
    >
      {/* 4. Selection Box (Lasso) Renderização */}
      {selectionBox && (
        <div
          className="absolute bg-m3-primary/20 border border-m3-primary z-40 pointer-events-none rounded-[4px]"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height
          }}
        />
      )}

      {/* Drag Over Overlay (Externo) */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[#0284c7]/10 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-16 h-16 rounded-3xl bg-[#0284c7] text-white flex items-center justify-center shadow-lg mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[#0284c7]">Solte os ficheiros aqui</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
            Os ficheiros ChordPro serão associados a "{currentFolder ? currentFolder.name : 'Diretório Raiz'}"
          </p>
        </div>
      )}

      {/* 5. Floating Action Bar (FAB) */}
      {totalSelected > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 border border-slate-700">
            <span className="text-sm font-bold bg-slate-800 dark:bg-slate-900 px-3 py-1 rounded-full">
              {totalSelected} item{totalSelected !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
              <button
                onClick={() => handleMoveItems && handleMoveItems('')} // Ação de mover pode abrir modal
                className="flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors text-sm font-medium"
                title="Mover selecionados"
              >
                <Move className="w-4 h-4" /> Mover
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 hover:bg-red-900/40 text-red-400 px-3 py-2 rounded-xl transition-colors text-sm font-medium"
                title="Eliminar selecionados (Delete)"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
              <button
                onClick={clearSelection}
                className="flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors text-sm font-medium text-slate-400"
                title="Limpar seleção (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading & Empty States */}
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
            {actualSearchQuery ? 'Nenhum ficheiro ou pasta correspondente' : 'Esta Pasta está Vazia'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {actualSearchQuery
              ? `Nenhum item em "${currentFolder ? currentFolder.name : 'Raiz'}" corresponde a "${actualSearchQuery}".`
              : currentFolderId === null
              ? 'Ainda não existem pastas nem cânticos na raiz.'
              : `Ainda não foram adicionados cânticos à pasta "${currentFolder?.name}".`}
          </p>

          {!actualSearchQuery && (
            <div className="flex flex-col items-center gap-3 mt-6">
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateSongModalOpen(true)}>
                Novo Cântico
              </Button>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ou</span>
              <button onClick={() => fileInputRef?.current?.click()} className="text-xs font-medium text-[#0284c7] hover:underline flex items-center gap-1.5 cursor-pointer bg-sky-50/80 dark:bg-sky-950/40 px-4 py-2 rounded-xl border border-sky-200 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Arraste e solte ficheiros aqui ou clique para carregar</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        
        /* GRID VIEW */
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
          
          {/* Folders */}
          {filteredSubfolders.map((folder: Folder) => (
            <GridCard
              key={folder.id}
              item={folder}
              type="folder"
              isSelected={selectedFolderIds.has(folder.id)}
              isInvalidDropTarget={selectedFolderIds.has(folder.id)} // Não pode dropar se estiver selecionada
              isSearchingOrFiltering={isSearchingOrFiltering}
              getFolderPathString={getFolderPathString}
              onClick={handleItemClick}
              onDoubleClick={(e) => { e.stopPropagation(); handleSelectFolder(folder.id); }}
              onContextMenu={handleContextMenu}
              onDragStart={handleInternalDragStart}
              onDropItem={handleInternalDrop}
              icon={<FolderIcon className="w-8 h-8 opacity-80" />}
              title={folder.name}
              subtitle={`${folder.songCount || 0} Musicas`}
              contextId={folder.parentId}
            />
          ))}

          {/* Files / Songs */}
          {filteredFiles.map((song: Song) => (
            <GridCard
              key={song.id}
              item={song}
              type="song"
              isSelected={selectedSongIds.has(song.id)}
              isSearchingOrFiltering={isSearchingOrFiltering}
              getFolderPathString={getFolderPathString}
              onClick={handleItemClick}
              onDoubleClick={(e) => { e.stopPropagation(); navigate(`/songs/${song.id}`); }}
              onContextMenu={handleContextMenu}
              onDragStart={handleInternalDragStart}
              icon={<FileText className="w-8 h-8 opacity-80" />}
              title={song.title}
              subtitle={song.artist || 'Cifra'}
              contextId={song.folderId}
            />
          ))}

        </div>
      ) : (
        
        /* LIST VIEW */
        <div className="overflow-x-auto pb-20">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="bg-m3-sidebar/40 border-b border-m3-border text-[10px] font-black text-m3-secondary uppercase tracking-[0.2em]">
                <th className="py-4 px-6">Nome</th>
                <th className="py-4 px-6">Tipo</th>
                {isSearchingOrFiltering && <th className="py-4 px-6">Localização</th>}
                <th className="py-4 px-6">Detalhes</th>
                <th className="py-4 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-m3-border/30 text-[13px] font-bold">
              
              {/* Folders */}
              {filteredSubfolders.map((folder: Folder) => (
                <TableRow
                  key={folder.id}
                  item={folder}
                  type="folder"
                  isSelected={selectedFolderIds.has(folder.id)}
                  isInvalidDropTarget={selectedFolderIds.has(folder.id)}
                  isSearchingOrFiltering={isSearchingOrFiltering}
                  getFolderPathString={getFolderPathString}
                  onClick={handleItemClick}
                  onDoubleClick={(e) => { e.stopPropagation(); handleSelectFolder(folder.id); }}
                  onContextMenu={handleContextMenu}
                  onDragStart={handleInternalDragStart}
                  onDropItem={handleInternalDrop}
                  icon={<FolderIcon className="w-5 h-5 text-m3-primary opacity-80" />}
                  title={folder.name}
                  subtitle={`${folder.songCount || 0} Musicas`}
                  contextId={folder.parentId}
                  actionLabel="Abrir"
                />
              ))}

              {/* Files */}
              {filteredFiles.map((song: Song) => (
                <TableRow
                  key={song.id}
                  item={song}
                  type="song"
                  isSelected={selectedSongIds.has(song.id)}
                  isSearchingOrFiltering={isSearchingOrFiltering}
                  getFolderPathString={getFolderPathString}
                  onClick={handleItemClick}
                  onDoubleClick={(e) => { e.stopPropagation(); navigate(`/songs/${song.id}`); }}
                  onContextMenu={handleContextMenu}
                  onDragStart={handleInternalDragStart}
                  icon={<FileText className="w-5 h-5 text-m3-primary opacity-80" />}
                  title={song.title}
                  subtitle={song.artist || '—'}
                  contextId={song.folderId}
                  actionLabel="Editar"
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};