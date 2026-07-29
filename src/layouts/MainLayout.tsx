/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ToastContainer } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useFolders } from '../hooks/useFolders';
import { useAllSongs } from '../hooks/useSongs';
import { useServices } from '../hooks/useServices';
import { useSync } from '../contexts/SyncContext';
import { songsApi } from '../api/songs';
import { Folder, Song } from '../types';
import {
  Folder as FolderIcon, FolderOpen, FolderPlus, FileText, ChevronRight, ChevronDown, Search, LayoutGrid, List,
  Edit2, Trash2, HardDrive, CornerLeftUp, AlertTriangle, Move,
  ExternalLink, ArrowRightLeft, Upload, Plus, CheckSquare, Square, X, Check, RotateCw, Tag,
  Music, ArrowUpDown, Filter, User, QrCode, Settings, LogOut, Calendar, Menu
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { MoveSongModal } from '../components/modals/MoveSongModal';
import { BatchMoveModal } from '../components/modals/BatchMoveModal';
import { BatchDeleteModal } from '../components/modals/BatchDeleteModal';
import { BatchTagModal } from '../components/modals/BatchTagModal';
import { FolderForm } from '../components/forms/FolderForm';
import { SongForm } from '../components/forms/SongForm';
import { Badge } from '../components/common/Badge';
import logo from '../assets/hosannastudio_logo.png';

import { ServiceForm } from '../components/forms/ServiceForm';

interface ContextMenuState {
  x: number;
  y: number;
  type: 'folder' | 'song' | 'canvas';
  item?: Folder | Song | null;
}

interface FolderTreeNode {
  folder: Folder;
  level: number;
  children: FolderTreeNode[];
}

function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const childrenMap = new Map<string | null, Folder[]>();

  folders.forEach((f) => {
    const parentId = f.parentId || null;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(f);
  });

  function getNodes(parentId: string | null, level: number): FolderTreeNode[] {
    const list = childrenMap.get(parentId) || [];
    return list.map((folder) => ({
      folder,
      level,
      children: getNodes(folder.id, level + 1),
    }));
  }

  return getNodes(null, 0);
}

function getFolderDescendantIds(folderId: string, folders: Folder[]): Set<string> {
  const descendantIds = new Set<string>([folderId]);
  let addedNew = true;

  while (addedNew) {
    addedNew = false;
    folders.forEach((f) => {
      if (f.parentId && descendantIds.has(f.parentId) && !descendantIds.has(f.id)) {
        descendantIds.add(f.id);
        addedNew = true;
      }
    });
  }

  return descendantIds;
}

/* Recursive Quick Access Sidebar Item */
const FolderTreeItem: React.FC<{
  node: FolderTreeNode;
  currentFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, type: 'folder', item: Folder) => void;
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
}> = React.memo(({ node, currentFolderId, onSelectFolder, onContextMenu, expandedFolderIds, toggleExpand }) => {
  const isActive = currentFolderId === node.folder.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedFolderIds.has(node.folder.id);

  return (
    <div className="flex flex-col w-full">
      <div
        className={`w-full flex items-center justify-between py-2 pr-3 rounded-2xl text-[13px] font-bold transition-all cursor-pointer group ${
          isActive
            ? 'bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-sm'
            : 'text-m3-secondary hover:bg-m3-hover hover:text-m3-text'
        }`}
        style={{ paddingLeft: `${8 + node.level * 16}px` }}
        onClick={() => onSelectFolder(node.folder.id)}
        onContextMenu={(e) => onContextMenu(e, 'folder', node.folder)}
      >
        <div className="flex items-center gap-2 truncate pr-1 min-w-0 flex-1">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.folder.id);
              }}
              className="p-1 hover:bg-m3-primary/20 rounded-lg text-m3-secondary hover:text-m3-primary transition-all shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-6 h-6 shrink-0" />
          )}

          {isActive ? (
            <FolderOpen className="w-4.5 h-4.5 text-m3-primary shrink-0" />
          ) : (
            <FolderIcon className="w-4.5 h-4.5 text-m3-primary/60 shrink-0 group-hover:text-m3-primary transition-colors" />
          )}
          <span className="truncate tracking-tight">{node.folder.name}</span>
        </div>

        <span className="text-[10px] text-m3-secondary font-black opacity-60 shrink-0">
          {node.folder.songCount || 0}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col w-full gap-1 mt-1">
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.folder.id}
              node={child}
              currentFolderId={currentFolderId}
              onSelectFolder={onSelectFolder}
              onContextMenu={onContextMenu}
              expandedFolderIds={expandedFolderIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/* Recursive Move Modal Tree Item */
const MoveFolderTreeItem: React.FC<{
  node: FolderTreeNode;
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  disabledFolderIds?: Set<string>;
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
}> = React.memo(({ node, selectedFolderId, onSelect, disabledFolderIds, expandedFolderIds, toggleExpand }) => {
  const isDisabled = disabledFolderIds?.has(node.folder.id);
  const isSelected = selectedFolderId === node.folder.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedFolderIds.has(node.folder.id);

  return (
    <div className="flex flex-col w-full">
      <label
        style={{ paddingLeft: `${12 + node.level * 16}px` }}
        className={`flex items-center gap-2.5 p-2.5 border rounded-xl transition-colors ${
          isDisabled
            ? 'opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
            : isSelected
            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 cursor-pointer'
            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
        }`}
      >
        <input
          type="radio"
          name="moveTargetRadio"
          disabled={isDisabled}
          checked={isSelected}
          onChange={() => !isDisabled && onSelect(node.folder.id)}
          className="text-[#0284c7] focus:ring-[#0284c7]"
        />

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleExpand(node.folder.id);
            }}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors shrink-0"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}

        <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
          {node.folder.name}
        </span>
      </label>

      {hasChildren && isExpanded && (
        <div className="flex flex-col gap-1.5 mt-1.5">
          {node.children.map((child) => (
            <MoveFolderTreeItem
              key={child.folder.id}
              node={child}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              disabledFolderIds={disabledFolderIds}
              expandedFolderIds={expandedFolderIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, tenant } = useAuth();
  
  const isSongsView = location.pathname === '/songs';
  const isSongEditorView = location.pathname.startsWith('/songs/') && location.pathname !== '/songs';
  const isServicesView = location.pathname === '/services';
  const isServiceEditorView = location.pathname.startsWith('/services/') && location.pathname !== '/services';
  const isMusiciansView = location.pathname.startsWith('/musicians');
  const isSettingsView = location.pathname.startsWith('/settings');
  const isExplorerView = location.pathname.startsWith('/folders') || (!isSongsView && !isSongEditorView && !isServicesView && !isServiceEditorView && !isMusiciansView && !isSettingsView);
  const isEditorView = isSongEditorView || isServiceEditorView;

  // Plus Dropdown State
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);

  // User Dropdown State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const { showToast } = useSync();
  const { servicesQuery, createService, deleteService } = useServices();
  const allServices = useMemo(() => servicesQuery.data || [], [servicesQuery.data]);

  // Folder state: null = Root directory
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const navigateBackToDrive = () => {
    if (location.pathname !== '/folders') {
      navigate('/folders');
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (isMusiciansView || isSettingsView) {
      navigate('/folders');
    }
  };

  const handleSelectFolder = (id: string | null) => {
    setCurrentFolderId(id);
    if (!isExplorerView) {
      navigate('/folders');
    }
  };

  const handleSortChange = (sb: 'title' | 'artist' | 'updatedAt', so: 'asc' | 'desc') => {
    setSortBy(sb);
    setSortOrder(so);
    if (isMusiciansView || isSettingsView) {
      navigate('/folders');
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (isMusiciansView || isSettingsView) {
      navigate('/folders');
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-Selection State
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  // Marquee Rubberband Drag Selection State
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const isMouseDownRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialSelectionRef = useRef<{ folders: Set<string>; songs: Set<string> }>({
    folders: new Set(),
    songs: new Set(),
  });

  // Batch Modals State
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchTagOpen, setIsBatchTagOpen] = useState(false);

  // Clear selection on folder navigation
  useEffect(() => {
    setSelectedFolderIds(new Set());
    setSelectedSongIds(new Set());
    setLastClickedId(null);
  }, [currentFolderId]);

  // Drag & Drop & Upload State
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isInternalDragActive, setIsInternalDragActive] = useState(false);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Expanded Folders in Tree View State
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // API Hooks
  const { foldersQuery, createFolder, renameFolder, moveFolder, deleteFolder } = useFolders();

  const songParams = useMemo(() => ({}), []);

  const { songsQuery, renameSong, moveSong, deleteSong, updateBatchTags } = useAllSongs(songParams);

  // Search & Filters State
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchFields, setSearchFields] = useState({
    title: true,
    artist: true,
    content: true,
    tags: true,
  });
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'updatedAt'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSongModalOpen, setIsCreateSongModalOpen] = useState(false);

  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [moveFolderTarget, setMoveFolderTarget] = useState<Folder | null>(null);
  const [targetParentFolderId, setTargetParentFolderId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [deleteAção, setDeleteAção] = useState<'move_to_root' | 'delete_songs'>('move_to_root');
  const [confirmFolderName, setConfirmFolderName] = useState('');

  // Song Modal States
  const [renameSongTarget, setRenameSongTarget] = useState<Song | null>(null);
  const [newSongTitle, setNewSongTitle] = useState('');

  const [moveSongTarget, setMoveSongTarget] = useState<Song | null>(null);
  const [targetSongFolderId, setTargetSongFolderId] = useState<string | null>(null);

  const [deleteSongTarget, setDeleteSongTarget] = useState<Song | null>(null);

  const allFolders = useMemo(() => foldersQuery.data?.folders || [], [foldersQuery.data?.folders]);
  const allSongs = useMemo(() => songsQuery.data?.songs || [], [songsQuery.data?.songs]);
  const totalSongs = songsQuery.data?.total;
  const rootSongsCount = foldersQuery.data?.rootSongsCount || 0;

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
    if (!folderId) return 'Raiz';
    const pathList: string[] = [];
    let curr: Folder | undefined = allFolders.find((f) => f.id === folderId);
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      pathList.unshift(curr.name);
      curr = curr.parentId ? allFolders.find((f) => f.id === curr?.parentId) : undefined;
    }

    return pathList.length > 0 ? pathList.join(' / ') : 'Raiz';
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
    let curr: Folder | undefined = allFolders.find((f) => f.id === currentFolderId);
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      trail.unshift(curr);
      curr = curr.parentId ? allFolders.find((f) => f.id === curr?.parentId) : undefined;
    }
    return trail;
  }, [currentFolderId, allFolders]);

  const currentSongId = isSongEditorView ? location.pathname.split('/').pop() : null;
  const currentSong = useMemo(() => allSongs.find(s => s.id === currentSongId), [allSongs, currentSongId]);

  const songBreadcrumbs = useMemo(() => {
    if (!currentSong || !currentSong.folderId) return [];
    const trail: Folder[] = [];
    let curr: Folder | undefined = allFolders.find((f) => f.id === currentSong.folderId);
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      trail.unshift(curr);
      curr = curr.parentId ? allFolders.find((f) => f.id === curr?.parentId) : undefined;
    }
    return trail;
  }, [currentSong, allFolders]);

  const currentSongFileName = useMemo(() => {
    if (!currentSong) return '';
    let title = currentSong.title || '';
    if (title.endsWith('.chordpro') || title.endsWith('.pro') || title.endsWith('.txt') || title.endsWith('.chopro')) {
      return title;
    }
    let ext = '.chordpro';
    if (currentSong.path) {
      const match = currentSong.path.match(/\.[a-z0-9]+$/i);
      if (match) ext = match[0];
    }
    return `${title}${ext}`;
  }, [currentSong]);

  const currentServiceId = isServiceEditorView ? location.pathname.split('/').pop() : null;
  const currentService = useMemo(() => allServices.find(s => s.id === currentServiceId), [allServices, currentServiceId]);

  // Is searching or filtering active?
  const isSearchingOrFiltering = Boolean(
    searchQuery.trim() || selectedKey || selectedTag
  );

  const activeFiltersCount = (searchQuery.trim() ? 1 : 0) + (selectedKey ? 1 : 0) + (selectedTag ? 1 : 0);

  // Subfolders inside current directory or scope search results
  const filteredSubfolders = useMemo(() => {
    let list: Folder[];

    if (!isSearchingOrFiltering) {
      list = currentFolderId === null
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
      let valA = (a.name || '').toLowerCase();
      let valB = (b.name || '').toLowerCase();

      if (sortBy === 'updatedAt') {
        valA = a.createdAt || '';
        valB = b.createdAt || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allFolders, currentFolderId, descendantFolderIds, isSearchingOrFiltering, searchQuery, sortBy, sortOrder]);

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

        if (selectedTag && (!s.tags || !s.tags.includes(selectedTag))) return false;

        if (q) {
          let matches = false;
          if (searchFields.title && s.title.toLowerCase().includes(q)) matches = true;
          if (searchFields.artist && s.artist?.toLowerCase().includes(q)) matches = true;
          if (searchFields.content && s.content?.toLowerCase().includes(q)) matches = true;
          if (searchFields.tags && s.tags?.some((t) => t.toLowerCase().includes(q))) matches = true;

          const folderName = allFolders.find((f) => f.id === s.folderId)?.name.toLowerCase();
          if (folderName && folderName.includes(q)) matches = true;

          if (!matches) return false;
        }

        return true;
      });
    }

    return [...list].sort((a, b) => {
      let valA = (a.title || '').toLowerCase();
      let valB = (b.title || '').toLowerCase();

      if (sortBy === 'artist') {
        valA = (a.artist || '').toLowerCase();
        valB = (b.artist || '').toLowerCase();
      } else if (sortBy === 'updatedAt') {
        valA = a.updatedAt || '';
        valB = b.updatedAt || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allSongs, currentFolderId, descendantFolderIds, isSearchingOrFiltering, searchQuery, selectedKey, selectedTag, searchFields, sortBy, sortOrder, allFolders]);

  // Ordered view items for shift-click range selection
  const viewItems = useMemo(() => {
    const folders = filteredSubfolders.map((f) => ({ id: f.id, type: 'folder' as const, item: f }));
    const songs = filteredFiles.map((s) => ({ id: s.id, type: 'song' as const, item: s }));
    return [...folders, ...songs];
  }, [filteredSubfolders, filteredFiles]);

  // Selection Handlers (Click, Ctrl+Click, Shift+Click)
  const handleItemClick = (e: React.MouseEvent, id: string, type: 'folder' | 'song') => {
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      if (type === 'folder') toggleFolderSelect(id);
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
          if (v.type === 'folder') nextFolders.add(v.id);
          else nextSongs.add(v.id);
        });

        setSelectedFolderIds(nextFolders);
        setSelectedSongIds(nextSongs);
      } else {
        if (type === 'folder') {
          setSelectedFolderIds(new Set([id]));
          setSelectedSongIds(new Set());
        } else {
          setSelectedFolderIds(new Set());
          setSelectedSongIds(new Set([id]));
        }
      }
      setLastClickedId(id);
    } else {
      if (type === 'folder') {
        setSelectedFolderIds(new Set([id]));
        setSelectedSongIds(new Set());
      } else {
        setSelectedFolderIds(new Set());
        setSelectedSongIds(new Set([id]));
      }
      setLastClickedId(id);
    }
  };

  const toggleFolderSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSongSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
  const handleWorkspaceMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !startPosRef.current || !containerRef.current) return;

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

        const itemEls = containerRef.current.querySelectorAll<HTMLElement>('[data-item-id]');
        const nextFolders = new Set(initialSelectionRef.current.folders);
        const nextSongs = new Set(initialSelectionRef.current.songs);

        itemEls.forEach((el) => {
          const id = el.getAttribute('data-item-id');
          const type = el.getAttribute('data-item-type') as 'folder' | 'song';
          if (!id || !type) return;

          const rect = el.getBoundingClientRect();

          const intersects = !(
            rect.right < left ||
            rect.left > left + width ||
            rect.bottom < top ||
            rect.top > top + height
          );

          if (intersects) {
            if (type === 'folder') nextFolders.add(id);
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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const totalSelectedCount = selectedFolderIds.size + selectedSongIds.size;
  const totalViewItemsCount = filteredSubfolders.length + filteredFiles.length;
  const isAllSelected =
    totalViewItemsCount > 0 &&
    selectedFolderIds.size === filteredSubfolders.length &&
    selectedSongIds.size === filteredFiles.length;

  const selectedFolderObjects = useMemo(
    () => allFolders.filter((f) => selectedFolderIds.has(f.id)),
    [allFolders, selectedFolderIds]
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
  const handleBatchMoveConfirm = async (targetFolderId: string | null) => {
    const folderList = Array.from(selectedFolderIds) as string[];
    const songList = Array.from(selectedSongIds) as string[];

    for (const fId of folderList) {
      const f = allFolders.find(x => x.id === fId);
      if (f) await moveFolder({ id: fId, parentId: targetFolderId, updatedAt: f.updatedAt });
    }
    for (const sId of songList) {
      const s = allSongs.find(x => x.id === sId);
      if (s) await moveSong({ id: sId, folderId: targetFolderId, updatedAt: s.updatedAt });
    }

    showToast(`${folderList.length + songList.length} item(ns) movido(s) com sucesso!`, 'success');
    clearSelection();
  };

  const handleBatchDeleteConfirm = async (folderAction: 'move_to_root' | 'delete_songs') => {
    const folderList = Array.from(selectedFolderIds) as string[];
    const songList = Array.from(selectedSongIds) as string[];

    for (const fId of folderList) {
      await deleteFolder({ id: fId, action: folderAction });
    }
    for (const sId of songList) {
      await deleteSong(sId);
    }

    showToast(`${folderList.length + songList.length} item(ns) apagado(s) com sucesso!`, 'success');
    clearSelection();
  };

  const handleBatchTagConfirm = async (tags: string[], mode: 'append' | 'replace' | 'remove') => {
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
      if (e.key === 'Escape') setContextMenu(null);
    };

    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        clearSelection();
        return;
      }

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isTyping) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      if (!isExplorerView) return;
      e.preventDefault();
      selectAllInCurrentView();
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (totalSelectedCount === 0) return;
      e.preventDefault();

      if (totalSelectedCount === 1) {
        if (selectedFolderIds.size === 1) {
          const folder = allFolders.find((f) => f.id === Array.from(selectedFolderIds)[0]);
          if (folder) setDeleteTarget(folder);
        } else {
          const song = allSongs.find((s) => s.id === Array.from(selectedSongIds)[0]);
          if (song) setDeleteSongTarget(song);
        }
      } else {
        setIsBatchDeleteOpen(true);
      }
      return;
    }

    if (e.key === 'Enter') {
      if (totalSelectedCount !== 1) return;
      if (selectedFolderIds.size === 1) {
        handleSelectFolder(Array.from(selectedFolderIds)[0]);
      } else if (selectedSongIds.size === 1) {
        navigate(`/songs/${Array.from(selectedSongIds)[0]}`);
      }
    }
  };

  window.addEventListener('click', handleCloseMenu);
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('click', handleCloseMenu);
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [totalSelectedCount, selectedFolderIds, selectedSongIds, allFolders, allSongs, isExplorerView]);

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
  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'song', item: Folder | Song) => {
    e.preventDefault();
    e.stopPropagation();

    const isAlreadySelected = type === 'folder'
      ? selectedFolderIds.has(item.id)
      : selectedSongIds.has(item.id);

    if (!isAlreadySelected) {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (type === 'folder') {
          setSelectedFolderIds(new Set([item.id]));
          setSelectedSongIds(new Set());
        } else {
          setSelectedFolderIds(new Set());
          setSelectedSongIds(new Set([item.id]));
        }
        setLastClickedId(item.id);
      } else {
        if (type === 'folder') toggleFolderSelect(item.id);
        else toggleSongSelect(item.id);
        setLastClickedId(item.id);
      }
    }

    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 280);

    setContextMenu({ x, y, type, item });
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-item-id]')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 300);

    setContextMenu({ x, y, type: 'canvas', item: null });
  };

  // Folder Actions
  const handleCreateFolderSubmit = async (name: string) => {
    await createFolder({ name, parentId: currentFolderId });
    setIsCreateModalOpen(false);
  };

  const handleRenameFolderSubmit = async (name: string) => {
    if (!renameTarget) return;
    await renameFolder({ id: renameTarget.id, name, updatedAt: renameTarget.updatedAt });
    setRenameTarget(null);
  };

  const handleMoveFolderSubmit = async () => {
    if (!moveFolderTarget) return;
    await moveFolder({ id: moveFolderTarget.id, parentId: targetParentFolderId, updatedAt: moveFolderTarget.updatedAt });
    setMoveFolderTarget(null);
  };

  const handleDeleteFolderSubmit = async () => {
    if (!deleteTarget) return;
    if (deleteAção === 'delete_songs' && confirmFolderName.trim() !== deleteTarget.name.trim()) {
      showToast('O nome da pasta inserido não é igual ao nome da pasta.', 'error');
      return;
    }
    await deleteFolder({ id: deleteTarget.id, action: deleteAção });
    if (currentFolderId === deleteTarget.id) {
      setCurrentFolderId(null);
    }
    setDeleteTarget(null);
    setConfirmFolderName('');
    setDeleteAção('move_to_root');
  };

  // Song Actions
  const handleCreateSongSubmit = async (data: { title: string; artist: string; folderId: string | null; tags: string[] }) => {
    await songsApi.createSong({
      title: data.title,
      artist: data.artist,
      folderId: data.folderId,
      content: `{title: ${data.title}}\n{artist: ${data.artist}}\n\n[G] Exemplo de tom e cifra...`,
      tags: data.tags,
    });
    await Promise.all([songsQuery.refetch(), foldersQuery.refetch()]);
    setIsCreateSongModalOpen(false);
    showToast('Cântico criado com sucesso!', 'success');
  };

  const handleCreateServiceSubmit = async (data: { name: string; date: string; notes: string }) => {
    const newService = await createService({
      name: data.name,
      date: data.date,
      notes: data.notes,
      elements: [],
    });
    setIsCreateServiceModalOpen(false);
    navigate(`/services/${newService.id}`);
  };

  const handleRenameSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameSongTarget || !newSongTitle.trim()) return;
    await renameSong({ id: renameSongTarget.id, newTitle: newSongTitle.trim(), updatedAt: renameSongTarget.updatedAt });
    setRenameSongTarget(null);
    setNewSongTitle('');
  };

  const handleMoveSongSubmit = async () => {
    if (!moveSongTarget) return;
    await moveSong({ id: moveSongTarget.id, folderId: targetSongFolderId, updatedAt: moveSongTarget.updatedAt });
    setMoveSongTarget(null);
  };

  const handleDeleteSongSubmit = async () => {
    if (!deleteSongTarget) return;
    await deleteSong(deleteSongTarget.id);
    setDeleteSongTarget(null);
  };

  const cleanSongTitleFromFilename = (filename: string): string => {
    let name = filename.replace(/\.[^/.]+$/, '');
    name = name.replace(/\[.*?\]/g, '');
    name = name.replace(/\(.*?\)/g, '');
    name = name.replace(/\{.*?\}/g, '');
    name = name.replace(/#\w+/g, '');
    name = name.replace(/_/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    return name || filename.replace(/\.[^/.]+$/, '').trim();
  };

  const processAndUploadFiles = async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploadingFiles(true);

    try {
      const songPayloads: Array<Partial<Song>> = [];

      for (const file of fileList) {
        const fileText = await file.text();
        const cleanTitle = cleanSongTitleFromFilename(file.name);

        let finalContent = fileText;
        if (!/\{title\s*:/i.test(fileText)) {
          finalContent = `{title: ${cleanTitle}}\n${fileText}`;
        }

        let artist = 'Vários';
        const artistMatch = fileText.match(/\{artist\s*:\s*([^}]+)\}/i);
        if (artistMatch && artistMatch[1]) {
          artist = artistMatch[1].trim();
        }

        songPayloads.push({
          title: cleanTitle,
          artist: artist,
          content: finalContent,
          folderId: currentFolderId,
          tags: ['ChordPro'],
        });
      }

      if (songPayloads.length > 0) {
        const res = await songsApi.createSongsBatch(songPayloads);

        await Promise.all([
          songsQuery.refetch(),
          foldersQuery.refetch(),
        ]);

        const targetFolderName = currentFolder ? currentFolder.name : 'Diretório Raiz';
        showToast(
          `${res.count} ficheiro(s) ChordPro carregado(s) com sucesso para "${targetFolderName}"!`,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Erro ao carregar ficheiros: ' + (err?.message || 'Falha de leitura'), 'error');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleChordProFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAndUploadFiles(Array.from(files));
    }
    if (e.target) e.target.value = '';
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

  const handleItemDragStart = (e: React.DragEvent, id: string, type: 'folder' | 'song') => {
    const isSelected = type === 'folder' ? selectedFolderIds.has(id) : selectedSongIds.has(id);

    if (!isSelected) {
      if (type === 'folder') {
        setSelectedFolderIds(new Set([id]));
        setSelectedSongIds(new Set());
      } else {
        setSelectedFolderIds(new Set());
        setSelectedSongIds(new Set([id]));
      }
      setLastClickedId(id);
    }

    setIsInternalDragActive(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-app-internal-drag', 'true');
  };

  const handleItemDragEnd = () => {
    setIsInternalDragActive(false);
    setDropTargetFolderId(null);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    if (!isInternalDragActive) return;
    e.preventDefault();
    e.stopPropagation();

    if (disabledFolderIdsForBatchMove.has(folderId)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    setDropTargetFolderId(folderId);
  };

  const handleFolderDragLeave = (e: React.DragEvent, folderId: string) => {
    e.stopPropagation();
    setDropTargetFolderId((prev) => (prev === folderId ? null : prev));
  };

  const handleFolderDrop = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInternalDrag = isInternalDragActive;
    setDropTargetFolderId(null);
    setIsInternalDragActive(false);

    if (!wasInternalDrag || disabledFolderIdsForBatchMove.has(folderId)) return;

    // Move direto, sem modal de confirmação
    await handleBatchMoveConfirm(folderId);
  };

  const totalItemsCount = filteredSubfolders.length + filteredFiles.length;

  return (
    <>
    <div className="h-dvh max-h-dvh w-full flex flex-row overflow-hidden bg-m3-bg">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

{/* Sidebar (Tree View) */}
      <div className={`${isSidebarOpen ? 'flex absolute inset-y-0 left-0 z-50 bg-m3-sidebar shadow-2xl' : 'hidden'} md:flex md:static md:bg-m3-sidebar/30 w-72 md:w-64 border-r border-m3-border p-4 flex-col gap-1 select-none shrink-0 overflow-y-auto transition-all duration-300`}>
        
      <div className="flex flex-col items-center text-center mb-4 mt-2 select-none">
        <div className="flex items-center gap-3">
          <div
            className="
              w-12 h-12 rounded-xl
              flex items-center justify-center
              border border-slate-200 dark:border-slate-800
              transition-transform
              hover:scale-105 hover:rotate-2
              overflow-hidden
            "
          >
            <img
              src={logo}
              alt="Hosanna Studio"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col items-start">
            <h1 className="font-display font-black text-2xl tracking-tighter text-slate-900 dark:text-slate-100 leading-none">
              Hosanna Studio
            </h1>

            {tenant && (
              <span className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {tenant.name || tenant.slug}
              </span>
            )}
          </div>
        </div>
      </div>

        {/* Changed from Acesso Rápido */}
        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-m3-secondary opacity-60">
          Menu Principal
        </div>

        <button
          onClick={() => {
            setCurrentFolderId(null);
            navigate('/folders');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
            isExplorerView && currentFolderId === null
              ? 'bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-sm'
              : 'text-m3-secondary hover:bg-m3-hover hover:text-m3-text'
          }`}
        >
          <div className="flex items-center gap-3">
            <HardDrive className={`w-4.5 h-4.5 ${isExplorerView && currentFolderId === null ? 'text-m3-primary' : 'text-m3-secondary'}`} />
            <span>O Meu Drive</span>
          </div>
          <Badge variant={isExplorerView && currentFolderId === null ? 'sky' : 'slate'}>{rootSongsCount}</Badge>
        </button>

        <button
          onClick={() => {
            navigate('/songs');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
            isSongsView
              ? 'bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-sm'
              : 'text-m3-secondary hover:bg-m3-hover hover:text-m3-text'
          }`}
        >
          <div className="flex items-center gap-3">
            <Music className="w-4.5 h-4.5 text-m3-primary" />
            <span>Biblioteca</span>
          </div>
          <Badge variant={isSongsView ? 'sky' : 'slate'}>{totalSongs}</Badge>
        </button>

        <button
          onClick={() => {
            navigate('/services');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
            isServicesView
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
              : 'text-m3-secondary hover:bg-m3-hover hover:text-m3-text'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-4.5 h-4.5 text-emerald-500" />
            <span>Cultos</span>
          </div>
        </button>

        <div className="mt-6 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-m3-secondary opacity-60">
          Diretórios ({allFolders.length})
        </div>

        {/* Hierarchical Folder Tree */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
          {folderTree.map((node) => (
            <FolderTreeItem
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

        {/* User Dropdown at bottom of sidebar */}
        {user && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950 text-[#0284c7] dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              </div>
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/musicians');
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <QrCode className="w-4 h-4 text-[#0284c7]" />
                  Acesso a Músicos
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
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
        <div className="bg-m3-card border md:border-none border-m3-border rounded-[32px] md:rounded-none shadow-2xl md:shadow-none shadow-black/10 overflow-hidden flex flex-col flex-1 h-full transition-all duration-300">
          
          {/* Explorer Address Bar & Toolbar */}
          {(isExplorerView || isSongsView || isServicesView || isMusiciansView || isSettingsView || isEditorView) && (
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
                        ? 'No Nível Raiz'
                        : currentFolder?.parentId
                        ? 'Subir um nível'
                        : 'Subir para a pasta Raiz'
                      : 'Voltar'
                  }
                  className={`p-2.5 rounded-2xl border transition-all ${
                    isExplorerView && currentFolderId === null
                      ? 'text-m3-secondary/30 bg-m3-bg border-m3-border/30 cursor-not-allowed opacity-50'
                      : 'text-m3-primary border-m3-primary/30 hover:bg-m3-primary hover:text-white bg-m3-card cursor-pointer shadow-sm hover:shadow-m3-primary/20'
                  }`}
                >
                  <CornerLeftUp className="w-4.5 h-4.5" />
                </button>

                {/* Address Path Bar */}
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-m3-bg border border-m3-border rounded-2xl text-[13px] overflow-x-auto select-none hide-scrollbar shadow-inner min-w-0">
                  <button
                    onClick={() => {
                      handleSelectFolder(null);
                      navigate('/folders');
                    }}
                    className={`flex items-center gap-2 font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
                      currentFolderId === null && isExplorerView
                        ? 'text-m3-primary'
                        : 'text-m3-secondary hover:text-m3-text'
                    }`}
                  >
                    <HardDrive className={`w-4 h-4 ${currentFolderId === null && isExplorerView ? 'text-m3-primary' : 'text-m3-secondary'}`} />
                    <span>Início</span>
                  </button>

                  {isExplorerView && folderBreadcrumbs.map((folder, index) => {
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
                              navigate('/folders');
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
                        onClick={() => navigate('/services')}
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
                            {new Date(currentService.date).toLocaleDateString('pt-PT', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        </>
                      )}
                    </>
                  )}

                  {isMusiciansView && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                      <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 uppercase tracking-wide">
                        <User className="w-4 h-4" />
                        <span>Músicos</span>
                      </div>
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
                </div>

                {/* Plus Dropdown - Only for explorer/songs/services */}
                {(isExplorerView || isSongsView || isServicesView) && (
                  <div className="relative shrink-0 ml-1" ref={plusMenuRef}>
                    <button
                      onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                      className="w-10 h-10 rounded-2xl bg-m3-primary text-white flex items-center justify-center border border-m3-primary font-black text-lg shadow-xl shadow-m3-primary/20 hover:bg-m3-primary-dark hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Criar..."
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {isPlusMenuOpen && (
                      <div className="absolute right-0 top-full mt-3 w-64 bg-m3-card border border-m3-border rounded-[24px] shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-m3-secondary opacity-60">
                          Criar Novo
                        </div>
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
                        <button
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            setIsCreateModalOpen(true);
                          }}
                          className="w-full flex items-center gap-4 px-4 py-3 text-xs font-bold text-m3-text hover:bg-m3-hover rounded-2xl transition-all cursor-pointer text-left group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-m3-primary-light/10 text-m3-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <FolderPlus className="w-4 h-4" />
                          </div>
                          Nova Pasta
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Search Filter, Sorting & View Mode Toggles */}
              {(isExplorerView || isSongsView || isServicesView) && (
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Input
                      placeholder={
                        isServicesView
                          ? "Pesquisar cultos..."
                          : isSongsView
                          ? "Pesquisar biblioteca..."
                          : currentFolder
                          ? `Pesquisar em "${currentFolder.name}"...`
                          : "Pesquisar ficheiros..."
                      }
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      icon={<Search className="w-4 h-4 text-m3-secondary" />}
                      className="py-2.5 text-sm pr-9 rounded-2xl"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-m3-secondary hover:text-m3-text hover:bg-m3-hover rounded-lg cursor-pointer transition-all"
                        title="Limpar pesquisa"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isExplorerView && (
                    <>
                      {/* Filter Pop-Up Panel Trigger Button */}
                      <button
                        onClick={() => {
                          navigateBackToDrive();
                          setIsFilterPanelOpen(true);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer relative ${
                          activeFiltersCount > 0
                            ? 'bg-m3-primary/10 border-m3-primary text-m3-primary shadow-lg shadow-m3-primary/10'
                            : 'bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text hover:border-m3-primary/30'
                        }`}
                        title="Abrir Filtros Avançados"
                      >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {activeFiltersCount > 0 && (
                          <span className="w-4.5 h-4.5 rounded-full bg-m3-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                            {activeFiltersCount}
                          </span>
                        )}
                      </button>

                      {/* Sort Control Button */}
                      <div className="flex items-center gap-2 bg-m3-bg border border-m3-border rounded-2xl px-3 py-2 text-xs transition-all hover:border-m3-primary/30">
                        <ArrowUpDown className="w-4 h-4 text-m3-secondary shrink-0" />
                        <select
                          value={`${sortBy}-${sortOrder}`}
                          onChange={(e) => {
                            const [sb, so] = e.target.value.split('-') as ['title' | 'artist' | 'updatedAt', 'asc' | 'desc'];
                            handleSortChange(sb, so);
                          }}
                          className="bg-transparent font-bold text-m3-text focus:outline-none cursor-pointer text-[11px] uppercase tracking-wider"
                          title="Organizar ficheiros"
                        >
                          <option value="title-asc">Nome (A-Z)</option>
                          <option value="title-desc">Nome (Z-A)</option>
                          <option value="artist-asc">Artista (A-Z)</option>
                          <option value="updatedAt-desc">Data Recente</option>
                        </select>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center p-1 bg-m3-bg rounded-2xl border border-m3-border select-none shrink-0 shadow-inner">
                        <button
                          onClick={() => handleViewModeChange('grid')}
                          title="Vista em Grelha"
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            viewMode === 'grid'
                              ? 'bg-m3-card text-m3-primary shadow-lg shadow-black/10'
                              : 'text-m3-secondary hover:text-m3-text'
                          }`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewModeChange('list')}
                          title="Vista em Lista"
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            viewMode === 'list'
                              ? 'bg-m3-card text-m3-primary shadow-lg shadow-black/10'
                              : 'text-m3-secondary hover:text-m3-text'
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-900 overflow-hidden">
            <Outlet context={{
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
            }} />
          </div>

          {/* Status Bar */}
          {isExplorerView && (
            <div className="h-10 bg-m3-sidebar/40 border-t border-m3-border px-6 flex items-center justify-between text-[10px] text-m3-secondary font-black uppercase tracking-widest select-none">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 opacity-60" />
                  {currentFolder ? `/${currentFolder.name}` : '/ (Raiz)'}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span>{filteredSubfolders.length} Pastas</span>
                <span>{filteredFiles.length} Ficheiros</span>
                <span className="text-m3-primary">{totalItemsCount} Total</span>
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

          <Button
            size="sm"
            variant="ghost"
            icon={<Move className="w-4 h-4" />}
            onClick={() => setIsBatchMoveOpen(true)}
            className="!text-white dark:!text-slate-900 hover:!bg-white/10 dark:hover:!bg-slate-900/10"
          >
            Mover
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setIsBatchDeleteOpen(true)}
            className="!text-rose-400 hover:!bg-rose-500/10"
          >
            Eliminar
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={<X className="w-4 h-4" />}
            onClick={clearSelection}
            className="!text-white/70 dark:!text-slate-900/70 hover:!bg-white/10 dark:hover:!bg-slate-900/10"
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
          {contextMenu.type === 'canvas' ? (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-0.5 truncate flex items-center justify-between">
                <span>{currentFolder ? currentFolder.name : 'Diretório Raiz'}</span>
                <span className="text-[9px] text-slate-400 font-normal">Opções</span>
              </div>

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

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#0284c7]" />
                <span>Carregar Ficheiros ChordPro</span>
              </button>

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
              )}

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
                {contextMenu.type === 'folder' ? (contextMenu.item as Folder).name : (contextMenu.item as Song).title}
              </div>

              {contextMenu.type === 'folder' ? (
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
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate(`/songs/${(contextMenu.item as Song).id}`);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
              >
                <ExternalLink className="w-4 h-4 text-[#0284c7]" />
                <span>Abrir / Editar Cântico</span>
              </button>

              <button
                onClick={() => {
                  const song = contextMenu.item as Song;
                  setRenameSongTarget(song);
                  setNewSongTitle(song.title);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-left"
              >
                <Edit2 className="w-4 h-4 text-[#0284c7]" />
                <span>Mudar Nome do Cântico</span>
              </button>

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
            </>
          )}
        </>
      )}
    </div>
      )}

      {/* CREATE SONG MODAL */}
      <Modal
        isOpen={isCreateSongModalOpen}
        onClose={() => setIsCreateSongModalOpen(false)}
        title={currentFolder ? `Criar Novo Cântico em "${currentFolder.name}"` : 'Criar Novo Cântico na Raiz'}
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
        title={currentFolder ? `Criar Pasta dentro de "${currentFolder.name}"` : 'Criar Nova Pasta na Raiz'}
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
          initialName={renameTarget?.name || ''}
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
            Selecione uma nova pasta de destino para <strong className="text-slate-900 dark:text-slate-100">{moveFolderTarget?.name}</strong>:
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
                  disabledFolderIds={moveFolderTarget ? getFolderDescendantIds(moveFolderTarget.id, allFolders) : undefined}
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
            <Button variant="primary" onClick={handleMoveFolderSubmit}>Mover Pasta</Button>
          </div>
        </div>
      </Modal>

      {/* DELETE FOLDER MODAL */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setConfirmFolderName('');
          setDeleteAção('move_to_root');
        }}
        title={`Apagar Pasta "${deleteTarget?.name}"`}
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span>
              Selecione como tratar os cânticos dentro desta pasta:
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <input
                type="radio"
                name="deleteAção"
                value="move_to_root"
                checked={deleteAção === 'move_to_root'}
                onChange={() => {
                  setDeleteAção('move_to_root');
                  setConfirmFolderName('');
                }}
                className="text-[#0284c7] focus:ring-[#0284c7]"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Mover cânticos para a Raiz (Recomendado)
                </span>
                <span className="text-[11px] text-slate-500">
                  Mantém as cifras dos cânticos na biblioteca sem categoria de pasta.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-rose-200 dark:border-rose-950 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
              <input
                type="radio"
                name="deleteAção"
                value="delete_songs"
                checked={deleteAção === 'delete_songs'}
                onChange={() => setDeleteAção('delete_songs')}
                className="text-rose-600 focus:ring-rose-500"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Apagar pasta e todos os cânticos nela contidos
                </span>
                <span className="text-[11px] text-slate-500">
                  Apaga permanentemente a pasta E todos os ficheiros de cânticos dentro dela.
                </span>
              </div>
            </label>
          </div>

          {deleteAção === 'delete_songs' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Confirmação Adicional de Segurança</span>
              </div>
              <p className="text-rose-900 dark:text-rose-200 text-[11px] leading-relaxed">
                Esta ação é irreversível. Para confirmar a eliminação permanente da pasta e de todos os seus cânticos, escreva o nome da pasta <strong className="font-extrabold underline">{deleteTarget?.name}</strong> abaixo:
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
                setConfirmFolderName('');
                setDeleteAção('move_to_root');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={deleteAção === 'delete_songs' && confirmFolderName.trim() !== deleteTarget?.name?.trim()}
              onClick={handleDeleteFolderSubmit}
            >
              Confirmar Eliminação
            </Button>
          </div>
        </div>
      </Modal>

      {/* RENAME SONG MODAL */}
      <Modal
        isOpen={!!renameSongTarget}
        onClose={() => setRenameSongTarget(null)}
        title={`Mudar Nome do Cântico "${renameSongTarget?.title}"`}
      >
        <form onSubmit={handleRenameSongSubmit} className="flex flex-col gap-4">
          <Input
            label="Título do Cântico"
            value={newSongTitle}
            onChange={(e) => setNewSongTitle(e.target.value)}
            placeholder="Insira o novo título do cântico..."
            autoFocus
            required
          />

          <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setRenameSongTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Título
            </Button>
          </div>
        </form>
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
          await moveSong({ id: moveSongTarget.id, folderId: targetFolderId, updatedAt: moveSongTarget.updatedAt });
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
              Tem a certeza que deseja apagar permanentemente <strong>"{deleteSongTarget?.title}"</strong>? Isto também irá removê-lo de quaisquer cultos agendados.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setDeleteSongTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteSongSubmit}>Apagar Cântico</Button>
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
            Âmbito de pesquisa:{' '}
            <span className="font-bold text-[#0284c7]">
              {currentFolder ? `Pasta "${currentFolder.name}" e Subpastas` : 'Todo o Explorador (Diretório Raiz)'}
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
                onClick={() => setSelectedTag('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedTag === ''
                    ? 'bg-[#0284c7] text-white border-[#0284c7]'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                      ? 'bg-[#0284c7] text-white border-[#0284c7]'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                  onChange={(e) => setSearchFields((prev) => ({ ...prev, title: e.target.checked }))}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span>Título / Nome</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={searchFields.artist}
                  onChange={(e) => setSearchFields((prev) => ({ ...prev, artist: e.target.checked }))}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span>Artista / Autor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={searchFields.content}
                  onChange={(e) => setSearchFields((prev) => ({ ...prev, content: e.target.checked }))}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span>Letra / Conteúdo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={searchFields.tags}
                  onChange={(e) => setSearchFields((prev) => ({ ...prev, tags: e.target.checked }))}
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
                setSelectedKey('');
                setSelectedTag('');
                setSearchQuery('');
                setSearchFields({ title: true, artist: true, content: true, tags: true });
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
            position: 'fixed',
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            pointerEvents: 'none',
            zIndex: 100,
          }}
          className="border-2 border-[#0284c7] bg-[#0284c7]/25 rounded-lg shadow-xl backdrop-blur-[1px]"
        />
      )}
    </>
  );
};
