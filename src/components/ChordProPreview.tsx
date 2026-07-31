/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordProRenderer } from "@hosanna/shared";
import { Music, ToggleLeft, ToggleRight } from "lucide-react";
import React, { useEffect, useState } from "react";
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

export default ChordProPreview;
