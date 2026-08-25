/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Folder, Input, Service, Song } from "@hosanna/shared";
import {
  Calendar,
  ChevronRight,
  CornerLeftUp,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Menu,
  Music,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ViewName } from "../../layouts/view";
import { authClient } from "../../lib/authClient";
import { Can, CanAny } from "../../lib/permissions/components";
import { InboxButton, InboxFetchClient } from "../Inbox";
import { SyncStatusBadge } from "../SyncStatusBadge";

interface ExplorerAddressBarProps {
  view: ViewName;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  currentFolder: Folder | undefined;
  currentFolderId: string | null;
  slugPrefix: string;
  folderBreadcrumbs: Folder[];
  songBreadcrumbs: Folder[];
  currentSong: Song | undefined;
  currentSongFileName: string;
  currentService: Service | undefined;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectFolder: (id: string | null) => void;
  onNavigateBack: () => void;
  navigate: (path: string) => void;
  onOpenCreateSong: () => void;
  onOpenCifraImport: () => void;
  onOpenCreateService: () => void;
  onOpenCreateFolder: () => void;
}

export const ExplorerAddressBar: React.FC<ExplorerAddressBarProps> = ({
  view,
  isSidebarOpen,
  setIsSidebarOpen,
  currentFolder,
  currentFolderId,
  slugPrefix,
  folderBreadcrumbs,
  songBreadcrumbs,
  currentSong,
  currentSongFileName,
  currentService,
  searchQuery,
  onSearchChange,
  onSelectFolder,
  onNavigateBack,
  navigate,
  onOpenCreateSong,
  onOpenCifraImport,
  onOpenCreateService,
  onOpenCreateFolder,
}) => {
  const isDriveRoot = view === "explorer" && currentFolderId === null;
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  return (
    <div className="relative p-3 sm:p-4 bg-m3-sidebar/40 border-b border-m3-border/50 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
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
          onClick={onNavigateBack}
          disabled={isDriveRoot}
          title={
            view === "explorer"
              ? currentFolderId === null
                ? "No Nível Raiz"
                : currentFolder?.parentId
                  ? "Subir um nível"
                  : "Subir para a pasta Raiz"
              : "Voltar"
          }
          className={`p-2.5 rounded-2xl border transition-all ${
            isDriveRoot
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
              onSelectFolder(null);
              navigate(`${slugPrefix}/folders`);
            }}
            className={`flex items-center gap-2 font-black tracking-widest transition-all cursor-pointer shrink-0 ${
              isDriveRoot
                ? "text-m3-primary"
                : "text-m3-secondary hover:text-m3-text"
            }`}
          >
            <HardDrive
              className={`w-4 h-4 ${
                isDriveRoot ? "text-m3-primary" : "text-m3-secondary"
              }`}
            />
            <span>Início</span>
          </button>

          {view === "explorer" &&
            folderBreadcrumbs.map((folder, index) => {
              const isLast = index === folderBreadcrumbs.length - 1;
              return (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                  {isLast ? (
                    <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
                      <FolderOpen className="w-4 h-4" />
                      <span>{folder.name}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectFolder(folder.id)}
                      className="flex items-center gap-2 font-bold text-m3-secondary hover:text-m3-text transition-all cursor-pointer shrink-0"
                    >
                      <FolderIcon className="w-4 h-4 opacity-70" />
                      <span>{folder.name}</span>
                    </button>
                  )}
                </React.Fragment>
              );
            })}

          {view === "songs" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
              <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
                <Music className="w-4 h-4" />
                <span>Biblioteca</span>
              </div>
            </>
          )}

          {view === "song-editor" && (
            <>
              {songBreadcrumbs.map((folder) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
                  <button
                    onClick={() => {
                      onSelectFolder(folder.id);
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
                  <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
                    <FileText className="w-4 h-4" />
                    <span>{currentSongFileName}</span>
                  </div>
                </>
              )}
            </>
          )}

          {view === "services" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
              <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
                <Calendar className="w-4 h-4" />
                <span>Cultos</span>
              </div>
            </>
          )}

          {view === "service-editor" && (
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
                  <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
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
                      {new Date(currentService.date).toLocaleDateString(
                        "pt-PT",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {view === "settings" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
              <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
                <Settings className="w-4 h-4" />
                <span>Definições</span>
              </div>
            </>
          )}

          {view === "teams" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
              <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
                <Users className="w-4 h-4" />
                <span>Equipas</span>
              </div>
            </>
          )}

          {view === "trash" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-m3-secondary/40 shrink-0" />
              <div className="flex items-center gap-2 font-black text-m3-primary shrink-0 tracking-wide">
                <Users className="w-4 h-4" />
                <span>Lixeira</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search, Notifications & Plus Action */}
      <div className="flex items-center gap-3 w-full md:w-auto overflow-visible hide-scrollbar pb-1 md:pb-0 justify-end">
        {/* Search Input */}
        {(view === "explorer" || view === "songs" || view === "services") && (
          <div className="relative w-full sm:w-64">
            <Input
              placeholder={
                view === "services"
                  ? "Pesquisar cultos..."
                  : view === "songs"
                    ? "Pesquisar biblioteca..."
                    : "Pesquisar pastas..."
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onSearchChange("");
                }
              }}
              icon={<Search className="w-4 h-4 text-m3-secondary" />}
              className="py-2.5 text-sm pr-9 rounded-2xl"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
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
                      onOpenCreateSong();
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
                      onOpenCifraImport();
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
                      onOpenCreateService();
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
                      onOpenCreateFolder();
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
  );
};
