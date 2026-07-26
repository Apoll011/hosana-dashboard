import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { Folder, Song } from '../../types';
import {
  Folder as FolderIcon, FolderOpen, FileText, Plus, Upload
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';

export const FoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<any>() || {};

  const {
    filteredSubfolders = [],
    filteredFiles = [],
    viewMode = 'grid',
    isSearchingOrFiltering = false,
    currentFolder,
    actualSearchQuery = '',
    handleItemClick = () => {},
    handleSelectFolder = () => {},
    handleContextMenu = () => {},
    getFolderPathString = () => '',
    selectedFolderIds = new Set(),
    selectedSongIds = new Set(),
    foldersQuery = { isLoading: false },
    songsQuery = { isLoading: false },
    setIsCreateSongModalOpen = () => {},
    fileInputRef,
    containerRef,
    handleWorkspaceMouseDown = () => {},
    handleCanvasContextMenu = () => {},
    handleDragOver = () => {},
    handleDragLeave = () => {},
    handleDrop = () => {},
    isDraggingOver = false,
    totalItemsCount = 0,
    currentFolderId = null,
    selectionBox = null,
  } = context;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleWorkspaceMouseDown}
      onContextMenu={handleCanvasContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900 relative transition-all select-none min-h-[300px] h-full ${
        isDraggingOver
          ? 'ring-4 ring-inset ring-[#0284c7] bg-sky-50/50 dark:bg-sky-950/30'
          : ''
      }`}
    >
      {/* Drag Over Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[#0284c7]/10 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-16 h-16 rounded-3xl bg-[#0284c7] text-white flex items-center justify-center shadow-lg mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[#0284c7]">
            Solte os ficheiros aqui
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
            Os ficheiros ChordPro serão associados a "{currentFolder ? currentFolder.name : 'Diretório Raiz'}"
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
                <span>Arraste e solte ficheiros aqui ou clique para carregar</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          {/* Folders */}
          {filteredSubfolders.map((folder: Folder) => {
            const isSelected = selectedFolderIds.has(folder.id);
            return (
              <div
                key={folder.id}
                data-item-id={folder.id}
                data-item-type="folder"
                onClick={(e) => handleItemClick(e, folder.id, 'folder')}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleSelectFolder(folder.id);
                }}
                onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                className={`p-5 rounded-[24px] border transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm hover:shadow-xl active:scale-95 select-none ${
                  isSelected
                    ? 'border-m3-primary bg-m3-primary/10 ring-4 ring-m3-primary/10 shadow-lg'
                    : 'border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-m3-primary/10 border border-m3-primary/20 flex items-center justify-center text-m3-primary mb-3 group-hover:scale-110 transition-transform">
                  <FolderIcon className="w-8 h-8 opacity-80" />
                </div>

                <span className="text-sm font-black text-m3-text transition-colors truncate w-full px-1">
                  {folder.name}
                </span>

                <span className="text-[10px] text-m3-secondary font-bold uppercase tracking-wider mt-0.5 opacity-70">
                  {folder.songCount || 0} Itens
                </span>

                {isSearchingOrFiltering && (
                  <span className="text-[10px] font-black text-m3-primary uppercase tracking-widest bg-m3-primary/10 px-2 py-0.5 rounded-lg mt-2 truncate max-w-full">
                    {getFolderPathString(folder.parentId)}
                  </span>
                )}
              </div>
            );
          })}

          {/* Files / Songs */}
          {filteredFiles.map((song: Song) => {
            const isSelected = selectedSongIds.has(song.id);
            return (
              <div
                key={song.id}
                data-item-id={song.id}
                data-item-type="song"
                onClick={(e) => handleItemClick(e, song.id, 'song')}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  navigate(`/songs/${song.id}`);
                }}
                onContextMenu={(e) => handleContextMenu(e, 'song', song)}
                className={`p-5 rounded-[24px] border transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm hover:shadow-xl active:scale-95 select-none ${
                  isSelected
                    ? 'border-m3-primary bg-m3-primary/10 ring-4 ring-m3-primary/10 shadow-lg'
                    : 'border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-m3-primary-light/20 border border-m3-primary/20 flex items-center justify-center text-m3-primary mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 opacity-80" />
                </div>

                <span className="text-sm font-black text-m3-text transition-colors truncate w-full px-1">
                  {song.title}
                </span>

                <span className="text-[10px] text-m3-secondary font-bold truncate w-full px-1 mt-0.5 opacity-70">
                  {song.artist || 'Cifra'}
                </span>

                

                {isSearchingOrFiltering && (
                  <span className="text-[10px] font-black text-m3-secondary uppercase tracking-widest bg-m3-bg px-2 py-0.5 rounded-lg mt-2 truncate max-w-full border border-m3-border/50">
                    {getFolderPathString(song.folderId)}
                  </span>
                )}
              </div>
            );
          })}

        </div>
      ) : (
        <div className="overflow-x-auto">
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
              {filteredSubfolders.map((folder: Folder) => {
                const isSelected = selectedFolderIds.has(folder.id);
                return (
                  <tr
                    key={folder.id}
                    data-item-id={folder.id}
                    data-item-type="folder"
                    onClick={(e) => handleItemClick(e, folder.id, 'folder')}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleSelectFolder(folder.id);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                    className={`cursor-pointer transition-all group select-none ${
                      isSelected
                        ? 'bg-m3-primary/10 text-m3-primary'
                        : 'hover:bg-m3-hover/50 text-m3-text'
                    }`}
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
                    <td className="py-4 px-6 text-m3-secondary">{folder.songCount || 0} Itens</td>
                    <td className="py-4 px-6 text-right">
                      <Button size="xs" variant="ghost">Abrir</Button>
                    </td>
                  </tr>
                );
              })}

              {/* Files */}
              {filteredFiles.map((song: Song) => {
                const isSelected = selectedSongIds.has(song.id);
                return (
                  <tr
                    key={song.id}
                    data-item-id={song.id}
                    data-item-type="song"
                    onClick={(e) => handleItemClick(e, song.id, 'song')}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      navigate(`/songs/${song.id}`);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, 'song', song)}
                    className={`cursor-pointer transition-all group select-none ${
                      isSelected
                        ? 'bg-m3-primary/10 text-m3-primary'
                        : 'hover:bg-m3-hover/50 text-m3-text'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                        <FileText className="w-5 h-5 text-m3-primary opacity-80" />
                        <span>{song.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-m3-secondary opacity-70">
                      Cifra
                    </td>
                    {isSearchingOrFiltering && (
                      <td className="py-4 px-6 text-m3-secondary font-medium">
                        {getFolderPathString(song.folderId)}
                      </td>
                    )}
                    <td className="py-4 px-6 text-m3-secondary">{song.artist || '—'}</td>
                    <td className="py-4 px-6 text-right">
                      <Button size="xs" variant="ghost">Editar</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Marquee rubberband drag selection box */}
      {selectionBox && (
        <div
          style={{
            position: 'fixed',
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            pointerEvents: 'none',
            zIndex: 40,
          }}
          className="border border-[#0284c7] bg-[#0284c7]/20 rounded-lg shadow-xs backdrop-blur-[0.5px]"
        />
      )}
    </div>
  );
};
