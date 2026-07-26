/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService, useServices } from '../../hooks/useServices';
import { useSongs } from '../../hooks/useSongs';
import { Service, ServiceSong, Song } from '../../types';
import {
  Calendar, ArrowLeft, Plus, GripVertical, Trash2, Edit3, Save, Music, Clock, FileText, Search, Check
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
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { Badge } from '../../components/common/Badge';

interface SortableSongItemProps {
  id: string;
  song: Song | undefined;
  note: string;
  index: number;
  onRemove: (songId: string) => void;
  onNotaChange: (songId: string, note: string) => void;
}

const SortableSongItem: React.FC<SortableSongItemProps> = ({
  id,
  song,
  note,
  index,
  onRemove,
  onNotaChange,
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

  const [isEditingNota, setIsEditingNota] = useState(false);
  const [localNota, setLocalNota] = useState(note);

  useEffect(() => {
    setLocalNota(note);
  }, [note]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-white dark:bg-slate-900 border ${
        isDragging ? 'border-[#0284c7] shadow-lg z-20 opacity-90' : 'border-slate-200 dark:border-slate-800'
      } rounded-2xl flex flex-col gap-3 transition-colors`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Drag Handle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing"
            title="Arrastar para reordenar"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-[#0284c7] font-bold text-xs flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {song ? song.title : 'Cântico Desconhecido'}
            </h4>
            <p className="text-xs text-slate-500">{song ? song.artist : '—'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingNota(!isEditingNota)}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
              note ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Editar nota da música"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{note ? 'Editar Nota' : 'Adicionar Nota'}</span>
          </button>

          <button
            type="button"
            onClick={() => onRemove(id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
            title="Remover da lista"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nota view or editor */}
      {isEditingNota ? (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={localNota}
            onChange={(e) => setLocalNota(e.target.value)}
            placeholder="Ex: Introdução ao piano, repetir refrão 2x..."
            className="flex-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0284c7]"
            autoFocus
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              onNotaChange(id, localNota);
              setIsEditingNota(false);
            }}
          >
            Guardar Nota
          </Button>
        </div>
      ) : note ? (
        <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 italic">
          <strong>Nota:</strong> {note}
        </div>
      ) : null}
    </div>
  );
};

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading, isError } = useService(id || null);
  const { addSong, removeSong, updateNotes, updateSongNotes, reorderSongs } = useServices();
  const { songsQuery } = useSongs({ limit: 100 });

  const [serviceSongs, setServiceSongs] = useState<Service['songs']>([]);
  const [generalNotas, setGeneralNotas] = useState('');

  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [addSongSearch, setAddSongSearch] = useState('');

  useEffect(() => {
    if (service) {
      setServiceSongs(service.songs || []);
      setGeneralNotas(service.notes || '');
    }
  }, [service]);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" label="A carregar lista de cânticos do culto..." />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-lg font-bold">Plano de Culto Não Encontrado</h2>
        <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => { window.history.length > 2 ? navigate(-1) : navigate('/services') }}>
          Voltar
        </Button>
      </div>
    );
  }

  const allAvailableSongs = songsQuery.data?.songs || [];

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
          orderedSongIds: updated.map(s => (s as any).songId),
          updatedAt: service.updatedAt
        }
      });
    }
  };

  const handleRemoveSong = async (songId: string) => {
    await removeSong({
      serviceId: service.id,
      songId,
      updatedAt: service.updatedAt
    });
  };

  const handleNotaChange = async (songId: string, note: string) => {
    await updateSongNotes({
      serviceId: service.id,
      songId,
      data: {
        notes: note,
        updatedAt: service.updatedAt
      }
    });
  };

  const handleSaveGeneralNotas = async () => {
    await updateNotes({
      serviceId: service.id,
      data: {
        notes: generalNotas,
        updatedAt: service.updatedAt
      },
    });
  };

  const handleAddSongToService = async (songId: string) => {
    await addSong({
      serviceId: service.id,
      data: {
        songId,
        updatedAt: service.updatedAt
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { window.history.length > 2 ? navigate(-1) : navigate('/services') }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Cultos</span>
        </button>

        <Badge variant="sky">
          <Calendar className="w-3.5 h-3.5 mr-1" />
          {new Date(service.date).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Badge>
      </div>

      {/* Header Info Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {service.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Arraste e largue os cânticos para reordenar a lista. Adicione notas personalizadas para os vocalistas e músicos.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddSongModalOpen(true)}
        >
          Adicionar Cântico à Lista
        </Button>
      </div>

      {/* General Service Planning Notas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0284c7]" />
            Notas Gerais do Culto e Ensaio da Banda
          </label>
          <Button size="sm" variant="ghost" onClick={handleSaveGeneralNotas}>
            <Save className="w-3.5 h-3.5 text-[#0284c7]" /> Guardar Notas
          </Button>
        </div>
        <textarea
          rows={2}
          value={generalNotas}
          onChange={(e) => setGeneralNotas(e.target.value)}
          placeholder="Ex: Horário do ensaio: 8:30. Mensagem do pastor: A Caminhar pela Fé."
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-[#0284c7]"
        />
      </div>

      {/* Setlist List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
          <span>Ordem da Lista ({serviceSongs.length} Cânticos)</span>
          <span className="text-[11px] text-slate-400 font-normal">Use o ícone (⋮⋮) para organizar</span>
        </h3>

        {serviceSongs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/80 flex items-center justify-center text-[#0284c7]">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">A lista de cânticos está atualmente vazia</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Ainda não foram adicionados cânticos a este plano de culto. Adicione cânticos da sua biblioteca para organizar a ordem e adicionar notas.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddSongModalOpen(true)}
            >
              Adicionar Primeiro Cântico
            </Button>
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
              <div className="flex flex-col gap-3">
                {serviceSongs.map((item, index) => {
                  const songObj = allAvailableSongs.find((s) => s.id === item.songId);
                  const noteText = service.songNotes[item.songId] || item.notes || '';

                  return (
                    <SortableSongItem
                      key={item.songId}
                      id={item.songId}
                      song={songObj}
                      note={noteText}
                      index={index}
                      onRemove={handleRemoveSong}
                      onNotaChange={handleNotaChange}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ADD SONG MODAL WITH SEARCH & FILTER */}
      <Modal
        isOpen={isAddSongModalOpen}
        onClose={() => {
          setIsAddSongModalOpen(false);
          setAddSongSearch('');
        }}
        title="Adicionar Cânticos da Biblioteca"
      >
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Filtrar cânticos por título ou artista..."
            value={addSongSearch}
            onChange={(e) => setAddSongSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
            {allAvailableSongs
              .filter(
                (s) =>
                  s.title.toLowerCase().includes(addSongSearch.toLowerCase()) ||
                  s.artist.toLowerCase().includes(addSongSearch.toLowerCase())
              )
              .map((s) => {
                const isAlreadyInSetlist = serviceSongs.some((item) => item.songId === s.id);
                return (
                  <div
                    key={s.id}
                    className={`p-3 flex items-center justify-between transition-colors ${
                      isAlreadyInSetlist
                        ? 'bg-slate-50/50 dark:bg-slate-950/40 opacity-60'
                        : 'hover:bg-sky-50/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {s.title}
                      </span>
                      <span className="text-[11px] text-slate-500">{s.artist}</span>
                    </div>

                    {isAlreadyInSetlist ? (
                      <Badge variant="slate">
                        <Check className="w-3 h-3 mr-1 text-emerald-500" />
                        Na Lista
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => handleAddSongToService(s.id)}
                      >
                        Adicionar
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddSongModalOpen(false);
                setAddSongSearch('');
              }}
            >
              Concluído
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
