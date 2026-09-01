import { Button, Modal } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { CifraResult } from "@/src/types";
import { getCifra } from "@/src/utils";
import { ConversionResult, convertToChordProDetailed } from "@hosanna/chordpro";
import React, { useState } from "react";

type Provider = "cifraclub" | "ultimateguitar";

function slugToName(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function detectProvider(rawUrl: string): Provider | null {
  try {
    const { hostname } = new URL(rawUrl.trim());
    if (hostname.includes("cifraclub.com.br")) return "cifraclub";
    if (hostname.includes("ultimate-guitar.com")) return "ultimateguitar";
  } catch {
    return null;
  }
  return null;
}

function parseUrlFallback(rawUrl: string): { artist: string; title: string } {
  try {
    const url = new URL(rawUrl.trim());
    const segments = url.pathname.split("/").filter(Boolean);
    const provider = detectProvider(rawUrl);

    if (provider === "cifraclub") {
      const [artistSlug, songSlug] = segments;
      return {
        artist: artistSlug ? slugToName(artistSlug) : "",
        title: songSlug ? slugToName(songSlug) : "",
      };
    }

    if (provider === "ultimateguitar") {
      // Ultimate Guitar tab paths typically look like /tab/{artist}/{song-name}-{tabId}
      const relevant = segments[0] === "tab" ? segments.slice(1) : segments;
      const artistSlug = relevant[0] || "";
      let songSlug = relevant[1] || "";

      // Remove common suffixes like "-chords-12345" or "-12345"
      songSlug = songSlug
        .replace(/-(chords|tab|tabs|ukulele|bass)?-?\d+$/i, "")
        .replace(/-chords$/i, "");

      return {
        artist: artistSlug ? slugToName(artistSlug) : "",
        title: songSlug ? slugToName(songSlug) : "",
      };
    }
  } catch {
    // Ignore URL parsing errors
  }

  return { artist: "", title: "" };
}

export const CifraClubImportModal: React.FC<{
  isOpen: boolean;
  handleClose: () => void;
  handleSave: (result: ConversionResult, artist: string, title: string) => void;
}> = ({ isOpen, handleClose, handleSave }) => {
  const { t } = useI18n();
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setUrlInput("");
    setError(null);
    setIsLoading(false);
    handleClose();
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    if (error) setError(null);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setError(t("modals.pleaseEnterLink"));
      return;
    }

    const provider = detectProvider(trimmedUrl);
    if (!provider) {
      setError(t("modals.pleaseEnterValidLink"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result: CifraResult = await getCifra(trimmedUrl);

      if (result.error || !result.cifra) {
        setError(
          t("modals.errorGetCifra", {
            error: result.error || t("modals.cifraNotFound"),
          }),
        );
        return;
      }

      const fallback = parseUrlFallback(trimmedUrl);
      const artist =
        result.artist?.trim() || fallback.artist || t("forms.unknownArtist");
      const title =
        result.name?.trim() || fallback.title || t("forms.untitled");

      const conversion = convertToChordProDetailed(result.cifra, {
        strictChordDetection: false,
      });

      handleSave(conversion, artist, title);
      resetAndClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("modals.unexpectedError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={t("modals.importCifraTitle")}
    >
      <form onSubmit={handleImport} className="space-y-5 py-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          {t("modals.pasteLink")}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800/80">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("modals.songLink")}
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={handleUrlInputChange}
            placeholder="https://www.cifraclub.com.br/... ou https://tabs.ultimate-guitar.com/..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
            autoFocus
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetAndClose}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading || !urlInput.trim()}
          >
            {isLoading ? t("modals.importing") : t("modals.importCifra")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
