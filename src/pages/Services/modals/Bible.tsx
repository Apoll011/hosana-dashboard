import { Button, Modal } from "@hosanna/shared";
import {
  ApiTranslation,
  ApiTranslationBookChapter,
  BookId,
  FreeUseBibleApi,
} from "free-use-bible-api";
import { BookOpen, Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ── Bible API singleton ───────────────────────────────────────────────
const bibleApi = new FreeUseBibleApi({ useCache: true });

// Priority list – ARA first, then NVI, NTLH, ARK
const PRIORITY_TRANSLATIONS = ["ARA", "NVI", "NTLH", "ARK"];

function sortTranslations(translations: ApiTranslation[]): ApiTranslation[] {
  const priority = new Map(PRIORITY_TRANSLATIONS.map((id, i) => [id, i]));
  return [...translations].sort((a, b) => {
    const pa = priority.get(a.id) ?? 999;
    const pb = priority.get(b.id) ?? 999;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });
}

/** Extract plain text from a chapter response, filtering to the given verse range. */
function extractVerseText(
  chapter: ApiTranslationBookChapter,
  startVerse?: number,
  endVerse?: number,
): string {
  const lines: string[] = [];
  for (const item of chapter.chapter.content) {
    if (item.type === "verse") {
      if (startVerse !== undefined && item.number < startVerse) continue;
      if (endVerse !== undefined && item.number > endVerse) continue;
      const parts: string[] = [];
      for (const c of item.content) {
        if (typeof c === "string") parts.push(c);
        else if ("text" in c) parts.push(c.text);
        else if ("heading" in c) parts.push(c.heading);
      }
      lines.push(`${item.number} ${parts.join("")}`);
    }
  }
  return lines.join("\n");
}

/**
 * Parse a passage string like "Salmos 23:1-6", "Gn 1:1", "João 3:16"
 */
function parsePassageInput(input: string): ParsedPassage | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pattern: <book> <chapter>[:<startVerse>[-<endVerse>]]
  const match = trimmed.match(
    /^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/i,
  );
  if (!match) return null;

  const bookName = match[1].toLowerCase().trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : undefined;

  const bookId = BOOK_NAME_MAP[bookName];
  if (!bookId) return null;

  return { bookId, chapter, startVerse, endVerse, raw: trimmed };
}

// ── Book name → BookId mapping ────────────────────────────────────────
const BOOK_NAME_MAP: Record<string, BookId> = {
  // Portuguese names
  gênesis: "GEN",
  genesis: "GEN",
  gn: "GEN",
  gên: "GEN",
  êxodo: "EXO",
  exodo: "EXO",
  êx: "EXO",
  ex: "EXO",
  levítico: "LEV",
  levitico: "LEV",
  lv: "LEV",
  lev: "LEV",
  números: "NUM",
  numeros: "NUM",
  nm: "NUM",
  num: "NUM",
  deuteronômio: "DEU",
  deuteronomio: "DEU",
  dt: "DEU",
  deu: "DEU",
  josué: "JOS",
  josue: "JOS",
  js: "JOS",
  jos: "JOS",
  juízes: "JDG",
  juizes: "JDG",
  jz: "JDG",
  rute: "RUT",
  rt: "RUT",
  rut: "RUT",
  "1 samuel": "1SA",
  "1samuel": "1SA",
  "1sm": "1SA",
  "1 sm": "1SA",
  "2 samuel": "2SA",
  "2samuel": "2SA",
  "2sm": "2SA",
  "2 sm": "2SA",
  "1 reis": "1KI",
  "1reis": "1KI",
  "1rs": "1KI",
  "1 rs": "1KI",
  "2 reis": "2KI",
  "2reis": "2KI",
  "2rs": "2KI",
  "2 rs": "2KI",
  "1 crônicas": "1CH",
  "1 cronicas": "1CH",
  "1cr": "1CH",
  "1 cr": "1CH",
  "2 crônicas": "2CH",
  "2 cronicas": "2CH",
  "2cr": "2CH",
  "2 cr": "2CH",
  esdras: "EZR",
  ed: "EZR",
  esd: "EZR",
  neemias: "NEH",
  ne: "NEH",
  nee: "NEH",
  ester: "EST",
  et: "EST",
  est: "EST",
  jó: "JOB",
  jo: "JOB",
  job: "JOB",
  salmos: "PSA",
  salmo: "PSA",
  sl: "PSA",
  sal: "PSA",
  psa: "PSA",
  provérbios: "PRO",
  proverbios: "PRO",
  pv: "PRO",
  pro: "PRO",
  eclesiastes: "ECC",
  ec: "ECC",
  ecl: "ECC",
  cânticos: "SNG",
  canticos: "SNG",
  "cântico dos cânticos": "SNG",
  "cantico dos canticos": "SNG",
  ct: "SNG",
  cantares: "SNG",
  isaías: "ISA",
  isaias: "ISA",
  is: "ISA",
  isa: "ISA",
  jeremias: "JER",
  jr: "JER",
  jer: "JER",
  lamentações: "LAM",
  lamentacoes: "LAM",
  lm: "LAM",
  lam: "LAM",
  ezequiel: "EZK",
  ez: "EZK",
  eze: "EZK",
  daniel: "DAN",
  dn: "DAN",
  dan: "DAN",
  oséias: "HOS",
  oseias: "HOS",
  os: "HOS",
  hos: "HOS",
  joel: "JOL",
  jl: "JOL",
  amós: "AMO",
  amos: "AMO",
  am: "AMO",
  obadias: "OBA",
  ob: "OBA",
  oba: "OBA",
  jonas: "JON",
  jn: "JON",
  miquéias: "MIC",
  miqueias: "MIC",
  mq: "MIC",
  mic: "MIC",
  naum: "NAM",
  na: "NAM",
  nam: "NAM",
  habacuque: "HAB",
  hc: "HAB",
  hab: "HAB",
  sofonias: "ZEP",
  sf: "ZEP",
  sof: "ZEP",
  ageu: "HAG",
  ag: "HAG",
  hag: "HAG",
  zacarias: "ZEC",
  zc: "ZEC",
  zac: "ZEC",
  malaquias: "MAL",
  ml: "MAL",
  mal: "MAL",
  mateus: "MAT",
  mt: "MAT",
  mat: "MAT",
  marcos: "MRK",
  mc: "MRK",
  mrk: "MRK",
  lucas: "LUK",
  lc: "LUK",
  luk: "LUK",
  joão: "JHN",
  joao: "JHN",
  jhn: "JHN",
  atos: "ACT",
  at: "ACT",
  act: "ACT",
  romanos: "ROM",
  rm: "ROM",
  rom: "ROM",
  "1 coríntios": "1CO",
  "1 corintios": "1CO",
  "1co": "1CO",
  "1 co": "1CO",
  "2 coríntios": "2CO",
  "2 corintios": "2CO",
  "2co": "2CO",
  "2 co": "2CO",
  gálatas: "GAL",
  galatas: "GAL",
  gl: "GAL",
  gal: "GAL",
  efésios: "EPH",
  efesios: "EPH",
  ef: "EPH",
  eph: "EPH",
  filipenses: "PHP",
  fp: "PHP",
  fil: "PHP",
  colossenses: "COL",
  cl: "COL",
  col: "COL",
  "1 tessalonicenses": "1TH",
  "1 tessalonisenses": "1TH",
  "1ts": "1TH",
  "1 ts": "1TH",
  "2 tessalonicenses": "2TH",
  "2 tessalonisenses": "2TH",
  "2ts": "2TH",
  "2 ts": "2TH",
  "1 timóteo": "1TI",
  "1 timoteo": "1TI",
  "1tm": "1TI",
  "1 tm": "1TI",
  "2 timóteo": "2TI",
  "2 timoteo": "2TI",
  "2tm": "2TI",
  "2 tm": "2TI",
  tito: "TIT",
  tt: "TIT",
  tit: "TIT",
  filemom: "PHM",
  fm: "PHM",
  filemon: "PHM",
  hebreus: "HEB",
  hb: "HEB",
  heb: "HEB",
  tiago: "JAS",
  tg: "JAS",
  jas: "JAS",
  "1 pedro": "1PE",
  "1pedro": "1PE",
  "1pe": "1PE",
  "1 pe": "1PE",
  "2 pedro": "2PE",
  "2pedro": "2PE",
  "2pe": "2PE",
  "2 pe": "2PE",
  "1 joão": "1JN",
  "1 joao": "1JN",
  "1jo": "1JN",
  "1 jo": "1JN",
  "2 joão": "2JN",
  "2 joao": "2JN",
  "2jo": "2JN",
  "2 jo": "2JN",
  "3 joão": "3JN",
  "3 joao": "3JN",
  "3jo": "3JN",
  "3 jo": "3JN",
  judas: "JUD",
  jd: "JUD",
  jud: "JUD",
  apocalipse: "REV",
  ap: "REV",
  apo: "REV",
  rev: "REV",
};

interface ParsedPassage {
  bookId: BookId;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  raw: string;
}

// ══════════════════════════════════════════════════════════════════════
// ── Scripture Modal (Bible API integration) ───────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface ScriptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    passage: string;
    notes: string;
  }) => void;
  initial?: { title: string; content: string; passage: string; notes: string };
}

export const ScriptureModal: React.FC<ScriptureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(initial?.title || "Leitura Bíblica");
  const [passageInput, setPassageInput] = useState(initial?.passage || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  // Bible API state
  const [translations, setTranslations] = useState<ApiTranslation[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState("ARA");
  const [translationsLoading, setTranslationsLoading] = useState(false);

  const [fetchedText, setFetchedText] = useState<string | null>(null);
  const [fetchedPassageLabel, setFetchedPassageLabel] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Load translations on first open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setTranslationsLoading(true);
      try {
        const data = await bibleApi.getAvailableTranslations();
        if (!cancelled) {
          setTranslations(sortTranslations(data.translations));
        }
      } catch {
        // silently fail – translations list will be empty
      } finally {
        if (!cancelled) setTranslationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "Leitura Bíblica");
      setPassageInput(initial?.passage || "");
      setNotes(initial?.notes || "");
      setFetchedText(null);
      setFetchedPassageLabel("");
      setFetchError(null);
      setAccepted(false);
    }
  }, [isOpen, initial]);

  const handleSearch = useCallback(async () => {
    const parsed = parsePassageInput(passageInput);
    if (!parsed) {
      setFetchError(
        "Formato inválido. Use: Livro Capítulo:Versículo (ex: Salmos 23:1-6, João 3:16)",
      );
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchedText(null);
    setAccepted(false);

    try {
      const chapter = await bibleApi.getTranslationBookChapter(
        selectedTranslation,
        parsed.bookId,
        parsed.chapter,
      );

      const text = extractVerseText(
        chapter,
        parsed.startVerse,
        parsed.endVerse,
      );

      if (!text.trim()) {
        setFetchError("Nenhum versículo encontrado para essa passagem.");
      } else {
        const bookName = chapter.book.name || chapter.book.commonName;
        let label = `${bookName} ${parsed.chapter}`;
        if (parsed.startVerse !== undefined) {
          label += `:${parsed.startVerse}`;
          if (parsed.endVerse !== undefined) {
            label += `-${parsed.endVerse}`;
          }
        }
        label += ` (${selectedTranslation})`;
        setFetchedPassageLabel(label);
        setFetchedText(text);
      }
    } catch (err: any) {
      if (err?.message?.includes("404") || err?.status === 404) {
        setFetchError(
          "Passagem não encontrada. Verifique o livro, capítulo e versículos.",
        );
      } else {
        setFetchError(
          err?.message || "Erro ao buscar a passagem. Tente novamente.",
        );
      }
    } finally {
      setIsFetching(false);
    }
  }, [passageInput, selectedTranslation]);

  const handleAcceptPassage = () => {
    setAccepted(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      content: accepted ? fetchedText || "" : "",
      passage: accepted ? fetchedPassageLabel || passageInput : passageInput,
      notes,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leitura Bíblica"
      maxWidth="lg"
    >
      <div className="space-y-4 py-2">
        {/* Header Banner */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#FDF4FF" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#C026D3", color: "white" }}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#C026D3" }}>
              Escritura
            </p>
            <p className="text-[11px] text-slate-500">
              Pesquise uma passagem bíblica, escolha a tradução e adicione ao
              culto.
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Leitura Bíblica"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* Translation Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Tradução
          </label>
          <div className="relative">
            <select
              value={selectedTranslation}
              onChange={(e) => {
                setSelectedTranslation(e.target.value);
                setFetchedText(null);
                setAccepted(false);
              }}
              disabled={translationsLoading}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 appearance-none pr-8"
            >
              {translations.length === 0 && !translationsLoading && (
                <option value="ARA">ARA — Almeida Revista e Atualizada</option>
              )}
              {translations.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.name}
                  {t.language !== "por" && t.languageName
                    ? ` (${t.languageName})`
                    : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {translationsLoading && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />A carregar
              traduções...
            </p>
          )}
        </div>

        {/* Passage Input + Search */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Passagem Bíblica
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={passageInput}
              onChange={(e) => {
                setPassageInput(e.target.value);
                setFetchedText(null);
                setFetchError(null);
                setAccepted(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Ex: Salmos 23:1-6, João 3:16, Gênesis 1"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={isFetching || !passageInput.trim()}
            >
              {isFetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Buscar
            </Button>
          </div>
          <p className="text-[10px] text-slate-400">
            Formatos aceites: Salmos 23, João 3:16, Gênesis 1:1-5, Rm 8:28
          </p>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800/80">
            {fetchError}
          </div>
        )}

        {/* Fetched text preview */}
        {fetchedText && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {fetchedPassageLabel}
              </p>
              {!accepted ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptPassage}
                >
                  <Check className="w-3.5 h-3.5" />
                  Usar esta Passagem
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Check className="w-3 h-3" />
                  Aceite
                </span>
              )}
            </div>
            <div
              className="max-h-48 overflow-y-auto rounded-xl border p-3 text-xs leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: accepted ? "#F0FDF4" : "#FAFAFA",
                borderColor: accepted ? "#BBF7D0" : "#cbd5e1",
                color: "#374151",
              }}
            >
              {fetchedText}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Lida pelo diácono Carlos, congregação de pé..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
