/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { usePreviewSettings } from "@/src/hooks/usePreviewSettings";
import {
  Button,
  ChordProRenderer,
  Editor,
  EditorSettingsPanel,
  parseChordPro,
  Song,
  Spinner,
} from "@hosanna/shared";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Columns,
  EditIcon,
  Eye,
  EyeOff,
  File,
  HelpCircle,
  LayoutTemplate,
  Minus,
  PanelRight,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Settings2,
} from "lucide-react";
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HelpModal } from "../../components/modals/HelpModal";
import { useSong, useSongs } from "../../hooks/useSongs";

// --- Types for our Layout Management ---
type LayoutMode = "editor" | "split" | "preview";

export const SongEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: song, isLoading, isError, error } = useSong(id || null);
  const { updateSong, isUpdating } = useSongs();

  const [content, setContent] = useState("");

  // PERFORMANCE BOOST: useDeferredValue allows the Editor to update instantly (60fps)
  // while the heavy ChordPro parser/renderer updates in the background without blocking the UI thread.
  const deferredContent = useDeferredValue(content);

  // VS Code style layout management
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");

  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [showPreviewSettings, setShowPreviewSettings] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const { settings, updateSetting, resetSettings } = usePreviewSettings();
  const {
    showChords,
    transposeVal,
    fontSize,
    instrument,
    showDiagrams,
    showYoutubePlayer,
  } = settings;

  const isSavingRef = useRef(false);

  useEffect(() => {
    if (song) {
      setContent(song.content);
      setHasUnsavedChanges(false);
    }
  }, [song?.id]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleTranspose = useCallback(
    (delta: number) => {
      updateSetting("transposeVal", transposeVal + delta);
    },
    [transposeVal, updateSetting],
  );

  const handleSave = useCallback(
    async (updatedContent: string) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        const currentSong =
          queryClient.getQueryData<any>(["song", song?.id]) || song;
        if (!currentSong) return;

        const parsed = parseChordPro(updatedContent);
        const meta = parsed.metadata;

        const updates: Partial<Song> = {
          content: updatedContent,
          updatedAt: currentSong.updatedAt,
        };

        if (meta.title) updates.title = meta.title;
        if (meta.artist) updates.artist = meta.artist;
        if (meta.songNumber && Number(meta.songNumber))
          updates.song_number = Number(meta.songNumber);

        await updateSong({ id: currentSong.id, data: updates });
        setHasUnsavedChanges(false);
      } finally {
        isSavingRef.current = false;
      }
    },
    [song, queryClient, updateSong],
  );

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
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Cântico Não Encontrado
        </h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          {error
            ? (error as Error).message
            : "O cântico solicitado não existe ou foi apagado."}
        </p>
        <Button
          variant="primary"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => {
            window.history.length > 2 ? navigate(-1) : navigate("/folders");
          }}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-m3-sidebar/10">
      {/* ========================================================= */}
      {/* GLOBAL NAVBAR (Activity Bar - Handles Layout & Global Save) */}
      {/* ========================================================= */}
      <div className="h-14 bg-m3-sidebar border-b border-m3-border flex items-center justify-between px-4 shrink-0 gap-4">
        {/* Left: Breadcrumb / Status */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-1 -ml-2"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4 text-m3-secondary" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-m3-text flex items-center gap-1.5">
                <File className="w-3.5 h-3.5 text-m3-primary" />
                {song.title || "Sem Título"}
              </span>
              {hasUnsavedChanges && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                  title="Alterações não guardadas"
                />
              )}
            </div>
          </div>
        </div>

        {/* Center: VS Code Style View Toggles */}
        <div className="hidden md:flex bg-m3-card/50 border border-m3-border rounded-lg p-0.5">
          <button
            onClick={() => setLayoutMode("editor")}
            className={`p-1.5 rounded-md transition-all ${layoutMode === "editor" ? "bg-m3-primary/10 text-m3-primary shadow-sm" : "text-m3-secondary hover:bg-m3-hover"}`}
            title="Apenas Editor"
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayoutMode("split")}
            className={`p-1.5 rounded-md transition-all ${layoutMode === "split" ? "bg-m3-primary/10 text-m3-primary shadow-sm" : "text-m3-secondary hover:bg-m3-hover"}`}
            title="Dividir Ecrã"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayoutMode("preview")}
            className={`p-1.5 rounded-md transition-all ${layoutMode === "preview" ? "bg-m3-primary/10 text-m3-primary shadow-sm" : "text-m3-secondary hover:bg-m3-hover"}`}
            title="Apenas Prévia"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Global Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-lg transition-all"
            title="Ajuda ChordPro"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

          <Button
            variant="primary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            isLoading={isUpdating}
            onClick={() => handleSave(content)}
            className="rounded-xl font-bold text-xs h-8 ml-2"
          >
            Guardar
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE (Split Panes)                            */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* --- EDITOR PANE --- */}
        {(layoutMode === "split" || layoutMode === "editor") && (
          <div
            className={`flex flex-col h-1/2 md:h-full transition-all duration-300 relative bg-m3-card ${layoutMode === "split" ? "md:w-1/2 md:border-r border-m3-border" : "w-full"}`}
          >
            {/* Editor Tab Header */}
            <div className="h-9 bg-m3-sidebar/30 border-b border-m3-border flex items-center justify-between px-3 shrink-0">
              <span className="text-[10px] font-semibold text-m3-secondary uppercase tracking-wider flex items-center gap-1.5">
                <EditIcon className="w-3 h-3" />
                Código
              </span>
              <button
                onClick={() => setShowEditorSettings(!showEditorSettings)}
                className={`p-1 rounded transition-colors ${showEditorSettings ? "bg-m3-primary/10 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"}`}
                title="Definições do Editor"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contextual Editor Settings Modal */}
            <EditorSettingsPanel
              isOpen={showEditorSettings}
              onClose={() => setShowEditorSettings(false)}
            />

            <div className="flex-1 overflow-hidden relative">
              <Editor
                value={content}
                onChange={(val) => {
                  setContent(val);
                  setHasUnsavedChanges(true);
                }}
                readOnly={readOnly}
                onSave={handleSave}
                mode="chordpro"
              />
            </div>
          </div>
        )}

        {/* --- PREVIEW PANE --- */}
        {(layoutMode === "split" || layoutMode === "preview") && (
          <div
            className={`flex flex-col h-1/2 md:h-full transition-all duration-300 relative bg-m3-card ${layoutMode === "split" ? "md:w-1/2" : "w-full"}`}
          >
            {/* Preview Tab Header */}
            <div className="h-9 bg-m3-sidebar/30 border-b border-m3-border flex items-center justify-between px-3 shrink-0">
              <span className="text-[10px] font-semibold text-m3-secondary uppercase tracking-wider flex items-center gap-1.5">
                <LayoutTemplate className="w-3 h-3" />
                Prévia Visual
              </span>
              <button
                onClick={() => setShowPreviewSettings(!showPreviewSettings)}
                className={`p-1 rounded transition-colors ${showPreviewSettings ? "bg-m3-primary/10 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"}`}
                title="Ajustes de Leitura"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contextual Preview Settings Popover (scoped to this pane) */}
            {showPreviewSettings && (
              <div className="absolute right-2 top-11 w-64 bg-m3-card dark:bg-m3-dark-card border border-m3-border dark:border-m3-dark-border rounded-xl shadow-2xl z-40 p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="border-b border-m3-border/30 pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-m3-text uppercase tracking-wider">
                    Ajustes Visuais
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetSettings}
                      className="text-m3-secondary hover:text-m3-primary transition-colors"
                      title="Repor predefinições"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Exibição */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-m3-secondary uppercase">
                    Exibição
                  </span>
                  <div className="flex bg-m3-sidebar p-0.5 rounded-lg border border-m3-border/30">
                    <button
                      onClick={() => updateSetting("showChords", false)}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${!showChords ? "bg-m3-primary text-white" : "text-m3-secondary hover:text-m3-text"}`}
                    >
                      <EyeOff className="w-3 h-3" /> Apenas Letra
                    </button>
                    <button
                      onClick={() => updateSetting("showChords", true)}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${showChords ? "bg-m3-primary text-white" : "text-m3-secondary hover:text-m3-text"}`}
                    >
                      <Eye className="w-3 h-3" /> Cifras
                    </button>
                  </div>
                </div>

                {showChords && (
                  <>
                    <div className="space-y-2 border-t border-m3-border/30 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-m3-secondary uppercase">
                          Transposição
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-m3-primary/10 text-m3-primary rounded font-mono">
                          {transposeVal > 0 ? `+${transposeVal}` : transposeVal}{" "}
                          semitons
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-m3-sidebar p-0.5 rounded-lg border border-m3-border/30">
                        <button
                          onClick={() => handleTranspose(-1)}
                          className="py-1 text-xs font-bold rounded-md hover:bg-m3-hover flex items-center justify-center text-m3-text"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateSetting("transposeVal", 0)}
                          className={`py-1 text-[10px] font-bold rounded-md ${transposeVal === 0 ? "bg-m3-primary text-white" : "text-m3-secondary hover:bg-m3-hover"}`}
                        >
                          Original
                        </button>
                        <button
                          onClick={() => handleTranspose(1)}
                          className="py-1 text-xs font-bold rounded-md hover:bg-m3-hover flex items-center justify-center text-m3-text"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-m3-border/30 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-m3-secondary uppercase">
                          Diagramas
                        </span>
                        <div className="flex bg-m3-sidebar p-0.5 rounded-lg border border-m3-border/30 w-24">
                          <button
                            onClick={() => updateSetting("showDiagrams", false)}
                            className={`flex-1 py-1 text-[9px] font-bold rounded-md ${!showDiagrams ? "bg-m3-primary text-white" : "text-m3-secondary"}`}
                          >
                            Off
                          </button>
                          <button
                            onClick={() => updateSetting("showDiagrams", true)}
                            className={`flex-1 py-1 text-[9px] font-bold rounded-md ${showDiagrams ? "bg-m3-primary text-white" : "text-m3-secondary"}`}
                          >
                            On
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-m3-secondary uppercase">
                          Instrumento
                        </span>
                        <div className="flex bg-m3-sidebar p-0.5 rounded-lg border border-m3-border/30 w-32">
                          <button
                            onClick={() =>
                              updateSetting("instrument", "guitar")
                            }
                            className={`flex-1 py-1 text-[9px] font-bold rounded-md ${instrument === "guitar" ? "bg-m3-primary text-white" : "text-m3-secondary"}`}
                          >
                            Guitar
                          </button>
                          <button
                            onClick={() => updateSetting("instrument", "piano")}
                            className={`flex-1 py-1 text-[9px] font-bold rounded-md ${instrument === "piano" ? "bg-m3-primary text-white" : "text-m3-secondary"}`}
                          >
                            Piano
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between border-t border-m3-border/30 pt-3">
                  <span className="text-[10px] font-bold text-m3-secondary uppercase">
                    Tamanho Letra
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateSetting("fontSize", Math.max(10, fontSize - 1))
                      }
                      className="w-6 h-6 rounded-md bg-m3-sidebar hover:bg-m3-hover flex items-center justify-center border border-m3-border/20"
                    >
                      <Minus className="w-3 h-3 text-m3-secondary" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-m3-text min-w-5 text-center">
                      {fontSize}
                    </span>
                    <button
                      onClick={() =>
                        updateSetting("fontSize", Math.min(28, fontSize + 1))
                      }
                      className="w-6 h-6 rounded-md bg-m3-sidebar hover:bg-m3-hover flex items-center justify-center border border-m3-border/20"
                    >
                      <Plus className="w-3 h-3 text-m3-secondary" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              className="flex-1 overflow-auto bg-m3-card relative"
              onClick={() =>
                showPreviewSettings && setShowPreviewSettings(false)
              }
            >
              <ChordProRenderer
                content={deferredContent} // PERFORMANCE: Re-renders softly while user types
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
          </div>
        )}
      </div>
    </div>
  );
};
