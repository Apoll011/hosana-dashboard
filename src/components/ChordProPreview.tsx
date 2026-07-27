/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ToggleLeft, ToggleRight, Music, Disc, Key, Flame, User } from 'lucide-react';
import { parseChordPro } from '../utils';

interface ChordProPreviewProps {
  content: string;
}

const ChordProPreview = React.memo(({ content }: { content: string }) => {
  // Hide chords by default as requested
  const [showChords, setShowChords] = useState(false);

  // Parse ChordPro in real-time
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
        
        {/* Printable/Print-friendly Song Sheet Card */}
        <div className="max-w-3xl mx-auto print-song-card">
          
          {/* Title and Metadata Header block */}
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

              {/* Floating Metadata Pills */}
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

          {/* Song Lyrics and Chords sheet container */}
          <div className="space-y-6 font-sans leading-relaxed text-sm">
            {parsedSong.sections.map((section, secIdx) => {
              if (section.type === 'chorus') {
                return (
                  <div
                    key={secIdx}
                    data-section-index={secIdx}
                    className="pl-4 md:pl-6 border-l-2 border-m3-primary/30 dark:border-m3-dark-primary/30 my-6"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-m3-text dark:text-m3-dark-text uppercase tracking-wider mb-3 select-none">
                      <Music className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
                      <span>{section.label || 'Refrão'}</span>
                    </div>
                    <div className="space-y-4 font-medium">
                      {section.lines.map((line, lineIdx) => (
                        <LineRenderer 
                          key={lineIdx} 
                          line={line} 
                          showChords={showChords} 
                        />
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

              return (
                <div key={secIdx} data-section-index={secIdx} className="relative pl-6 sm:pl-8 border-l border-m3-border/30 dark:border-m3-dark-border/30 py-1.5">
                  <div className="space-y-4">
                    {section.lines.map((line, lineIdx) => (
                      <LineRenderer 
                        key={lineIdx} 
                        line={line} 
                        showChords={showChords} 
                      />
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

/**
 * Sub-component to render a line of text, splitting into segmented block components
 */
const LineRenderer = React.memo(({ 
  line, 
  showChords
}: { 
  line: any; 
  showChords: boolean; key?: string | number; 
}) => {
  if (line.type === 'empty') {
    return <div className="h-2"></div>;
  }

  if (line.type === 'comment') {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 italic">
        {line.text}
      </div>
    );
  }

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

export default ChordProPreview;