/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSong, useSongs } from '../../hooks/useSongs';
import { ArrowLeft, Save, Eye, EyeOff, Music, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import ChordProEditor from '../../components/ChordProEditor';
import ChordProPreview from '../../components/ChordProPreview';

import { parseChordPro } from '../../utils';

export const SongEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: song, isLoading, isError, error } = useSong(id || null);
  const { updateSong, isUpdating } = useSongs();

  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (song) {
      setContent(song.content);
      setHasUnsavedChanges(false);
    }
  }, [song]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" label="A carregar a pauta ChordPro..." />
      </div>
    );
  }

  if (isError || !song) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cântico Não Encontrado</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          {error ? (error as Error).message : "O cântico solicitado não existe ou foi apagado."}
        </p>
        <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => { window.history.length > 2 ? navigate(-1) : navigate('/folders') }}>
          Voltar
        </Button>
      </div>
    );
  }

  const handleSave = async (songId: string, updatedContent: string) => {
    const parsed = parseChordPro(updatedContent);
    const updates: any = { content: updatedContent };
    
    if (parsed.title) updates.title = parsed.title;
    if (parsed.artist) updates.artist = parsed.artist;

    await updateSong({
      id: songId,
      data: updates,
    });
    setHasUnsavedChanges(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-m3-sidebar/10">
      {/* Top Breadcrumb Navigation */}
      <div className="h-16 bg-m3-sidebar/30 border-b border-m3-border flex items-center justify-between px-6 shrink-0 gap-4 transition-all duration-300">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => { window.history.length > 2 ? navigate(-1) : navigate('/folders') }}
            className="group flex items-center gap-2 p-2 rounded-xl text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Voltar</span>
          </button>
          <div className="h-6 w-px bg-m3-border/30 hidden sm:block" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-black text-m3-text truncate max-w-[120px] sm:max-w-sm">
              {song.title}
            </h1>
            <span className="text-[9px] font-bold text-m3-primary uppercase tracking-[0.2em] opacity-60">ChordPro Editor</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all cursor-pointer ${
              showPreview 
                ? 'bg-m3-primary/10 border-m3-primary/30 text-m3-primary' 
                : 'bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover'
            }`}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden md:inline">{showPreview ? 'Ocultar Prévia' : 'Mostrar Prévia'}</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            isLoading={isUpdating}
            onClick={() => handleSave(song.id, content)}
            className="rounded-2xl px-6 py-5 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-m3-primary/20"
          >
            Guardar
          </Button>
        </div>
      </div>

      {/* Main Dual Pane Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className={`${showPreview ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'} flex flex-col transition-all duration-300 relative`}>
          <ChordProEditor
            song={song}
            hasUnsavedChanges={hasUnsavedChanges}
            onChange={(newContent) => {
              setContent(newContent);
              setHasUnsavedChanges(true);
            }}
            onSave={handleSave}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview(!showPreview)}
          />
        </div>

        {showPreview && (
          <div className="h-1/2 md:h-full md:w-1/2 border-t md:border-t-0 md:border-l border-m3-border bg-m3-card flex flex-col animate-in slide-in-from-right duration-500">
            <ChordProPreview content={content} />
          </div>
        )}
      </div>
    </div>
  );
};
