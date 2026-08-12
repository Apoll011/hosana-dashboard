/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
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
  Clock3,
  Edit3,
  FileText,
  GripVertical,
  Loader2,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Music,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSync } from "../../contexts/SyncContext";
import { useService, useServices } from "../../hooks/useServices";
import { useSongs } from "../../hooks/useSongs";
import { AnnouncementModal } from "./modals/Anouncement";
import { ScriptureModal } from "./modals/Bible";
import { CustomModal } from "./modals/Custom";
import { MessageModal } from "./modals/Message";
import { ReadingModal } from "./modals/Reading";
import { WelcomeModal } from "./modals/Welcome";

const gold = "#0284c7";
const goldSoft = "#e0f2fe";
const cream = "#f8fafc";
const border = "#cbd5e1";
const navy = "#1d1b20";

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

// ── Element badge helper ──────────────────────────────────────────────
const getElementBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case "song":
      return { label: "Cântico", bg: goldSoft, color: gold, icon: Music };
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

// ══════════════════════════════════════════════════════════════════════
// ── SortableRow component ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface SortableRowProps {
  id: string;
  element: ServiceElement;
  index: number;
  onRemove: (elementId: string) => void;
  onEdit: (element: ServiceElement) => void;
  onNoteChange: (elementId: string, note: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
  id,
  element,
  index,
  onRemove,
  onEdit,
  onNoteChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [localNote, setLocalNote] = useState(element.notes || "");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setLocalNote(element.notes || ""), [element.notes]);

  const isSong = element.type === "song";
  const badge = getElementBadge(element.type);
  const Icon = badge.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: isDragging ? gold : border }}
      className={`bg-white rounded-2xl border transition-shadow ${
        isDragging ? "shadow-lg z-20 opacity-90" : "shadow-none"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
          title="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold text-slate-400 w-4 shrink-0 text-center">
          {index + 1}
        </span>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: navy }}
            >
              {element.title || "Elemento Sem Título"}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            {Number(element.duration || 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                <Clock3 className="w-3 h-3 inline mr-1" />
                {formatDuration(Number(element.duration || 0))}
              </span>
            )}
          </div>
          <>
            {element.passage && (
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {element.passage}
              </p>
            )}
            {element.content && (
              <p className="text-xs text-slate-500 line-clamp-3 mt-0.5">
                {element.content}
              </p>
            )}
          </>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 text-slate-300 hover:text-slate-500 rounded-lg cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border py-1"
                style={{ borderColor: border }}
              >
                {!isSong && (
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(element);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNote(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {element.notes ? "Editar Notas" : "Adicionar Notas"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(element.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {(isEditingNote || element.notes) && (
        <div className="px-4 pb-3">
          {isEditingNote ? (
            <div
              className="flex items-center gap-2 pt-2 border-t"
              style={{ borderColor: border }}
            >
              <input
                type="text"
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder="Ex: Introdução ao piano, repetir refrão 2x..."
                className="flex-1 text-xs rounded-lg border px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: border, boxShadow: "none" }}
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
            <div
              className="text-xs italic px-2.5 py-2 rounded-xl border"
              style={{
                backgroundColor: goldSoft,
                color: "#8A6A1F",
                borderColor: "#E9D9AE",
              }}
            >
              {element.notes}
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
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingElement, setEditingElement] = useState<ServiceElement | null>(
    null,
  );

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" label="A carregar plano de culto..." />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
        <h2 className="text-lg font-bold" style={{ color: navy }}>
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
  }

  const allAvailableSongs = songsQuery.data?.songs || [];
  const songCountById = elements.reduce<Record<string, number>>((acc, el) => {
    if (el.type === "song" && el.songId) {
      acc[el.songId] = (acc[el.songId] || 0) + 1;
    }
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((item) => item.id === active.id);
      const newIndex = elements.findIndex((item) => item.id === over.id);
      const updated = arrayMove(elements, oldIndex, newIndex);
      await syncElements(updated);
    }
  };

  const handleRemoveElement = async (elementId: string) => {
    const nextElements = elements.filter((e) => e.id !== elementId);
    await syncElements(nextElements);
  };

  const handleNoteChange = async (elementId: string, note: string) => {
    const nextElements = elements.map((e) =>
      e.id === elementId ? { ...e, notes: note } : e,
    );
    await syncElements(nextElements);
  };

  const handleSaveGeneralNotes = async () => {
    await updateService({
      id: service.id,
      data: { notes: generalNotes, updatedAt: service.updatedAt },
    });
  };

  const handleAddSongToService = async (songId: string) => {
    setPendingSongIds((prev) => ({
      ...prev,
      [songId]: (prev[songId] || 0) + 1,
    }));
    const previousElements = [...elementsRef.current];
    try {
      let song: Awaited<ReturnType<typeof songsApi.getSongById>> | null = null;
      try {
        song = await queryClient.fetchQuery({
          queryKey: ["song", songId],
          queryFn: () => songsApi.getSongById(songId),
        });
      } catch {
        showToast("Falha ao carregar cântico", "error");
        return;
      }

      const parsed = parseChordPro(song?.content || "");
      const liveElements = [...elementsRef.current];
      const newElem: ServiceElement = {
        id: crypto.randomUUID(),
        type: "song",
        title: song?.title || "Cântico Desconhecido",
        songId,
        content: song?.artist || "Sem Compositor",
        position: liveElements.length,
        duration: Number(parsed.metadata.duration || "0"),
      };

      await syncElements([...liveElements, newElem], previousElements);
    } catch {
      // updateElements mutation already reports toast errors.
    } finally {
      setPendingSongIds((prev) => {
        const count = (prev[songId] || 0) - 1;
        if (count <= 0) {
          const next = { ...prev };
          delete next[songId];
          return next;
        }
        return { ...prev, [songId]: count };
      });
    }
  };

  // ── Modal openers ────────────────────────────────────────────────
  const openAddModal = (type: ModalType) => {
    setEditingElement(null);
    setActiveModal(type);
  };

  const openEditModal = (element: ServiceElement) => {
    setEditingElement(element);
    const t = element.type as ModalType;
    // Map known types to their modals; unknown types go to custom
    const knownTypes: ModalType[] = [
      "welcome",
      "scripture",
      "message",
      "reading",
      "announcement",
      "custom",
    ];
    setActiveModal(knownTypes.includes(t) ? t : "custom");
  };

  // ── Generic save handler ────────────────────────────────────────
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
      const newElem: ServiceElement = {
        id: crypto.randomUUID(),
        type,
        title: data.title,
        content: data.content || "",
        passage: data.passage || "",
        notes: data.notes || "",
        position: elements.length,
        duration: data.duration || 0,
      };
      nextElements.push(newElem);
    }

    await syncElements(nextElements);
    setActiveModal(null);
    setEditingElement(null);
  };

  // ── Initial data for editing ────────────────────────────────────
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
    <div
      className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col"
      style={{ backgroundColor: cream }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: navy }}
          >
            {service.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Arraste os elementos e cânticos para reordenar o culto.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] gap-6 h-full min-h-0">
        <div className="flex flex-col gap-4 h-full min-h-0">
          <div
            className="bg-white rounded-2xl border p-4 space-y-2 shrink-0"
            style={{ borderColor: border }}
          >
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-bold flex items-center gap-1.5"
                style={{ color: navy }}
              >
                <FileText className="w-4 h-4" style={{ color: gold }} />
                Notas Gerais do Culto
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveGeneralNotes}
              >
                <Save className="w-3.5 h-3.5" style={{ color: gold }} />
                Guardar
              </Button>
            </div>
            <textarea
              rows={4}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Horário do ensaio: 8:30. Mensagem do pastor: A Caminhar pela Fé."
              className="w-full text-xs rounded-xl border p-3 bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: border }}
            />
          </div>

          <div
            className="bg-white rounded-3xl border shadow-sm flex flex-col h-full min-h-0"
            style={{ borderColor: border }}
          >
            <div
              className="p-5 pb-4 border-b shrink-0"
              style={{ borderColor: border }}
            >
              <h2 className="text-base font-bold mb-3" style={{ color: navy }}>
                Biblioteca de Cânticos
              </h2>
              <Input
                ref={
                  searchInputRef as unknown as React.RefObject<HTMLInputElement>
                }
                placeholder="Pesquisar cânticos..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div
              className="overflow-y-auto flex-1 min-h-0 divide-y"
              style={{ borderColor: border }}
            >
              {filteredLibrarySongs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhum cântico encontrado.
                </div>
              ) : (
                filteredLibrarySongs.map((s) => {
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/x-song-id", s.id);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: navy }}
                        >
                          {s.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {s.artist || "—"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(songCountById[s.id] || 0) > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: "#EAF6EE",
                              color: "#2E8B4F",
                            }}
                          >
                            Na Lista ×{songCountById[s.id]}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddSongToService(s.id)}
                          disabled={Boolean(pendingSongIds[s.id])}
                          className="p-1.5 rounded-lg shrink-0 cursor-pointer transition-colors hover:bg-sky-200 disabled:cursor-wait disabled:opacity-70"
                          style={{ backgroundColor: goldSoft, color: gold }}
                          title="Adicionar ao plano"
                        >
                          {pendingSongIds[s.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-3xl border shadow-sm flex flex-col flex-1 min-h-0"
          style={{ borderColor: border }}
        >
          <div
            className="flex flex-wrap items-center justify-between px-5 py-4 border-b gap-2 shrink-0"
            style={{ borderColor: border }}
          >
            <h2 className="text-base font-bold" style={{ color: navy }}>
              Plano do Culto
              <span className="ml-2 text-xs font-medium text-slate-400">
                ({elements.length} {elements.length === 1 ? "item" : "itens"})
              </span>
            </h2>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Duração Total: {formatDuration(totalDurationSeconds)}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openAddModal("welcome")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors"
              >
                + Boas-vindas
              </button>
              <button
                type="button"
                onClick={() => openAddModal("scripture")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 cursor-pointer transition-colors"
              >
                + Escritura
              </button>
              <button
                type="button"
                onClick={() => openAddModal("reading")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer transition-colors"
              >
                + Leitura Responsiva
              </button>
              <button
                type="button"
                onClick={() => openAddModal("message")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer transition-colors"
              >
                + Mensagem
              </button>
              <button
                type="button"
                onClick={() => openAddModal("announcement")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer transition-colors"
              >
                + Avisos
              </button>
            </div>
          </div>

          <div
            className={`p-4 flex-1 overflow-y-auto min-h-0 flex flex-col rounded-b-3xl transition-colors ${
              isDropTargetActive ? "bg-sky-50/60" : "bg-transparent"
            }`}
            onDragOver={(event) => {
              if (event.dataTransfer.types.includes("text/x-song-id")) {
                event.preventDefault();
                setIsDropTargetActive(true);
              }
            }}
            onDragLeave={() => setIsDropTargetActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDropTargetActive(false);
              const draggedSongId =
                event.dataTransfer.getData("text/x-song-id");
              if (draggedSongId) {
                void handleAddSongToService(draggedSongId);
              }
            }}
          >
            {elements.length === 0 ? (
              <div
                className="p-8 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 shrink-0"
                style={{ borderColor: border }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: goldSoft, color: gold }}
                >
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: navy }}>
                    O plano ainda está vazio
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Arraste cânticos da biblioteca para adicionar.
                  </p>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={elements.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2.5">
                    {elements.map((element, index) => {
                      return (
                        <SortableRow
                          key={element.id}
                          id={element.id}
                          element={element}
                          index={index}
                          onRemove={handleRemoveElement}
                          onEdit={openEditModal}
                          onNoteChange={handleNoteChange}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div className="flex gap-2 mt-auto pt-3 shrink-0">
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                className="flex-1 py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50"
                style={{ borderColor: border, color: gold }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Cântico
              </button>
              <button
                type="button"
                onClick={() => openAddModal("custom")}
                className="flex-1 py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 text-slate-600"
                style={{ borderColor: border }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Outro/Personalizado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Specialized Modals ────────────────────────────────────── */}

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
