import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { Song } from '../types';
import { parseChordPro, buildChordProText } from '../utils';

interface ChordProEditorProps {
  onChange?: (newContent: string) => void;
  song: Song;
  hasUnsavedChanges: boolean;
  onSave: (id: string, updatedContent: string) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
}

export default function ChordProEditor({
  song,
  hasUnsavedChanges,
  onSave,
  showPreview,
  onTogglePreview,
  onChange
}: ChordProEditorProps) {
  // Metadata Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('C');
  const [capo, setCapo] = useState('0');
  const [songNumber, setSongNumber] = useState('');
  const [youtube, setYoutube] = useState('');
  const [composer, setComposer] = useState('');
  const [copyright, setCopyright] = useState('');
  
  // Song lyrics body (parsed from raw file without metadata lines)
  const [bodyText, setBodyText] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // Notify parent of changes
  useEffect(() => {
    try {
      const metadata = {
        title: title.trim(),
        artist: artist.trim() || undefined,
        key: key.trim() || undefined,
        capo: capo.trim() !== '0' ? capo.trim() : undefined,
        songNumber: songNumber.trim() || undefined,
        youtube: youtube.trim() || undefined,
        composer: composer.trim() || undefined,
        copyright: copyright.trim() || undefined
      };
      const fullChordPro = buildChordProText(metadata, bodyText);
      if (onChange && fullChordPro !== song.content) {
        onChange(fullChordPro);
      }
    } catch (e) {}
  }, [title, artist, key, capo, songNumber, youtube, composer, copyright, bodyText]);

  // Load existing song content on mount/change
  useEffect(() => {
    if (song) {
      const parsed = parseChordPro(song.content);
      setTitle(parsed.title || '');
      setArtist(parsed.artist || '');
      // Some directives might not be officially parsed yet, let's extract them manually to be safe
      const lines = song.content.split('\n');
      let foundKey = 'G';
      let foundCapo = '0';
      let foundSongNumber = '';
      let foundYoutube = '';
      let foundComposer = '';
      let foundCopyright = '';
      
      const bodyLines = lines.filter(line => {
        const trimmed = line.trim().toLowerCase();
        // Extract metadata for our specific fields
        if (trimmed.startsWith('{key:') || trimmed.startsWith('{k:')) {
          foundKey = line.substring(line.indexOf(':') + 1, line.indexOf('}')).trim();
          return false;
        }
        if (trimmed.startsWith('{capo:')) {
          foundCapo = line.substring(line.indexOf(':') + 1, line.indexOf('}')).trim();
          return false;
        }
        if (trimmed.startsWith('{song_number:') || trimmed.startsWith('{number:')) {
          foundSongNumber = line.substring(line.indexOf(':') + 1, line.indexOf('}')).trim();
          return false;
        }
        if (trimmed.startsWith('{youtube:') || trimmed.startsWith('{yt:')) {
          foundYoutube = line.substring(line.indexOf(':') + 1, line.indexOf('}')).trim();
          return false;
        }
        if (trimmed.startsWith('{composer:')) {
          foundComposer = line.substring(line.indexOf(':') + 1, line.indexOf('}')).trim();
          return false;
        }
        if (trimmed.startsWith('{copyright:')) {
          foundCopyright = line.substring(line.indexOf(':') + 1, line.indexOf('}')).trim();
          return false;
        }
        
        // Skip basic metadata headers for editing body
        const isMeta = trimmed.startsWith('{title:') || trimmed.startsWith('{t:') ||
                       trimmed.startsWith('{subtitle:') || trimmed.startsWith('{st:') ||
                       trimmed.startsWith('{artist:') || trimmed.startsWith('{a:') ||
                       trimmed.startsWith('{tempo:') || trimmed.startsWith('{album:');
        return !isMeta;
      });

      setKey(foundKey);
      setCapo(foundCapo);
      setSongNumber(foundSongNumber);
      setYoutube(foundYoutube);
      setComposer(foundComposer);
      setCopyright(foundCopyright);
      setBodyText(bodyLines.join('\n').trim());
    }
  }, [song.id, song.content]);

  // Insert helper text at textarea cursor position
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const value = textarea.value;

    const newValue = value.substring(0, startPos) + textToInsert + value.substring(endPos);
    setBodyText(newValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startPos + textToInsert.length;
    }, 10);
  };

  const getQuickChordsForKey = (currentKey: string) => {
    const chordMap: Record<string, string[]> = {
      'C': ['C', 'F', 'G', 'Am', 'Dm', 'Em', 'G/B', 'C/E'],
      'D': ['D', 'G', 'A', 'Bm', 'Em', 'F#m', 'A/C#', 'D/F#'],
      'E': ['E', 'A', 'B', 'C#m', 'F#m', 'G#m', 'B/D#', 'E/G#'],
      'F': ['F', 'Bb', 'C', 'Dm', 'Gm', 'Am', 'C/E', 'F/A'],
      'G': ['G', 'C', 'D', 'Em', 'Am', 'Bm', 'D/F#', 'G/B'],
      'A': ['A', 'D', 'E', 'F#m', 'Bm', 'C#m', 'E/G#', 'A/C#'],
      'B': ['B', 'E', 'F#', 'G#m', 'C#m', 'D#m', 'F#/A#', 'B/D#'],
    };
    
    const baseKey = currentKey.replace(/m$/, '').replace(/[b#]$/, '');
    
    if (chordMap[currentKey]) return chordMap[currentKey];
    if (chordMap[baseKey]) return chordMap[baseKey];
    
    return ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  };

  // Sync back to parent when typing so that we can have "unsaved changes" marker 
  // Wait, the parent uses handleSave to save to DB. Parent expects onSave for the DB call.
  // Actually, parent sets hasUnsavedChanges when its own content state differs from DB.
  // Since we replaced the generic textarea with inputs, we should notify the parent of live content changes
  // to update the preview live and trigger hasUnsavedChanges.
  // Wait, I will just update the parent content when any field changes if the parent expects it!
  // But wait, SongEditorPage currently only receives onSave. 
  
  return (
    <div className="flex-1 flex flex-col h-full bg-m3-bg dark:bg-m3-dark-bg overflow-hidden select-none">
      
      {/* Editor Main body container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900 flex items-start gap-2 select-text mx-4 mt-4">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SECTION 1: METADATA FORM FIELDS */}
        <div className="bg-m3-card dark:bg-m3-dark-card p-4 border-b border-m3-border/40 dark:border-m3-dark-border/40 space-y-3">
          <div className="text-[10px] font-bold text-m3-secondary dark:text-m3-dark-secondary uppercase tracking-wider mb-1">
            Metadados do Cântico (Diretivas ChordPro)
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Digno és Tu"
                className="w-full px-3 py-1.5 text-xs bg-m3-sidebar dark:bg-m3-dark-sidebar border border-m3-border dark:border-m3-dark-border rounded-xl text-m3-text dark:text-m3-dark-text focus:outline-none focus:ring-1 focus:ring-m3-primary/30"
              />
            </div>
            <div>
              <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold">Artista / Autor</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ex: Aline Barros"
                className="w-full px-3 py-1.5 text-xs bg-m3-sidebar dark:bg-m3-dark-sidebar border border-m3-border dark:border-m3-dark-border rounded-xl text-m3-text dark:text-m3-dark-text focus:outline-none focus:ring-1 focus:ring-m3-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold">Tom Base</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-m3-sidebar dark:bg-m3-dark-sidebar border border-m3-border dark:border-m3-dark-border rounded-xl text-m3-text dark:text-m3-dark-text focus:outline-none focus:ring-1 focus:ring-m3-primary/30 font-bold"
              >
                {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'Ab', 'A', 'Bb', 'B'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold">Capo</label>
              <select
                value={capo}
                onChange={(e) => setCapo(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-m3-sidebar dark:bg-m3-dark-sidebar border border-m3-border dark:border-m3-dark-border rounded-xl text-m3-text dark:text-m3-dark-text focus:outline-none focus:ring-1 focus:ring-m3-primary/30"
              >
                {['0', '1', '2', '3', '4', '5', '6', '7'].map(c => (
                  <option key={c} value={c}>{c === '0' ? 'Sem' : `${c}ª casa`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold">Nº Cântico</label>
              <input
                type="text"
                value={songNumber}
                onChange={(e) => setSongNumber(e.target.value)}
                placeholder="Ex: 45"
                className="w-full px-3 py-1.5 text-xs bg-m3-sidebar dark:bg-m3-dark-sidebar border border-m3-border dark:border-m3-dark-border rounded-xl text-m3-text dark:text-m3-dark-text focus:outline-none focus:ring-1 focus:ring-m3-primary/30 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold">Vídeo YouTube (ID ou URL)</label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="Ex: dQw4w9WgXcQ"
                className="w-full px-3 py-1.5 text-xs bg-m3-sidebar dark:bg-m3-dark-sidebar border border-m3-border dark:border-m3-dark-border rounded-xl text-m3-text dark:text-m3-dark-text focus:outline-none focus:ring-1 focus:ring-m3-primary/30"
              />
            </div>
            <div>
              <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold">Compositor</label>
              <input
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="Ex: John Doe"
                className="w-full px-3 py-1.5 text-xs bg-m3-sidebar dark:bg-m3-dark-sidebar border border-m3-border dark:border-m3-dark-border rounded-xl text-m3-text dark:text-m3-dark-text focus:outline-none focus:ring-1 focus:ring-m3-primary/30"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SYNTAX DIRECTIVES TOOLBAR */}
        <div className="space-y-1 pt-2">
          <span className="text-[10px] font-bold text-m3-secondary dark:text-m3-dark-secondary">Inserir Diretivas ChordPro Rápidas:</span>
          
          <div className="flex flex-wrap gap-1 bg-m3-sidebar dark:bg-m3-dark-sidebar p-2 rounded-xl border border-m3-border dark:border-m3-dark-border">
            {/* ChordPro directive tags */}
            <button
              onClick={() => insertTextAtCursor('\n{start_of_chorus: Refrão}\n\n{end_of_chorus}\n')}
              className="px-2 py-1 bg-m3-card dark:bg-m3-dark-card hover:bg-m3-primary-light dark:hover:bg-m3-dark-primary-light border border-m3-border/30 dark:border-m3-dark-border/30 text-[10px] rounded font-mono text-m3-primary dark:text-m3-dark-text font-bold"
              title="Estrutura de Refrão"
            >
              + Refrão
            </button>
            <button
              onClick={() => insertTextAtCursor('{comment: }')}
              className="px-2 py-1 bg-m3-card dark:bg-m3-dark-card hover:bg-m3-primary-light dark:hover:bg-m3-dark-primary-light border border-m3-border/30 dark:border-m3-dark-border/30 text-[10px] rounded font-mono text-m3-secondary dark:text-m3-dark-secondary"
              title="Inserir Comentário"
            >
              + Comentário
            </button>
            <button
              onClick={() => insertTextAtCursor('{repeat}')}
              className="px-2 py-1 bg-m3-card dark:bg-m3-dark-card hover:bg-m3-primary-light dark:hover:bg-m3-dark-primary-light border border-m3-border/30 dark:border-m3-dark-border/30 text-[10px] rounded font-mono text-m3-secondary dark:text-m3-dark-secondary"
              title="Repetir parágrafo"
            >
              + Repetir
            </button>

            {/* Quick Chords inserter */}
            <div className="w-[1px] h-4 bg-m3-border/30 dark:bg-m3-dark-border/30 mx-1 self-center" />
            
            {getQuickChordsForKey(key).map(c => (
              <button
                key={c}
                onClick={() => insertTextAtCursor(`[${c}]`)}
                className="px-2 py-1 bg-m3-primary-light dark:bg-m3-dark-primary-light hover:bg-m3-hover dark:hover:bg-m3-dark-hover text-[10px] font-mono font-black rounded text-m3-primary dark:text-m3-dark-text border border-m3-border/30 transition-all"
              >
                [{c}]
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: LYRICS & CHORDS TEXT AREA */}
        <div className="flex flex-col flex-1 min-h-[300px] pb-4">
          <label className="text-[10px] text-m3-secondary dark:text-m3-dark-secondary font-bold mb-1">
            Letra e Acordes Inline (Ex: Este é um [C]cântico [G]novo.)
          </label>
          <div className="relative flex-1 bg-m3-card dark:bg-m3-dark-card border border-m3-border dark:border-m3-dark-border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-m3-primary/20 transition-all text-sm font-mono leading-relaxed min-h-[400px]">
            {/* Real Textarea */}
            <textarea
              ref={textareaRef}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-m3-text dark:text-m3-dark-text resize-none focus:outline-none overflow-auto z-10"
              placeholder="[G]Graças te damos [D]pelo Teu amor..."
              spellCheck={false}
            />
          </div>
          
                  </div>
      </div>
    </div>
  );
}
