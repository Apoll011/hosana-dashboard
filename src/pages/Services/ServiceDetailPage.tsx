/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService, useServices } from '../../hooks/useServices';
import { useSongs } from '../../hooks/useSongs';
import { Service, Song, ServiceElement } from '../../types';
import {
  Calendar, ArrowLeft, Plus, GripVertical, Trash2, Edit3, Save, Music,
  FileText, Search, Check, MoreHorizontal, BookOpen, MessageSquare, Megaphone, HelpCircle, X
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';

const gold = '#0284c7';
const goldSoft = '#e0f2fe';
const cream = '#f8fafc';
const border = '#cbd5e1';
const navy = '#1d1b20';

export interface UnifiedPlanItem {
  id: string; // "song-{songId}" or "elem-{elementId}"
  kind: 'song' | 'element';
  songId?: string;
  element?: ServiceElement;
  position: number;
}

interface SortableSongRowProps {
  id: string;
  song: Song | undefined;
  note: string;
  index: number;
  onRemove: (songId: string) => void;
  onNoteChange: (songId: string, note: string) => void;
}

const SortableSongRow: React.FC<SortableSongRowProps> = ({
  id,
  song,
  note,
  index,
  onRemove,
  onNoteChange,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [localNote, setLocalNote] = useState(note);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setLocalNote(note), [note]);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: isDragging ? gold : border }}
      className={`bg-white rounded-2xl border transition-shadow ${
        isDragging ? 'shadow-lg z-20 opacity-90' : 'shadow-none'
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
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: goldSoft, color: gold }}
        >
          <Music className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: navy }}>
            {song ? song.title : 'Cântico Desconhecido'}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {song ? song.artist || '—' : '—'}
          </p>
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
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border py-1"
                style={{ borderColor: border }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNote(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {note ? 'Editar Nota' : 'Adicionar Nota'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(id.replace('song-', ''));
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

      {(isEditingNote || note) && (
        <div className="px-4 pb-3">
          {isEditingNote ? (
            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: border }}>
              <input
                type="text"
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder="Ex: Introdução ao piano, repetir refrão 2x..."
                className="flex-1 text-xs rounded-lg border px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: border, boxShadow: 'none' }}
                autoFocus
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onNoteChange(id.replace('song-', ''), localNote);
                  setIsEditingNote(false);
                }}
              >
                <Save className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div
              className="text-xs italic px-2.5 py-2 rounded-xl border"
              style={{ backgroundColor: goldSoft, color: '#8A6A1F', borderColor: '#E9D9AE' }}
            >
              {note}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SortableElementRowProps {
  id: string;
  element: ServiceElement;
  index: number;
  onRemove: (elementId: string) => void;
  onEdit: (element: ServiceElement) => void;
}

const SortableElementRow: React.FC<SortableElementRowProps> = ({
  id,
  element,
  index,
  onRemove,
  onEdit,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const getElementBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'welcome':
        return { label: 'Boas-vindas', bg: '#EBF5FF', color: '#1D4ED8' };
      case 'scripture':
        return { label: 'Escritura', bg: '#FDF4FF', color: '#C026D3' };
      case 'message':
        return { label: 'Mensagem', bg: '#FEF3C7', color: '#D97706' };
      case 'reading':
        return { label: 'Leitura', bg: '#F3E8FF', color: '#7E22CE' };
      case 'announcement':
        return { label: 'Avisos', bg: '#ECFDF5', color: '#059669' };
      default:
        return { label: type || 'Elemento', bg: '#F1F5F9', color: '#475569' };
    }
  };

  const badge = getElementBadge(element.type);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: isDragging ? gold : border }}
      className={`bg-white rounded-2xl border transition-shadow ${
        isDragging ? 'shadow-lg z-20 opacity-90' : 'shadow-none'
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
          <FileText className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: navy }}>
              {element.title || 'Elemento Sem Título'}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
          {element.content && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{element.content}</p>
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
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border py-1"
                style={{ borderColor: border }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onEdit(element);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar Elemento
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
    </div>
  );
};

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading, isError } = useService(id || null);
  const { addSong, removeSong, updateNotes, updateSongNotes, reorderSongs, updateElements } = useServices();
  const { songsQuery } = useSongs({ limit: 200 });

  const [unifiedItems, setUnifiedItems] = useState<UnifiedPlanItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Element modal states
  const [editingElement, setEditingElement] = useState<ServiceElement | null>(null);
  const [isElementModalOpen, setIsElementModalOpen] = useState(false);
  const [elementForm, setElementForm] = useState<{ id?: string; type: string; title: string; content: string }>({
    type: 'welcome',
    title: '',
    content: '',
  });

  useEffect(() => {
    if (service) {
      setGeneralNotes(service.notes || '');
      
      const songsList: UnifiedPlanItem[] = (service.songs || []).map((s, idx) => ({
        id: `song-${s.songId}`,
        kind: 'song',
        songId: s.songId,
        position: s.position !== undefined ? s.position : idx,
      }));

      const elementsList: UnifiedPlanItem[] = (service.elements || []).map((e, idx) => ({
        id: `elem-${e.id}`,
        kind: 'element',
        element: e,
        position: e.position !== undefined ? e.position : idx,
      }));

      const merged = [...songsList, ...elementsList].sort((a, b) => a.position - b.position);
      setUnifiedItems(merged);
    }
  }, [service]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
        <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    );
  }

  const allAvailableSongs = songsQuery.data?.songs || [];
  const addedSongIds = new Set(
    unifiedItems.filter((i) => i.kind === 'song').map((i) => i.songId!)
  );

  const filteredLibrarySongs = allAvailableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      (s.artist || '').toLowerCase().includes(librarySearch.toLowerCase())
  );

  const syncPlanState = async (newItems: UnifiedPlanItem[]) => {
    setUnifiedItems(newItems);

    const orderedSongIds = newItems.filter((i) => i.kind === 'song').map((i) => i.songId!);
    const updatedElements: ServiceElement[] = newItems
      .filter((i) => i.kind === 'element')
      .map((i, index) => ({
        ...i.element!,
        position: newItems.indexOf(i),
      }));

    if (orderedSongIds.length > 0) {
      await reorderSongs({
        serviceId: service.id,
        data: {
          orderedSongIds,
          updatedAt: service.updatedAt,
        },
      });
    }

    await updateElements({
      serviceId: service.id,
      data: {
        elements: updatedElements,
        updatedAt: service.updatedAt,
      },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = unifiedItems.findIndex((item) => item.id === active.id);
      const newIndex = unifiedItems.findIndex((item) => item.id === over.id);
      const updated = arrayMove(unifiedItems, oldIndex, newIndex);
      await syncPlanState(updated);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    await removeSong({ serviceId: service.id, songId, updatedAt: service.updatedAt });
  };

  const handleRemoveElement = async (elementId: string) => {
    const nextElements = (service.elements || []).filter((e) => e.id !== elementId);
    await updateElements({
      serviceId: service.id,
      data: { elements: nextElements, updatedAt: service.updatedAt },
    });
  };

  const handleNoteChange = async (songId: string, note: string) => {
    await updateSongNotes({
      serviceId: service.id,
      songId,
      data: { notes: note, updatedAt: service.updatedAt },
    });
  };

  const handleSaveGeneralNotes = async () => {
    await updateNotes({
      serviceId: service.id,
      data: { notes: generalNotes, updatedAt: service.updatedAt },
    });
  };

  const handleAddSongToService = async (songId: string) => {
    await addSong({
      serviceId: service.id,
      data: { songId, updatedAt: service.updatedAt },
    });
  };

  const openAddElementModal = (presetType: string = 'welcome') => {
    const titles: Record<string, string> = {
      welcome: 'Boas-vindas & Oração Inicial',
      scripture: 'Leitura Bíblica',
      message: 'Mensagem / Sermão',
      reading: 'Leitura Responsiva',
      announcement: 'Avisos da Igreja',
      custom: 'Novo Elemento',
    };
    setElementForm({
      type: presetType,
      title: titles[presetType] || 'Novo Elemento',
      content: '',
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
      content: element.content || '',
    });
    setIsElementModalOpen(true);
  };

  const handleSaveElement = async () => {
    if (!elementForm.title.trim()) return;

    let nextElements = [...(service.elements || [])];
    if (editingElement) {
      nextElements = nextElements.map((e) =>
        e.id === editingElement.id
          ? { ...e, type: elementForm.type, title: elementForm.title, content: elementForm.content }
          : e
      );
    } else {
      const newElem: ServiceElement = {
        id: crypto.randomUUID(),
        type: elementForm.type,
        title: elementForm.title,
        content: elementForm.content,
        position: unifiedItems.length,
      };
      nextElements.push(newElem);
    }

    await updateElements({
      serviceId: service.id,
      data: { elements: nextElements, updatedAt: service.updatedAt },
    });
    setIsElementModalOpen(false);
  };

  return (
    <div
      className="flex-1 w-full mx-auto max-w-7xl p-4 sm:p-6"
      style={{ backgroundColor: cream }}
    >
      {/* Service header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: navy }}>
            {service.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Arraste os elementos e cânticos para reordenar o culto modular.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full border"
          style={{ backgroundColor: goldSoft, color: '#8A6A1F', borderColor: '#E9D9AE' }}
        >
          <Calendar className="w-3.5 h-3.5" />
          {new Date(service.date).toLocaleDateString('pt-PT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 items-start">
        {/* LEFT: Song Library */}
        <div
          className="bg-white rounded-3xl border shadow-sm flex flex-col"
          style={{ borderColor: border, maxHeight: '75vh' }}
        >
          <div className="p-5 pb-4 border-b" style={{ borderColor: border }}>
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

          <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: border }}>
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
                      <p className="text-sm font-semibold truncate" style={{ color: navy }}>
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{s.artist || '—'}</p>
                    </div>

                    {isAdded ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: '#EAF6EE', color: '#2E8B4F' }}
                      >
                        <Check className="w-3 h-3" />
                        Na Lista
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddSongToService(s.id)}
                        className="p-1.5 rounded-lg shrink-0 cursor-pointer transition-colors"
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

        {/* RIGHT: Service Plan */}
        <div className="flex flex-col gap-4">
          {/* General notes */}
          <div
            className="bg-white rounded-2xl border p-4 space-y-2"
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
              <Button size="sm" variant="ghost" onClick={handleSaveGeneralNotes}>
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

          {/* Plan list */}
          <div
            className="bg-white rounded-3xl border shadow-sm flex flex-col"
            style={{ borderColor: border }}
          >
            <div
              className="flex flex-wrap items-center justify-between px-5 py-4 border-b gap-2"
              style={{ borderColor: border }}
            >
              <h2 className="text-base font-bold" style={{ color: navy }}>
                Plano do Culto
                <span className="ml-2 text-xs font-medium text-slate-400">
                  ({unifiedItems.length} {unifiedItems.length === 1 ? 'item' : 'itens'})
                </span>
              </h2>

              {/* Quick Add Element Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openAddElementModal('welcome')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                >
                  + Boas-vindas
                </button>
                <button
                  type="button"
                  onClick={() => openAddElementModal('scripture')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 cursor-pointer"
                >
                  + Escritura
                </button>
                <button
                  type="button"
                  onClick={() => openAddElementModal('message')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                >
                  + Mensagem
                </button>
                <button
                  type="button"
                  onClick={() => openAddElementModal('announcement')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                >
                  + Avisos
                </button>
              </div>
            </div>

            <div className="p-4">
              {unifiedItems.length === 0 ? (
                <div
                  className="p-8 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3"
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
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Adicione cânticos da biblioteca ou elementos (Boas-vindas, Leitura, Mensagem) para montar a ordem de culto.
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
                    items={unifiedItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2.5">
                      {unifiedItems.map((item, index) => {
                        if (item.kind === 'song') {
                          const songObj = allAvailableSongs.find((s) => s.id === item.songId);
                          const noteText = service.songNotes[item.songId!] || '';

                          return (
                            <SortableSongRow
                              key={item.id}
                              id={item.id}
                              song={songObj}
                              note={noteText}
                              index={index}
                              onRemove={handleRemoveSong}
                              onNoteChange={handleNoteChange}
                            />
                          );
                        } else {
                          return (
                            <SortableElementRow
                              key={item.id}
                              id={item.id}
                              element={item.element!}
                              index={index}
                              onRemove={handleRemoveElement}
                              onEdit={openEditElementModal}
                            />
                          );
                        }
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <div className="flex gap-2 mt-3">
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
                  onClick={() => openAddElementModal('custom')}
                  className="flex-1 py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 text-slate-600"
                  style={{ borderColor: border }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Elemento Custom
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Element Modal */}
      {isElementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4" style={{ borderColor: border }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: border }}>
              <h3 className="text-base font-bold" style={{ color: navy }}>
                {editingElement ? 'Editar Elemento de Culto' : 'Novo Elemento de Culto'}
              </h3>
              <button onClick={() => setIsElementModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tipo de Elemento</label>
                <select
                  value={elementForm.type}
                  onChange={(e) => setElementForm({ ...elementForm, type: e.target.value })}
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
                <label className="text-xs font-semibold text-slate-600 block mb-1">Título</label>
                <input
                  type="text"
                  value={elementForm.title}
                  onChange={(e) => setElementForm({ ...elementForm, title: e.target.value })}
                  placeholder="Ex: Leitura de Salmos 23"
                  className="w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2"
                  style={{ borderColor: border }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Detalhes / Conteúdo (Opcional)</label>
                <textarea
                  rows={3}
                  value={elementForm.content}
                  onChange={(e) => setElementForm({ ...elementForm, content: e.target.value })}
                  placeholder="Ex: O Senhor é o meu pastor, nada me faltará..."
                  className="w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2"
                  style={{ borderColor: border }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setIsElementModalOpen(false)}>
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