/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordProRenderer } from "@hosanna/shared";
import {
  Eye,
  EyeOff,
  Minus,
  Music,
  Plus,
  RotateCcw,
  Settings,
  Sun,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { usePreviewSettings } from "../hooks/usePreviewSettings";

interface ChordProPreviewProps {
  content: string;
}

const ChordProPreview = React.memo(({ content }: ChordProPreviewProps) => {
  const { settings, updateSetting, resetSettings } = usePreviewSettings();
  const {
    showChords,
    transposeVal,
    fontSize,
    instrument,
    showDiagrams,
    showYoutubePlayer,
    keepScreenAwake,
  } = settings;

  const [showControls, setShowControls] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ── Screen Wake Lock ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!keepScreenAwake) {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      return;
    }

    let cancelled = false;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && !cancelled) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        // wake lock request failed — silently ignore
      }
    };

    requestWakeLock();

    // Re-acquire when the page becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [keepScreenAwake]);

  const handleTranspose = (delta: number) => {
    updateSetting("transposeVal", transposeVal + delta);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Preview Settings Toolbar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 no-print">
        <span className="font-semibold text-xs tracking-wider uppercase text-slate-500 select-none flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-[#0284c7]" />
          Pré-visualização
        </span>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowControls((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all cursor-pointer ${
              showControls
                ? "bg-m3-primary/10 border-m3-primary/30 text-m3-primary"
                : "bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover"
            }`}
            title="Ajustes de Leitura"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Ajustes</span>
          </button>
        </div>
      </div>

      {/* ── Settings Panel ──────────────────────────────────────────────── */}
      {showControls && (
        <div className="absolute right-4 top-16 w-64 bg-m3-card dark:bg-m3-dark-card border border-m3-border dark:border-m3-dark-border rounded-2xl shadow-xl z-30 p-4 space-y-4 select-none animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="border-b border-m3-border/30 dark:border-m3-dark-border/30 pb-2 flex items-center justify-between">
            <span className="text-xs font-black text-m3-text dark:text-m3-dark-text uppercase tracking-wider">
              Ajustes de Leitura
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={resetSettings}
                className="text-[10px] font-bold text-m3-secondary dark:text-m3-dark-secondary hover:text-m3-primary transition-colors"
                title="Repor predefinições"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowControls(false)}
                className="text-[10px] font-bold text-m3-primary dark:text-m3-dark-primary hover:underline"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Show/Hide Chords Segmented Control */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-m3-secondary dark:text-m3-dark-secondary block">
              Exibição:
            </span>
            <div className="flex bg-m3-sidebar dark:bg-m3-dark-sidebar p-0.5 rounded-xl border border-m3-border/30">
              <button
                onClick={() => updateSetting("showChords", false)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  !showChords
                    ? "bg-m3-primary text-white shadow-xs"
                    : "text-m3-secondary dark:text-m3-dark-secondary hover:text-m3-text"
                }`}
              >
                <EyeOff className="w-3 h-3" />
                Apenas Letra
              </button>
              <button
                onClick={() => updateSetting("showChords", true)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  showChords
                    ? "bg-m3-primary text-white shadow-xs"
                    : "text-m3-secondary dark:text-m3-dark-secondary hover:text-m3-text"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Com Cifras
              </button>
            </div>
          </div>

          {/* Transposition (visible only when chords are enabled) */}
          {showChords && (
            <div className="space-y-1.5 border-t border-m3-border/30 dark:border-m3-dark-border/30 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-m3-secondary dark:text-m3-dark-secondary">
                  Transposição:
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-m3-primary-light dark:bg-m3-dark-primary-light text-m3-primary dark:text-m3-dark-text rounded font-mono">
                  {transposeVal > 0 ? `+${transposeVal}` : transposeVal}{" "}
                  semitons
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-m3-sidebar dark:bg-m3-dark-sidebar p-0.5 rounded-xl border border-m3-border/30">
                <button
                  onClick={() => handleTranspose(-1)}
                  className="py-1 text-xs font-bold rounded-lg transition-all text-m3-text dark:text-m3-dark-text hover:bg-m3-hover dark:hover:bg-m3-dark-hover flex items-center justify-center gap-0.5"
                  title="Diminuir Semitom"
                >
                  <Minus className="w-3 h-3" />
                  <span>♭</span>
                </button>
                <button
                  onClick={() => updateSetting("transposeVal", 0)}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    transposeVal === 0
                      ? "bg-m3-primary text-white shadow-xs"
                      : "text-m3-secondary dark:text-m3-dark-secondary hover:bg-m3-hover dark:hover:bg-m3-dark-hover"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => handleTranspose(1)}
                  className="py-1 text-xs font-bold rounded-lg transition-all text-m3-text dark:text-m3-dark-text hover:bg-m3-hover dark:hover:bg-m3-dark-hover flex items-center justify-center gap-0.5"
                  title="Aumentar Semitom"
                >
                  <span>#</span>
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Show/Hide Diagrams & Instrument select (only when chords are on) */}
          {showChords && (
            <div className="space-y-3 border-t border-m3-border/30 dark:border-m3-dark-border/30 pt-3 animate-in fade-in duration-200">
              {/* Chord Diagrams toggle */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-m3-secondary dark:text-m3-dark-secondary block">
                  Diagramas de Acordes:
                </span>
                <div className="flex bg-m3-sidebar dark:bg-m3-dark-sidebar p-0.5 rounded-xl border border-m3-border/30">
                  <button
                    onClick={() => updateSetting("showDiagrams", false)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      !showDiagrams
                        ? "bg-m3-primary text-white shadow-xs"
                        : "text-m3-secondary dark:text-m3-dark-secondary hover:text-m3-text"
                    }`}
                  >
                    Ocultar
                  </button>
                  <button
                    onClick={() => updateSetting("showDiagrams", true)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      showDiagrams
                        ? "bg-m3-primary text-white shadow-xs"
                        : "text-m3-secondary dark:text-m3-dark-secondary hover:text-m3-text"
                    }`}
                  >
                    Mostrar
                  </button>
                </div>
              </div>

              {/* Instrument select */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-m3-secondary dark:text-m3-dark-secondary block">
                  Instrumento de Acordes:
                </span>
                <div className="flex bg-m3-sidebar dark:bg-m3-dark-sidebar p-0.5 rounded-xl border border-m3-border/30">
                  <button
                    onClick={() => updateSetting("instrument", "guitar")}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      instrument === "guitar"
                        ? "bg-m3-primary text-white shadow-xs"
                        : "text-m3-secondary dark:text-m3-dark-secondary hover:text-m3-text"
                    }`}
                  >
                    Guitarra
                  </button>
                  <button
                    onClick={() => updateSetting("instrument", "piano")}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      instrument === "piano"
                        ? "bg-m3-primary text-white shadow-xs"
                        : "text-m3-secondary dark:text-m3-dark-secondary hover:text-m3-text"
                    }`}
                  >
                    Piano
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Font size */}
          <div className="flex items-center justify-between border-t border-m3-border/30 dark:border-m3-dark-border/30 pt-3">
            <span className="text-[11px] font-bold text-m3-secondary dark:text-m3-dark-secondary">
              Tamanho da Letra:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  updateSetting("fontSize", Math.max(10, fontSize - 1))
                }
                className="w-7 h-7 rounded-lg bg-m3-sidebar dark:bg-m3-dark-sidebar hover:bg-m3-hover dark:hover:bg-m3-dark-hover flex items-center justify-center text-xs font-black text-m3-secondary dark:text-m3-dark-secondary border border-m3-border/20 active:scale-90 transition-transform"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-black text-m3-text dark:text-m3-dark-text min-w-6 text-center">
                {fontSize}px
              </span>
              <button
                onClick={() =>
                  updateSetting("fontSize", Math.min(28, fontSize + 1))
                }
                className="w-7 h-7 rounded-lg bg-m3-sidebar dark:bg-m3-dark-sidebar hover:bg-m3-hover dark:hover:bg-m3-dark-hover flex items-center justify-center text-xs font-black text-m3-secondary dark:text-m3-dark-secondary border border-m3-border/20 active:scale-90 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Keep Screen Awake */}
          <div className="flex items-center justify-between border-t border-m3-border/30 dark:border-m3-dark-border/30 pt-3">
            <span className="text-[11px] font-bold text-m3-secondary dark:text-m3-dark-secondary flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" />
              Ecrã Sempre Ativo:
            </span>
            <button
              onClick={() => updateSetting("keepScreenAwake", !keepScreenAwake)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                keepScreenAwake
                  ? "bg-m3-primary"
                  : "bg-neutral-200 dark:bg-zinc-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform transform ${
                  keepScreenAwake ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── Renderer ────────────────────────────────────────────────────── */}
      <ChordProRenderer
        content={content}
        showChords={showChords}
        transposeVal={transposeVal}
        onTransposeChange={(val) => updateSetting("transposeVal", val)}
        fontSize={fontSize}
        instrument={instrument}
        showDiagrams={showDiagrams}
        showYoutubePlayer={showYoutubePlayer}
        onShowYoutubePlayerChange={(show) =>
          updateSetting("showYoutubePlayer", show)
        }
      />
    </div>
  );
});

export default ChordProPreview;
