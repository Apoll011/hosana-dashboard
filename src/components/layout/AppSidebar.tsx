/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, Folder } from "@hosanna/shared";
import { Organization } from "better-auth/client";
import {
  ChevronLeft,
  ChevronRight,
  Church,
  HardDrive,
  LogOut,
  Music,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { getInitials } from "../../utils";
import { FolderTreeItemNode, FolderTreeNode } from "../explorer";
import { getRoleLabel } from "../settings/settingsUtils";

interface AppSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  organization?: Organization | null;
  slugPrefix: string;
  isExplorerView: boolean;
  isSongsView: boolean;
  isServicesView: boolean;
  isTeamsView: boolean;
  isTrashView: boolean;
  currentFolderId: string | null;
  rootSongsCount: number;
  rootFoldersCount: number;
  totalSongs: number;
  totalServices: number;
  allFolders: Folder[];
  folderTree: FolderTreeNode[];
  expandedFolderIds: Set<string>;
  showFolderTree: boolean;
  teamsEnabled?: boolean;
  user?: {
    name: string;
    image?: unknown;
    role?: string;
  } | null;
  onSelectFolder: (id: string | null) => void;
  onContextMenu: (
    e: React.MouseEvent,
    type: "folder" | "song",
    item: Folder,
  ) => void;
  toggleExpand: (id: string) => void;
  navigate: (path: string) => void;
  logout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  organization,
  slugPrefix,
  isExplorerView,
  isSongsView,
  isServicesView,
  isTeamsView,
  isTrashView,
  currentFolderId,
  rootSongsCount,
  rootFoldersCount,
  totalSongs,
  totalServices,
  allFolders,
  folderTree,
  expandedFolderIds,
  showFolderTree,
  teamsEnabled = false,
  user,
  onSelectFolder,
  onContextMenu,
  toggleExpand,
  navigate,
  logout,
}) => {
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`${
          isSidebarOpen
            ? "flex absolute inset-y-0 left-0 z-50 bg-m3-sidebar shadow-2xl"
            : "hidden"
        } md:flex md:relative md:bg-m3-sidebar/30 ${
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
            className={`flex items-center ${
              isSidebarCollapsed ? "justify-center w-full" : "gap-3"
            }`}
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
            onSelectFolder(null);
            navigate(`${slugPrefix}/folders`);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          title={
            isSidebarCollapsed
              ? `Drive da ${organization?.metadata?.shortName || ""}`
              : undefined
          }
          className={`w-full flex items-center ${
            isSidebarCollapsed ? "justify-center" : "justify-between"
          } px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
            isExplorerView && currentFolderId === null
              ? "bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-sm"
              : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
          }`}
        >
          <div
            className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
          >
            <HardDrive
              className={`w-4.5 h-4.5 ${
                isExplorerView && currentFolderId === null
                  ? "text-m3-primary"
                  : "text-m3-secondary"
              }`}
            />
            {!isSidebarCollapsed && (
              <span>Drive da {organization?.metadata?.shortName || ""}</span>
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
          title={isSidebarCollapsed ? "Biblioteca" : undefined}
          className={`w-full flex items-center ${
            isSidebarCollapsed ? "justify-center" : "justify-between"
          } px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
            isSongsView
              ? "bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-sm"
              : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
          }`}
        >
          <div
            className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
          >
            <Music
              className={`w-4.5 h-4.5 ${
                isSongsView ? "text-m3-primary" : "text-m3-secondary"
              }`}
            />
            {!isSidebarCollapsed && <span>Biblioteca</span>}
          </div>
          {!isSidebarCollapsed && (
            <Badge variant={isSongsView ? "sky" : "slate"}>{totalSongs}</Badge>
          )}
        </button>

        <button
          onClick={() => {
            navigate(`${slugPrefix}/services`);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          title={isSidebarCollapsed ? "Cultos" : undefined}
          className={`w-full flex items-center ${
            isSidebarCollapsed ? "justify-center" : "justify-between"
          } px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
            isServicesView
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
              : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
          }`}
        >
          <div
            className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
          >
            <Church
              className={`w-4.5 h-4.5 ${
                isServicesView ? "text-emerald-500" : "text-m3-secondary"
              }`}
            />
            {!isSidebarCollapsed && <span>Cultos</span>}
          </div>
          {!isSidebarCollapsed && (
            <Badge variant={isServicesView ? "sky" : "slate"}>
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
            title={isSidebarCollapsed ? "Equipas" : undefined}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? "justify-center" : "justify-between"
            } px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
              isTeamsView
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm"
                : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
            }`}
          >
            <div
              className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
            >
              <Users
                className={`w-4.5 h-4.5 ${
                  isTeamsView ? "text-amber-500" : "text-m3-secondary"
                }`}
              />
              {!isSidebarCollapsed && <span>Equipas</span>}
            </div>
          </button>
        )}

        {!isSidebarCollapsed && showFolderTree && (
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
                    onSelectFolder(id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  onContextMenu={onContextMenu}
                  expandedFolderIds={expandedFolderIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          </>
        )}
        {(isSidebarCollapsed || !showFolderTree) && <div className="flex-1" />}

        <button
          onClick={() => {
            navigate(`${slugPrefix}/trash`);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          title={isSidebarCollapsed ? "Lixo" : undefined}
          className={`w-full flex items-center ${
            isSidebarCollapsed ? "justify-center" : "justify-between"
          } px-4 py-3 text-[13px] font-bold rounded-2xl transition-all cursor-pointer group ${
            isTrashView
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm"
              : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
          }`}
        >
          <div
            className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
          >
            <Trash2
              className={`w-4.5 h-4.5 ${
                isTrashView ? "text-rose-500" : "text-m3-secondary"
              }`}
            />
            {!isSidebarCollapsed && <span>Lixo</span>}
          </div>
        </button>

        {user && (
          <div
            className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 relative shrink-0"
            ref={userMenuRef}
          >
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              title={isSidebarCollapsed ? user.name : undefined}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center" : "justify-between"
              } p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
            >
              <div
                className={`flex items-center ${
                  isSidebarCollapsed ? "" : "gap-2"
                } min-w-0`}
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
                  <Settings className="w-4 h-4 text-sky-600" />
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
      </aside>
    </>
  );
};
