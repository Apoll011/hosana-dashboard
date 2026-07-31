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
import { Button, Input, ServiceElement, Song, Spinner } from "@hosanna/shared";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Edit3,
  FileText,
  GripVertical,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Music,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useService, useServices } from "../../hooks/useServices";
import { useSongs } from "../../hooks/useSongs";

const gold = "#0284c7";
const goldSoft = "#e0f2fe";
const cream = "#f8fafc";
const border = "#cbd5e1";
const navy = "#1d1b20";

interface SortableRowProps {
  id: string;
  element: ServiceElement;
  song?: Song;
  index: number;
  onRemove: (elementId: string) => void;
  onEdit: (element: ServiceElement) => void;
  onNoteChange: (elementId: string, note: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
  id,
  element,
  song,
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
              {isSong
                ? song
                  ? song.title
                  : "Cântico Desconhecido"
                : element.title || "Elemento Sem Título"}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
          {isSong ? (
            <p className="text-xs text-slate-400 truncate">
              {song ? song.artist || "—" : "—"}
            </p>
          ) : (
            <>
              {element.passage && (
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {element.passage}
                </p>
              )}
              {element.content && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {element.content}
                </p>
              )}
            </>
          )}
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

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading, isError } = useService(id || null);
  const { updateElements, updateService } = useServices();
  const { songsQuery } = useSongs({ limit: 200 });

  const [elements, setElements] = useState<ServiceElement[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Element modal states
  const [editingElement, setEditingElement] = useState<ServiceElement | null>(
    null,
  );
  const [isElementModalOpen, setIsElementModalOpen] = useState(false);
  const [elementForm, setElementForm] = useState<{
    id?: string;
    type: string;
    title: string;
    content: string;
    passage: string;
    notes: string;
  }>({
    type: "welcome",
    title: "",
    content: "",
    passage: "",
    notes: "",
  });

  useEffect(() => {
    if (service) {
      setGeneralNotes(service.notes || "");
      const sortedElements = [...(service.elements || [])].sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );
      setElements(sortedElements);
    }
  }, [service]);

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
  const addedSongIds = new Set(
    elements.filter((e) => e.type === "song").map((e) => e.songId),
  );

  const filteredLibrarySongs = allAvailableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      (s.artist || "").toLowerCase().includes(librarySearch.toLowerCase()),
  );

  const syncElements = async (newElements: ServiceElement[]) => {
    const updated = newElements.map((e, index) => ({ ...e, position: index }));
    setElements(updated);
    await updateElements({
      serviceId: service.id,
      data: { elements: updated, updatedAt: service.updatedAt },
    });
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
      data: { notes: generalNotes },
    });
  };

  const handleAddSongToService = async (songId: string) => {
    const newElem: ServiceElement = {
      id: crypto.randomUUID(),
      type: "song",
      title: "Cântico",
      songId: songId,
      position: elements.length,
    };
    await syncElements([...elements, newElem]);
  };

  const openAddElementModal = (presetType: string = "welcome") => {
    const titles: Record<string, string> = {
      welcome: "Boas-vindas & Oração Inicial",
      scripture: "Leitura Bíblica",
      message: "Mensagem / Sermão",
      reading: "Leitura Responsiva",
      announcement: "Avisos da Igreja",
      custom: "Novo Elemento",
    };
    setElementForm({
      type: presetType,
      title: titles[presetType] || "Novo Elemento",
      content: "",
      passage: "",
      notes: "",
    });
    setEditingElement(null);
    setIsElementModalOpen(true);
  };

  const openEditElementModal = (element: ServiceElement) => {
    setEditingElement(element);
    setElementForm({
      id: element.id,
      type: element.type,
      title: element.title,
      content: element.content || "",
      passage: element.passage || "",
      notes: element.notes || "",
    });
    setIsElementModalOpen(true);
  };

  const handleSaveElement = async () => {
    if (!elementForm.title.trim()) return;

    let nextElements = [...elements];
    if (editingElement) {
      nextElements = nextElements.map((e) =>
        e.id === editingElement.id
          ? {
              ...e,
              type: elementForm.type,
              title: elementForm.title,
              content: elementForm.content,
              passage: elementForm.passage,
              notes: elementForm.notes,
            }
          : e,
      );
    } else {
      const newElem: ServiceElement = {
        id: crypto.randomUUID(),
        type: elementForm.type,
        title: elementForm.title,
        content: elementForm.content,
        passage: elementForm.passage,
        notes: elementForm.notes,
        position: elements.length,
      };
      nextElements.push(newElem);
    }

    await syncElements(nextElements);
    setIsElementModalOpen(false);
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 h-full min-h-0">
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
              ref={searchInputRef as any}
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
                const isAdded = addedSongIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
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

                    {isAdded ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: "#EAF6EE", color: "#2E8B4F" }}
                      >
                        <Check className="w-3 h-3" />
                        Na Lista
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddSongToService(s.id)}
                        className="p-1.5 rounded-lg shrink-0 cursor-pointer transition-colors hover:bg-sky-200"
                        style={{ backgroundColor: goldSoft, color: gold }}
                        title="Adicionar ao plano"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

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
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Horário do ensaio: 8:30. Mensagem do pastor: A Caminhar pela Fé."
              className="w-full text-xs rounded-xl border p-3 bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: border }}
            />
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

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openAddElementModal("welcome")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  + Boas-vindas
                </button>
                <button
                  type="button"
                  onClick={() => openAddElementModal("scripture")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 cursor-pointer transition-colors"
                >
                  + Escritura
                </button>
                <button
                  type="button"
                  onClick={() => openAddElementModal("message")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer transition-colors"
                >
                  + Mensagem
                </button>
                <button
                  type="button"
                  onClick={() => openAddElementModal("announcement")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer transition-colors"
                >
                  + Avisos
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col">
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
                        const songObj =
                          element.type === "song"
                            ? allAvailableSongs.find(
                                (s) => s.id === element.songId,
                              )
                            : undefined;
                        return (
                          <SortableRow
                            key={element.id}
                            id={element.id}
                            element={element}
                            song={songObj}
                            index={index}
                            onRemove={handleRemoveElement}
                            onEdit={openEditElementModal}
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
                  onClick={() => openAddElementModal("custom")}
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
      </div>

      {/* Add / Edit Element Modal */}
      {isElementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4"
            style={{ borderColor: border }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: border }}
            >
              <h3 className="text-base font-bold" style={{ color: navy }}>
                {editingElement
                  ? "Editar Elemento de Culto"
                  : "Novo Elemento de Culto"}
              </h3>
              <button
                onClick={() => setIsElementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Tipo de Elemento
                </label>
                <select
                  value={elementForm.type}
                  onChange={(e) =>
                    setElementForm({ ...elementForm, type: e.target.value })
                  }
                  className="w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2"
                  style={{ borderColor: border }}
                >
                  <option value="welcome">Boas-vindas / Oração</option>
                  <option value="scripture">Leitura Bíblica</option>
                  <option value="message">Mensagem / Sermão</option>
                  <option value="reading">Leitura Responsiva</option>
                  <option value="announcement">Avisos</option>
                  <option value="custom">Outro / Personalizado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={elementForm.title}
                  onChange={(e) =>
                    setElementForm({ ...elementForm, title: e.target.value })
                  }
                  placeholder="Ex: Leitura de Salmos 23"
                  className="w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2"
                  style={{ borderColor: border }}
                />
              </div>

              {elementForm.type === "scripture" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Passagem Bíblica
                  </label>
                  <input
                    type="text"
                    value={elementForm.passage}
                    onChange={(e) =>
                      setElementForm({
                        ...elementForm,
                        passage: e.target.value,
                      })
                    }
                    placeholder="Ex: Salmos 23:1-6"
                    className="w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2"
                    style={{ borderColor: border }}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Detalhes / Conteúdo (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={elementForm.content}
                  onChange={(e) =>
                    setElementForm({ ...elementForm, content: e.target.value })
                  }
                  placeholder="Ex: O Senhor é o meu pastor, nada me faltará..."
                  className="w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2"
                  style={{ borderColor: border }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={elementForm.notes}
                  onChange={(e) =>
                    setElementForm({ ...elementForm, notes: e.target.value })
                  }
                  placeholder="Ex: Começar com música suave..."
                  className="w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2"
                  style={{ borderColor: border }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsElementModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveElement}>
                Guardar Elemento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
