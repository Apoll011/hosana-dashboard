/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ToggleLeft, ToggleRight, Music, Disc, Key, Flame, User } from 'lucide-react';
import { LineAST, parseChordPro } from '../utils/chordproparser';
import { useSettings } from '../hooks/useSettings';

interface ChordProPreviewProps {
  content: string;
}

const ChordProPreview = React.memo(({ content }: { content: string }) => {
  const { settingsQuery } = useSettings();
  const defaultShowChords = settingsQuery.data?.showChordsDefault ?? true;
  const [showChords, setShowChords] = useState(defaultShowChords);

  useEffect(() => {
    if (settingsQuery.data?.showChordsDefault !== undefined) {
      setShowChords(settingsQuery.data.showChordsDefault);
    }
  }, [settingsQuery.data?.showChordsDefault]);

  const parsedSong = useMemo(() => {
    return parseChordPro(content);
  }, [content]);

  const { metadata } = parsedSong;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Preview Settings Toolbar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 no-print">
        <span className="font-semibold text-xs tracking-wider uppercase text-slate-500 select-none flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-[#0284c7]" />
          Pré-visualização
        </span>

        {/* Mostrar Acordes Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 select-none">
            Mostrar Acordes
          </span>
          <button
            onClick={() => setShowChords(!showChords)}
            title={showChords ? "Ocultar acordes" : "Mostrar acordes acima da letra"}
            className="text-[#0284c7] hover:text-[#075985] dark:hover:text-[#38bdf8] transition-colors flex items-center justify-center p-1 cursor-pointer"
          >
            {showChords ? (
              <ToggleRight className="w-9 h-9 text-[#0284c7]" />
            ) : (
              <ToggleLeft className="w-9 h-9 text-slate-400/50" />
            )}
          </button>
        </div>
      </div>

      {/* Sheet Render Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 bg-slate-50 dark:bg-slate-950 print-page select-text leading-relaxed">
        
        <div className="max-w-3xl mx-auto print-song-card">
          
          <div className="mb-6 border-b border-neutral-100 dark:border-slate-800 pb-5 select-none">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  {metadata.title}
                </h2>
                {metadata.artist && (
                  <div className="flex items-center gap-1 text-xs text-neutral-500 mt-2 font-medium">
                    <User className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Por: {metadata.artist}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                {metadata.songNumber && (
                  <span className="text-[10px] font-bold bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded-lg border border-neutral-200 dark:border-slate-700">
                    Nº {metadata.songNumber}
                  </span>
                )}
                {metadata.key && (
                  <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-950/50">
                    Tom Original: {metadata.key}
                  </span>
                )}
                {metadata.capo && metadata.capo !== '0' && (
                  <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-950/50">
                    Capo: {metadata.capo}ª casa
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 font-sans leading-relaxed text-sm">
            {parsedSong.sections.map((section, secIdx) => {
              const isChorus = section.type === 'chorus';
              const isBridge = section.type === 'bridge';
              
              if (isChorus || isBridge) {
                const borderColor = isChorus ? 'border-m3-primary/30 dark:border-m3-dark-primary/30' : 'border-amber-500/30 dark:border-amber-400/30';
                const labelColor = isChorus ? 'text-m3-text dark:text-m3-dark-text' : 'text-amber-700 dark:text-amber-400';
                const iconColor = isChorus ? 'text-m3-secondary' : 'text-amber-500';

                return (
                  <div
                    key={secIdx}
                    data-section-index={secIdx}
                    className={`pl-4 md:pl-6 border-l-2 my-6 ${borderColor}`}
                  >
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-3 select-none ${labelColor}`}>
                      <Music className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                      <span>{section.label || (isChorus ? 'Refrão' : 'Ponte')}</span>
                    </div>
                    <div className="space-y-4 font-medium">
                      {section.lines.map((line, lineIdx) => (
                        <LineRenderer key={lineIdx} line={line} showChords={showChords} />
                      ))}
                    </div>
                  </div>
                );
              }

              if (section.type === 'tab') {
                return (
                  <div key={secIdx} data-section-index={secIdx} className="bg-m3-sidebar dark:bg-m3-dark-sidebar p-4 rounded-xl border border-m3-border dark:border-m3-dark-border my-4 select-text">
                    <div className="text-[10px] font-bold text-m3-secondary dark:text-m3-dark-secondary uppercase tracking-wider mb-2 select-none">
                      {section.label || 'Tablatura'}
                    </div>
                    <pre className="font-mono text-xs text-m3-text dark:text-m3-dark-text overflow-x-auto leading-relaxed whitespace-pre">
                      {section.lines.map(line => line.text || '').join('\n')}
                    </pre>
                  </div>
                );
              }

              if (section.type === 'comment') {
                return (
                  <div
                    key={secIdx}
                    data-section-index={secIdx}
                    className="my-2 select-none pl-3 text-[11px] italic text-m3-secondary/70 dark:text-m3-dark-secondary/70"
                  >
                    {section.lines.map(l => l.text).join(", ")}
                  </div>
                );
              }

              // Default standard verse fallback mechanism 
              return (
                <div key={secIdx} data-section-index={secIdx} className="relative pl-6 sm:pl-8 border-l border-m3-border/30 dark:border-m3-dark-border/30 py-1.5 my-4">
                  {section.label && (
                    <div className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-m3-secondary/20 dark:bg-m3-dark-secondary/20 rounded-full"></div>
                  )}
                  {section.label && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-m3-text/60 dark:text-m3-dark-text/60 uppercase tracking-wider mb-3 select-none">
                      <Music className="w-3.5 h-3.5 text-m3-secondary/60 shrink-0" />
                      <span>{section.label}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {section.lines.map((line, lineIdx) => (
                      <LineRenderer key={lineIdx} line={line} showChords={showChords} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Render Dispatchers & Sub-components 
// ---------------------------------------------------------------------------

const LineRenderer = React.memo(({ line, showChords }: { line: LineAST; showChords: boolean; }) => {
  if (line.type === 'empty') return <div className="h-2"></div>;
  if (line.type === 'comment') return <CommentRenderer line={line} />;
  if (line.type === 'chord-section') return <ChordSectionRenderer line={line} showChords={showChords} />;
  
  return <LyricsRenderer line={line} showChords={showChords} />;
});


const CommentRenderer = React.memo(({ line }: { line: LineAST }) => (
  <div className="text-xs text-slate-400 dark:text-slate-500 italic my-1">
    {line.text}
  </div>
));


const LyricsRenderer = React.memo(({ line, showChords }: { line: LineAST, showChords: boolean }) => {
  const segments = line.segments || [];

  return (
    <div className="flex flex-wrap items-end leading-relaxed">
      {segments.map((seg: any, segIdx: number) => {
        const hasChord = !!seg.chord;
        const transposed = hasChord ? seg.chord : '';

        return (
          <div key={segIdx} className="flex flex-col justify-end relative select-text" style={{ minWidth: hasChord && showChords ? `${Math.max(1.1, transposed.length * 0.65)}em` : undefined }}>
            {showChords && hasChord && (
              <span 
                className="font-black text-[#0284c7] font-mono select-none pr-1 inline-block pb-0.5 transition-all"
                style={{ fontSize: '0.85em', lineHeight: '1' }}
              >
                {transposed}
              </span>
            )}
            <span className="text-slate-800 dark:text-slate-200 whitespace-pre">
              {seg.text || '\u00A0'}
            </span>
          </div>
        );
      })}
    </div>
  );
});


const ChordSectionRenderer = React.memo(({ line, showChords }: { line: LineAST, showChords: boolean }) => {
  if (!showChords) return null; // We hide structural measure blocks if chords are toggled off

  const measures = line.measures || [];
  
  return (
    <div className="flex items-stretch my-2 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
      
      {/* Starting measure Barline */}
      {line.startBarline && (
        <div className="flex items-center px-2 bg-slate-100/50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500 font-bold select-none text-sm tracking-widest">
            {line.startBarline}
          </span>
        </div>
      )}

      {/* Structured Measures */}
      <div className="flex flex-1 min-w-0">
        {measures.map((measure, mIdx) => (
          <React.Fragment key={mIdx}>
            <div className="flex-1 flex items-center justify-around px-3 py-2 min-w-[3rem]">
              {measure.chords.map((chordSeg, cIdx) => (
                <span key={cIdx} className="font-black text-[#0284c7] font-mono select-none text-[15px]">
                  {chordSeg.chord}
                </span>
              ))}
            </div>
            
            {/* End Barline specific to closure sequence tracking per block/bar */}
            {measure.endBarline && (
              <div className="flex items-center px-1.5 bg-slate-100/50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 font-bold select-none text-sm tracking-widest">
                  {measure.endBarline}
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

export default ChordProPreview;