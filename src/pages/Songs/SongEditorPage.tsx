/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordProPreviewSettings } from "@/src/components/ChorproSettings";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { usePreviewSettings } from "@/src/hooks/usePreviewSettings";
import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import {
  Button,
  ChordProRenderer,
  parseChordPro,
  Song,
  Spinner,
} from "@hosanna/shared";
import { Editor, EditorSettingsPanel } from "@hosanna/shared/editor";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Columns,
  EditIcon,
  File,
  HelpCircle,
  LayoutTemplate,
  PanelRight,
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
import { useParams } from "react-router-dom";
import { HelpModal } from "../../components/modals/HelpModal";
import { useAuth } from "../../contexts/AuthContext";
import { useSong, useSongs } from "../../hooks/useSongs";

type LayoutMode = "editor" | "split" | "preview";

export const SongEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { navigate } = useAppNavigate();
  const { organization } = useAuth();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const queryClient = useQueryClient();

  const { granted: canUpdateSong } = useCan("song.update");

  const { data: song, isLoading, isError, error } = useSong(id || null);
  const { updateSong, isUpdating } = useSongs();

  const [content, setContent] = useState("");

  const deferredContent = useDeferredValue(content);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(
    canUpdateSong ? "split" : "preview",
  );

  useEffect(() => {
    setLayoutMode(canUpdateSong ? "split" : "preview");
  }, [canUpdateSong]);

  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [showPreviewSettings, setShowPreviewSettings] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

  const handleSave = useCallback(
    async (updatedContent: string) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        const currentSong =
          queryClient.getQueryData<Song>(["song", song?.id]) || song;
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
        <Spinner size="lg" label="A carregar a pauta..." />
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
            if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate(`${slugPrefix}/folders`);
            }
          }}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-m3-sidebar/10">
      <div className="h-14 bg-m3-sidebar border-b border-m3-border flex items-center justify-between px-4 shrink-0 gap-4">
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

        <Can permission="song.update">
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
        </Can>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
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
                readOnly={!canUpdateSong}
                onSave={handleSave}
                mode="chordpro"
                fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <Spinner size="md" label="A carregar o editor..." />
                  </div>
                }
              />
            </div>
          </div>
        )}

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

            {showPreviewSettings && (
              <ChordProPreviewSettings
                settings={settings}
                updateSetting={updateSetting}
                resetSettings={resetSettings}
              />
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
