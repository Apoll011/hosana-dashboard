import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CifraResult, getCifra, parseCifraClubInput } from '@/src/api/cifra';

export function CifraClubImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [artistSlug, setArtistSlug] = useState('');
  const [songSlug, setSongSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill artist and song when a URL is pasted
  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    setError(null);

    const parsed = parseCifraClubInput(val);
    if (parsed) {
      setArtistSlug(parsed.artist);
      setSongSlug(parsed.song);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    // Resolve final artist and song values
    let artist = artistSlug.trim();
    let song = songSlug.trim();

    if (!artist || !song) {
      const parsed = parseCifraClubInput(urlInput);
      if (parsed) {
        artist = parsed.artist;
        song = parsed.song;
      }
    }

    if (!artist || !song) {
      setError('Por favor, introduza um link válido do Cifra Club ou o Artista e Música.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result: CifraResult = await getCifra(artist, song);

      if (result.error) {
        setError(`Erro ao obter a cifra: ${result.error}`);
      } else {
        // Output result to console as requested
        console.log('🎵 CifraClub Import Result:', result);
        handleClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setUrlInput('');
    setArtistSlug('');
    setSongSlug('');
    setError(null);
    setIsLoading(false);
  };

  return (
    <>
      {/* Import Trigger Button */}
      <Button
        type="button"
        variant="primary"
        onClick={() => setIsOpen(true)}
      >
        Importar do Cifra Club
      </Button>

      {/* Import Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Importar Cifra do Cifra Club"
      >
        <form onSubmit={handleImport} className="space-y-5 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            Cole o link direto da página do Cifra Club ou especifique o artista e a música manualmente para extrair a cifra e os detalhes.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800/80">
              {error}
            </div>
          )}

          {/* Link Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Link da Música / Cifra
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={handleUrlInputChange}
              placeholder="https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
              ou especifique
            </span>
          </div>

          {/* Manual Slugs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Artista (Slug)
              </label>
              <input
                type="text"
                value={artistSlug}
                onChange={(e) => setArtistSlug(e.target.value)}
                placeholder="legiao-urbana"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Música (Slug)
              </label>
              <input
                type="text"
                value={songSlug}
                onChange={(e) => setSongSlug(e.target.value)}
                placeholder="tempo-perdido"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading || (!urlInput && (!artistSlug || !songSlug))}
            >
              {isLoading ? 'A Importar...' : 'Importar Cifra'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}