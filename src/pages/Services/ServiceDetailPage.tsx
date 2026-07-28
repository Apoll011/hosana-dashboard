/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService, useServices } from '../../hooks/useServices';
import { useSongs } from '../../hooks/useSongs';
import { Service, Song } from '../../types';
import {
  Calendar, ArrowLeft, Plus, GripVertical, Trash2, Edit3, Save, Music,
  FileText, Search, Check, MoreHorizontal,
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

/**
 * Warm "plan" palette, scoped to this page only (kept as literal values so this
 * page doesn't depend on the app's existing slate/m3 theme tokens).
 */
const gold = '#C9992F';
const goldSoft = '#F4E9D3';
const cream = '#FBF8F2';
const border = '#EAE2D1';
const navy = '#12203D';

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
                    onRemove(id);
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
                  onNoteChange(id, localNote);
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

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading, isError } = useService(id || null);
  const { addSong, removeSong, updateNotes, updateSongNotes, reorderSongs } = useServices();
  const { songsQuery } = useSongs({ limit: 200 });

  const [serviceSongs, setServiceSongs] = useState<Service['songs']>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (service) {
      setServiceSongs(service.songs || []);
      setGeneralNotes(service.notes || '');
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
  const addedSongIds = new Set(serviceSongs.map((s) => (s as any).songId));

  const filteredLibrarySongs = allAvailableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      (s.artist || '').toLowerCase().includes(librarySearch.toLowerCase())
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = serviceSongs.findIndex((item) => (item as any).songId === active.id);
      const newIndex = serviceSongs.findIndex((item) => (item as any).songId === over.id);
      const updated = arrayMove(serviceSongs, oldIndex, newIndex);

      setServiceSongs(updated);
      await reorderSongs({
        serviceId: service.id,
        data: {
          orderedSongIds: updated.map((s) => (s as any).songId),
          updatedAt: service.updatedAt,
        },
      });
    }
  };

  const handleRemoveSong = async (songId: string) => {
    await removeSong({ serviceId: service.id, songId, updatedAt: service.updatedAt });
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
            Arraste os cânticos para reordenar. Clique em “⋯” para adicionar notas.
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
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: border }}
            >
              <h2 className="text-base font-bold" style={{ color: navy }}>
                Plano do Culto
                <span className="ml-2 text-xs font-medium text-slate-400">
                  ({serviceSongs.length} {serviceSongs.length === 1 ? 'cântico' : 'cânticos'})
                </span>
              </h2>
            </div>

            <div className="p-4">
              {serviceSongs.length === 0 ? (
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
                      Adicione cânticos a partir da biblioteca à esquerda para começar a montar o plano.
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
                    items={serviceSongs.map((s) => s.songId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2.5">
                      {serviceSongs.map((item, index) => {
                        const songObj = allAvailableSongs.find((s) => s.id === item.songId);
                        const noteText = service.songNotes[item.songId] || item.notes || '';

                        return (
                          <SortableSongRow
                            key={item.songId}
                            id={item.songId}
                            song={songObj}
                            note={noteText}
                            index={index}
                            onRemove={handleRemoveSong}
                            onNoteChange={handleNoteChange}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                className="w-full mt-3 py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50"
                style={{ borderColor: border, color: gold }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Cântico
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};