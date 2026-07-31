/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordProRenderer, LineAST, parseChordPro } from "@hosanna/shared";
import { Music, ToggleLeft, ToggleRight } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useSettings } from "../hooks/useSettings";

interface ChordProPreviewProps {
  content: string;
}

const ChordProPreview = React.memo(({ content }: ChordProPreviewProps) => {
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 select-none">
            Mostrar Acordes
          </span>
          <button
            onClick={() => setShowChords(!showChords)}
            title={
              showChords ? "Ocultar acordes" : "Mostrar acordes acima da letra"
            }
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

      <ChordProRenderer content={content} showChords={showChords} />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Render Dispatchers & Sub-components
// ---------------------------------------------------------------------------

const LineRenderer = React.memo(
  ({ line, showChords }: { line: LineAST; showChords: boolean }) => {
    if (line.type === "empty") return <div className="h-2"></div>;
    if (line.type === "comment") return <CommentRenderer line={line} />;
    if (line.type === "chord-section")
      return <ChordSectionRenderer line={line} showChords={showChords} />;

    return <LyricsRenderer line={line} showChords={showChords} />;
  },
);

const CommentRenderer = React.memo(({ line }: { line: LineAST }) => (
  <div className="text-xs text-slate-400 dark:text-slate-500 italic my-1">
    {line.text}
  </div>
));

const LyricsRenderer = React.memo(
  ({ line, showChords }: { line: LineAST; showChords: boolean }) => {
    const segments = line.segments || [];

    return (
      <div className="flex flex-wrap items-end leading-relaxed">
        {segments.map((seg: any, segIdx: number) => {
          const hasChord = !!seg.chord;
          const transposed = hasChord ? seg.chord : "";

          return (
            <div
              key={segIdx}
              className="flex flex-col justify-end relative select-text"
              style={{
                minWidth:
                  hasChord && showChords
                    ? `${Math.max(1.1, transposed.length * 0.65)}em`
                    : undefined,
              }}
            >
              {showChords && hasChord && (
                <span
                  className="font-black text-[#0284c7] font-mono select-none pr-1 inline-block pb-0.5 transition-all"
                  style={{ fontSize: "0.85em", lineHeight: "1" }}
                >
                  {transposed}
                </span>
              )}
              <span className="text-slate-800 dark:text-slate-200 whitespace-pre">
                {seg.text || "\u00A0"}
              </span>
            </div>
          );
        })}
      </div>
    );
  },
);

const ChordSectionRenderer = React.memo(
  ({ line, showChords }: { line: LineAST; showChords: boolean }) => {
    if (!showChords) return null;

    const measures = line.measures || [];

    return (
      <div className="flex items-stretch my-2 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-800 overflow-hidden w-full max-w-max">
        {line.startBarline && (
          <div className="flex items-center px-2 bg-slate-100/50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 font-bold select-none text-sm tracking-widest">
              {line.startBarline}
            </span>
          </div>
        )}

        <div className="flex flex-1 min-w-0">
          {measures.map((measure, mIdx) => (
            <React.Fragment key={mIdx}>
              <div className="flex-1 flex items-center justify-around px-3 py-2 min-w-12">
                {measure.chords.map((chordSeg, cIdx) => (
                  <span
                    key={cIdx}
                    className="font-black text-[#0284c7] font-mono select-none text-[15px]"
                  >
                    {chordSeg.chord}
                  </span>
                ))}
              </div>

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
  },
);

export default ChordProPreview;
