/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordProPreviewSettings } from "@/src/components/ChorproSettings";
import { usePreviewSettings } from "@/src/hooks/usePreviewSettings";
import {
  Button,
  ChordProRenderer,
  Input,
  parseChordPro,
  ServiceElement,
  songsApi,
  Spinner,
} from "@hosanna/shared";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  FileText,
  GripVertical,
  LayoutTemplate,
  Loader2,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import React, { useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSync } from "../../contexts/SyncContext";
import { useService, useServices } from "../../hooks/useServices";
import { useSong, useSongs } from "../../hooks/useSongs";
import { AnnouncementModal } from "./modals/Anouncement";
import { ScriptureModal } from "./modals/Bible";
import { CustomModal } from "./modals/Custom";
import { MessageModal } from "./modals/Message";
import { ReadingModal } from "./modals/Reading";
import { WelcomeModal } from "./modals/Welcome";

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

const getElementBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case "song":
      return { label: "Cântico", bg: "#e0f2fe", color: "#0284c7", icon: Music };
    case "welcome":
      return {
        label: "Boas-vindas",
        bg: "#EBF5FF",
        color: "#1D4ED8",
        icon: FileText,
      };
    case "scripture":
      return {
        label: "Escritura",
        bg: "#FDF4FF",
        color: "#C026D3",
        icon: BookOpen,
      };
    case "message":
      return {
        label: "Mensagem",
        bg: "#FEF3C7",
        color: "#D97706",
        icon: MessageSquare,
      };
    case "reading":
      return {
        label: "Leitura",
        bg: "#F3E8FF",
        color: "#7E22CE",
        icon: FileText,
      };
    case "announcement":
      return {
        label: "Avisos",
        bg: "#ECFDF5",
        color: "#059669",
        icon: Megaphone,
      };
    default:
      return {
        label: type || "Elemento",
        bg: "#F1F5F9",
        color: "#475569",
        icon: FileText,
      };
  }
};

function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = [...array];
  const [removed] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, removed);
  return newArray;
}

const SongPreview: React.FC<{ element: ServiceElement }> = ({ element }) => {
  const { data: song, isLoading } = useSong(element.songId || null);
  const { settings, updateSetting, resetSettings } = usePreviewSettings();
  const [showSettings, setShowSettings] = useState(false);
  const deferredContent = useDeferredValue(song?.content || "");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="md" />
      </div>
    );
  if (!song)
    return (
      <div className="flex items-center justify-center h-full text-sm text-rose-500 font-medium">
        Cântico não encontrado ou removido.
      </div>
    );

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-10 bg-m3-sidebar/50 border-b border-m3-border dark:border-m3-dark-border flex items-center justify-between px-3 shrink-0">
        <span className="text-[10px] font-semibold text-m3-secondary uppercase tracking-wider flex items-center gap-1.5">
          <LayoutTemplate className="w-3 h-3" /> Prévia Visual
        </span>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1 rounded transition-colors ${showSettings ? "bg-m3-primary/10 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"}`}
          title="Ajustes de Leitura"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {showSettings && (
        <ChordProPreviewSettings
          settings={settings}
          updateSetting={updateSetting}
          resetSettings={resetSettings}
        />
      )}

      <div
        className="flex-1 overflow-auto bg-m3-card relative custom-scrollbar p-2"
        onClick={() => showSettings && setShowSettings(false)}
      >
        <ChordProRenderer
          content={deferredContent}
          showChords={settings.showChords}
          transposeVal={settings.transposeVal}
          onTransposeChange={(val) => updateSetting("transposeVal", val)}
          fontSize={settings.fontSize}
          instrument={settings.instrument}
          showDiagrams={settings.showDiagrams}
          showYoutubePlayer={settings.showYoutubePlayer}
          onShowYoutubePlayerChange={(show) =>
            updateSetting("showYoutubePlayer", show)
          }
        />
      </div>
    </div>
  );
};

interface ServiceRowProps {
  element: ServiceElement;
  index: number;
  onRemove: (id: string) => void;
  onEdit: (el: ServiceElement) => void;
  onNoteChange: (id: string, note: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  draggedElementId: string | null;
}

const ServiceRow: React.FC<ServiceRowProps> = ({
  element,
  index,
  onRemove,
  onEdit,
  onNoteChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onDragEnd,
  isDragOver,
  draggedElementId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [localNote, setLocalNote] = useState(element.notes || "");
  useEffect(() => setLocalNote(element.notes || ""), [element.notes]);

  const isSong = element.type === "song";
  const badge = getElementBadge(element.type);
  const Icon = badge.icon;

  return (
    <div
      draggable
      onDragStart={(e) => {
        if (isExpanded || isEditingNote) e.preventDefault();
        else onDragStart(e, element.id);
      }}
      onDragOver={(e) => onDragOver(e, element.id)}
      onDrop={(e) => onDrop(e, element.id)}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-m3-card rounded-2xl border transition-all ${
        isDragOver
          ? "border-m3-primary border-t-4 shadow-lg scale-[1.01]"
          : "border-m3-border dark:border-m3-border/30 hover:border-m3-primary/30"
      } ${draggedElementId === element.id ? "opacity-50 scale-[0.98]" : "opacity-100"} flex flex-col`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 p-1"
          title="Arrastar"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <span className="text-xs font-semibold text-slate-400 w-4 shrink-0 text-center">
          {index + 1}
        </span>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div
          className="min-w-0 flex-1 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate text-m3-text">
              {element.title || "Elemento Sem Título"}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            {Number(element.duration || 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                <Clock3 className="w-3 h-3 inline mr-1" />{" "}
                {formatDuration(Number(element.duration || 0))}
              </span>
            )}
          </div>
          {element.passage && (
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {element.passage}
            </p>
          )}
          {element.content && !isSong && !isExpanded && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {element.content}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(isEditingNote || element.notes) && !isExpanded && (
            <div className="text-[10px] max-w-[140px] truncate italic px-2 py-1 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 mr-2">
              {element.notes}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-m3-dark-card rounded-xl shadow-lg border border-m3-border dark:border-m3-dark-border py-1">
                  {!isSong && (
                    <button
                      type="button"
                      onClick={() => {
                        onEdit(element);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-m3-text hover:bg-m3-hover cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNote(true);
                      setIsExpanded(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-m3-text hover:bg-m3-hover cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />{" "}
                    {element.notes ? "Editar Notas" : "Adicionar Notas"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRemove(element.id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-m3-border dark:border-m3-border/30 bg-m3-sidebar/10 dark:bg-black/10 rounded-b-2xl p-4 flex flex-col gap-4">
          {(isEditingNote || element.notes) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-m3-secondary uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" /> Notas do Elemento
              </label>
              {isEditingNote ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localNote}
                    onChange={(e) => setLocalNote(e.target.value)}
                    placeholder="Ex: Introdução ao piano..."
                    className="flex-1 text-xs rounded-lg border border-m3-border px-3 py-2 bg-white dark:bg-m3-card focus:outline-none focus:border-m3-primary text-m3-text"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onNoteChange(element.id, localNote);
                      setIsEditingNote(false);
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
                  {element.notes}
                </div>
              )}
            </div>
          )}

          {isSong ? (
            <div className="mt-2 h-[500px] border border-m3-border dark:border-m3-border/50 rounded-xl overflow-hidden shadow-inner bg-m3-card">
              <SongPreview element={element} />
            </div>
          ) : (
            <div className="mt-2 text-sm text-m3-text whitespace-pre-wrap bg-white dark:bg-m3-card p-4 rounded-xl border border-m3-border dark:border-m3-border/50">
              {element.content || "Sem conteúdo."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type ModalType =
  | "welcome"
  | "scripture"
  | "message"
  | "reading"
  | "announcement"
  | "custom"
  | null;

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading, isError } = useService(id || null);
  const { updateElements, updateService } = useServices();
  const { songsQuery } = useSongs({ limit: 1000 });
  const { showToast } = useSync();
  const queryClient = useQueryClient();

  const [elements, setElements] = useState<ServiceElement[]>([]);
  const elementsRef = useRef<ServiceElement[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [pendingSongIds, setPendingSongIds] = useState<Record<string, number>>(
    {},
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showLibrary, setShowLibrary] = useState(true);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOverElementId, setDragOverElementId] = useState<string | null>(
    null,
  );
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingElement, setEditingElement] = useState<ServiceElement | null>(
    null,
  );

  const [isEditingGeneralNotes, setIsEditingGeneralNotes] = useState(false);

  useEffect(() => {
    if (service) {
      setGeneralNotes(service.notes || "");
      const sortedElements = [...(service.elements || [])].sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );
      setElements(sortedElements);
      elementsRef.current = sortedElements;
    }
  }, [service]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" label="A carregar plano de culto..." />
      </div>
    );
  if (isError || !service)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
        <h2 className="text-lg font-bold text-m3-text">
          Plano de Culto Não Encontrado
        </h2>
        <Button
          variant="primary"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
      </div>
    );

  const allAvailableSongs = songsQuery.data?.songs || [];
  const songCountById = elements.reduce<Record<string, number>>((acc, el) => {
    if (el.type === "song" && el.songId)
      acc[el.songId] = (acc[el.songId] || 0) + 1;
    return acc;
  }, {});
  const totalDurationSeconds = elements.reduce(
    (acc, el) => acc + Math.max(0, Number(el.duration || 0)),
    0,
  );
  const filteredLibrarySongs = allAvailableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      (s.artist || "").toLowerCase().includes(librarySearch.toLowerCase()),
  );

  const syncElements = async (
    newElements: ServiceElement[],
    fallbackElements: ServiceElement[] = elementsRef.current,
  ) => {
    const updated = newElements.map((e, index) => ({ ...e, position: index }));
    setElements(updated);
    try {
      await updateElements({
        serviceId: service.id,
        data: { elements: updated, updatedAt: service.updatedAt },
      });
    } catch (error) {
      setElements(fallbackElements);
      elementsRef.current = fallbackElements;
      throw error;
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedElementId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedElementId === id) return;
    if (dragOverElementId !== id) setDragOverElementId(id);
  };

  const handleDragLeave = () => setDragOverElementId(null);

  const handleDragEnd = () => {
    setDraggedElementId(null);
    setDragOverElementId(null);
    setIsDropTargetActive(false);
  };

  const handleDrop = async (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const songId = e.dataTransfer.getData("text/x-song-id");
    const draggedId = e.dataTransfer.getData("text/plain");

    if (songId) {
      await handleAddSongToService(songId, targetId);
    } else if (draggedId && targetId && draggedId !== targetId) {
      const oldIndex = elements.findIndex((el) => el.id === draggedId);
      const newIndex = elements.findIndex((el) => el.id === targetId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = arrayMove(elements, oldIndex, newIndex);
        await syncElements(updated);
      }
    }
    handleDragEnd();
  };

  const handleRemoveElement = async (elementId: string) => {
    await syncElements(elements.filter((e) => e.id !== elementId));
  };

  const handleNoteChange = async (elementId: string, note: string) => {
    await syncElements(
      elements.map((e) => (e.id === elementId ? { ...e, notes: note } : e)),
    );
  };

  const handleSaveGeneralNotes = async () => {
    await updateService({
      id: service.id,
      data: { notes: generalNotes, updatedAt: service.updatedAt },
    });
  };

  const handleAddSongToService = async (
    songId: string,
    insertBeforeElementId?: string,
  ) => {
    setPendingSongIds((prev) => ({
      ...prev,
      [songId]: (prev[songId] || 0) + 1,
    }));
    const previousElements = [...elementsRef.current];
    try {
      const song = await queryClient.fetchQuery({
        queryKey: ["song", songId],
        queryFn: () => songsApi.getSongById(songId),
      });

      const parsed = parseChordPro(song?.content || "");
      const newElem: ServiceElement = {
        id: crypto.randomUUID(),
        type: "song",
        title: song?.title || "Cântico Desconhecido",
        songId,
        content: song?.artist || "Sem Compositor",
        position: previousElements.length,
        duration: Number(parsed.metadata.duration || "0"),
      };

      const nextElements = [...previousElements];
      if (insertBeforeElementId) {
        const idx = nextElements.findIndex(
          (e) => e.id === insertBeforeElementId,
        );
        if (idx !== -1) nextElements.splice(idx, 0, newElem);
        else nextElements.push(newElem);
      } else {
        nextElements.push(newElem);
      }
      await syncElements(nextElements, previousElements);
    } catch {
      showToast("Falha ao carregar cântico", "error");
    } finally {
      setPendingSongIds((prev) => {
        const next = { ...prev };
        if ((next[songId] || 0) > 1) next[songId] -= 1;
        else delete next[songId];
        return next;
      });
    }
  };

  const openAddModal = (type: ModalType) => {
    setEditingElement(null);
    setActiveModal(type);
  };
  const openEditModal = (element: ServiceElement) => {
    setEditingElement(element);
    const knownTypes: ModalType[] = [
      "welcome",
      "scripture",
      "message",
      "reading",
      "announcement",
      "custom",
    ];
    setActiveModal(
      knownTypes.includes(element.type as ModalType)
        ? (element.type as ModalType)
        : "custom",
    );
  };

  const handleModalSave = async (
    type: string,
    data: {
      title: string;
      content?: string;
      passage?: string;
      notes?: string;
      duration?: number;
    },
  ) => {
    let nextElements = [...elements];
    if (editingElement) {
      nextElements = nextElements.map((e) =>
        e.id === editingElement.id
          ? {
              ...e,
              title: data.title,
              content: data.content || "",
              passage: data.passage || "",
              notes: data.notes || "",
              duration: data.duration ?? Number(e.duration || 0),
            }
          : e,
      );
    } else {
      nextElements.push({
        id: crypto.randomUUID(),
        type,
        title: data.title,
        content: data.content || "",
        passage: data.passage || "",
        notes: data.notes || "",
        position: elements.length,
        duration: data.duration || 0,
      });
    }
    await syncElements(nextElements);
    setActiveModal(null);
    setEditingElement(null);
  };

  const editInitial = editingElement
    ? {
        title: editingElement.title,
        content: editingElement.content || "",
        passage: editingElement.passage || "",
        notes: editingElement.notes || "",
        duration: Number(editingElement.duration || 0),
      }
    : undefined;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-m3-sidebar/10">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="h-14 bg-m3-sidebar border-b border-m3-border flex items-center justify-between px-4 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-1 -ml-2"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4 text-m3-secondary" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-m3-text flex items-center gap-2">
              {service.name}
            </h1>
            <p className="text-[10px] text-m3-secondary">Plano de Culto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLibrary(!showLibrary)}
            icon={
              showLibrary ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )
            }
          >
            <span className="hidden sm:inline">
              {showLibrary ? "Esconder Biblioteca" : "Ver Biblioteca"}
            </span>
          </Button>
        </div>
      </div>

      {/* ── Split Layout ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Library Sidebar */}
        <div
          className={`transition-all duration-300 flex flex-col border-r border-m3-border bg-m3-sidebar/30 ${showLibrary ? "w-full md:w-80 lg:w-96 translate-x-0" : "w-0 -translate-x-full border-none opacity-0 overflow-hidden"}`}
        >
          <div className="p-4 border-b border-m3-border bg-m3-card shrink-0">
            <h2 className="text-sm font-bold text-m3-text mb-3">
              Biblioteca de Cânticos
            </h2>
            <Input
              ref={searchInputRef}
              placeholder="Pesquisar cânticos..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-m3-secondary" />}
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-3 space-y-2">
            {filteredLibrarySongs.length === 0 ? (
              <div className="p-6 text-center text-xs text-m3-secondary">
                Nenhum cântico encontrado.
              </div>
            ) : (
              filteredLibrarySongs.map((s) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/x-song-id", s.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-m3-card hover:bg-m3-hover rounded-xl border border-m3-border/50 cursor-grab active:cursor-grabbing transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-m3-text">
                      {s.title}
                    </p>
                    <p className="text-xs text-m3-secondary truncate">
                      {s.artist || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(songCountById[s.id] || 0) > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Na Lista ×{songCountById[s.id]}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddSongToService(s.id)}
                      disabled={Boolean(pendingSongIds[s.id])}
                      className="p-1.5 rounded-lg bg-m3-primary/10 text-m3-primary hover:bg-m3-primary/20 disabled:opacity-50 transition-colors"
                    >
                      {pendingSongIds[s.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-m3-background relative p-4 lg:p-6">
          <div className="max-w-5xl w-full mx-auto flex flex-col h-full">
            {/* Elements Container */}
            <div className="flex-1 flex flex-col bg-m3-card rounded-3xl border border-m3-border shadow-sm overflow-hidden min-h-0">
              <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-m3-border shrink-0 bg-m3-sidebar/30 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-m3-text">
                    Ordem do Culto
                  </h2>
                  <span className="text-xs font-semibold text-m3-secondary bg-m3-background px-2.5 py-1 rounded-full border border-m3-border/50 shadow-sm">
                    Duração Total: {formatDuration(totalDurationSeconds)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openAddModal("welcome")}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    + Boas-vindas
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal("scripture")}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 transition-colors"
                  >
                    + Escritura
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal("reading")}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    + Leitura
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal("message")}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    + Mensagem
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal("announcement")}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    + Avisos
                  </button>
                </div>
              </div>

              {/* General Notes Inline */}
              <div className="px-5 py-2.5 border-b border-m3-border/40 shrink-0 bg-m3-background/30 flex flex-col justify-center min-h-[44px]">
                {isEditingGeneralNotes ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      rows={1}
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      placeholder="Ex: Horário do ensaio: 8:30..."
                      className="flex-1 text-xs rounded-lg border border-m3-border p-2 bg-white dark:bg-m3-card focus:outline-none focus:ring-1 focus:ring-m3-primary text-m3-text resize-y min-h-[36px]"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setGeneralNotes(service?.notes || "");
                        setIsEditingGeneralNotes(false);
                      }}
                      className="h-9 text-xs shrink-0"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        await handleSaveGeneralNotes();
                        setIsEditingGeneralNotes(false);
                      }}
                      className="h-9 text-xs shrink-0"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" /> Guardar
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between gap-4 group cursor-pointer"
                    onClick={() => setIsEditingGeneralNotes(true)}
                  >
                    <div className="text-xs flex items-center gap-2 flex-1">
                      <FileText className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
                      {generalNotes ? (
                        <span className="text-m3-text line-clamp-1 group-hover:line-clamp-none transition-all">
                          {generalNotes}
                        </span>
                      ) : (
                        <span className="italic text-m3-secondary/70">
                          Sem notas gerais do culto. Clique para adicionar
                          informações úteis.
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-m3-secondary hover:text-m3-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-m3-primary/10 shrink-0"
                      title="Editar Notas Gerais"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative custom-scrollbar transition-colors ${isDropTargetActive ? "bg-m3-primary/5" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.types.includes("text/x-song-id"))
                    setIsDropTargetActive(true);
                }}
                onDragLeave={() => setIsDropTargetActive(false)}
                onDrop={(e) => {
                  if (e.dataTransfer.types.includes("text/x-song-id"))
                    handleDrop(e);
                  setIsDropTargetActive(false);
                }}
              >
                {elements.length === 0 ? (
                  <div className="m-auto text-center rounded-2xl border border-dashed border-m3-border flex flex-col items-center justify-center p-12 shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-m3-primary/10 text-m3-primary mb-3">
                      <Music className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-m3-text">
                      O plano ainda está vazio
                    </h4>
                    <p className="text-xs text-m3-secondary mt-1 max-w-[200px]">
                      Arraste cânticos da biblioteca ou adicione elementos
                      acima.
                    </p>
                  </div>
                ) : (
                  <>
                    {elements.map((el, i) => (
                      <ServiceRow
                        key={el.id}
                        element={el}
                        index={i}
                        onRemove={handleRemoveElement}
                        onEdit={openEditModal}
                        onNoteChange={handleNoteChange}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        isDragOver={dragOverElementId === el.id}
                        draggedElementId={draggedElementId}
                      />
                    ))}
                  </>
                )}

                <div className="flex gap-3 mt-auto pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => searchInputRef.current?.focus()}
                    className="flex-1 py-3 rounded-2xl border border-dashed border-m3-primary/30 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-m3-primary/5 text-m3-primary bg-m3-card shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Cântico
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal("custom")}
                    className="flex-1 py-3 rounded-2xl border border-dashed border-m3-border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-m3-sidebar text-m3-secondary bg-m3-card shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Personalizado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WelcomeModal
        isOpen={activeModal === "welcome"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("welcome", data)}
        initial={editInitial}
      />
      <ScriptureModal
        isOpen={activeModal === "scripture"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("scripture", data)}
        initial={editInitial}
      />
      <MessageModal
        isOpen={activeModal === "message"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("message", data)}
        initial={editInitial}
      />
      <ReadingModal
        isOpen={activeModal === "reading"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("reading", data)}
        initial={editInitial}
      />
      <AnnouncementModal
        isOpen={activeModal === "announcement"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("announcement", data)}
        initial={editInitial}
      />
      <CustomModal
        isOpen={activeModal === "custom"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("custom", data)}
        initial={editInitial}
      />
    </div>
  );
};
