/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Input,
  Modal,
  ServiceElement,
  Song,
  Spinner,
} from "@hosanna/shared";
import {
  FreeUseBibleApi,
  type ApiTranslation,
  type ApiTranslationBookChapter,
  type BookId,
} from "free-use-bible-api";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Edit3,
  FileText,
  GripVertical,
  Loader2,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Music,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useService, useServices } from "../../hooks/useServices";
import { useSongs } from "../../hooks/useSongs";

const gold = "#0284c7";
const goldSoft = "#e0f2fe";
const cream = "#f8fafc";
const border = "#cbd5e1";
const navy = "#1d1b20";

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
  jo: "JHN",
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

// ── Element badge helper ──────────────────────────────────────────────
const getElementBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case "song":
      return { label: "Cântico", bg: goldSoft, color: gold, icon: Music };
    case "welcome":
      return {
        label: "Boas-vindas",
        bg: "#EBF5FF",
        color: "#1D4ED8",
        icon: FileText,
      };
    case "scripture":
      return {
        label: "Escritura",
        bg: "#FDF4FF",
        color: "#C026D3",
        icon: BookOpen,
      };
    case "message":
      return {
        label: "Mensagem",
        bg: "#FEF3C7",
        color: "#D97706",
        icon: MessageSquare,
      };
    case "reading":
      return {
        label: "Leitura",
        bg: "#F3E8FF",
        color: "#7E22CE",
        icon: FileText,
      };
    case "announcement":
      return {
        label: "Avisos",
        bg: "#ECFDF5",
        color: "#059669",
        icon: Megaphone,
      };
    default:
      return {
        label: type || "Elemento",
        bg: "#F1F5F9",
        color: "#475569",
        icon: FileText,
      };
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── SortableRow component ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface SortableRowProps {
  id: string;
  element: ServiceElement;
  song?: Song;
  index: number;
  onRemove: (elementId: string) => void;
  onEdit: (element: ServiceElement) => void;
  onNoteChange: (elementId: string, note: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
  id,
  element,
  song,
  index,
  onRemove,
  onEdit,
  onNoteChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [localNote, setLocalNote] = useState(element.notes || "");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setLocalNote(element.notes || ""), [element.notes]);

  const isSong = element.type === "song";
  const badge = getElementBadge(element.type);
  const Icon = badge.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: isDragging ? gold : border }}
      className={`bg-white rounded-2xl border transition-shadow ${
        isDragging ? "shadow-lg z-20 opacity-90" : "shadow-none"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
          title="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold text-slate-400 w-4 shrink-0 text-center">
          {index + 1}
        </span>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: navy }}
            >
              {isSong
                ? song
                  ? song.title
                  : "Cântico Desconhecido"
                : element.title || "Elemento Sem Título"}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
          {isSong ? (
            <p className="text-xs text-slate-400 truncate">
              {song ? song.artist || "—" : "—"}
            </p>
          ) : (
            <>
              {element.passage && (
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {element.passage}
                </p>
              )}
              {element.content && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {element.content}
                </p>
              )}
            </>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 text-slate-300 hover:text-slate-500 rounded-lg cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border py-1"
                style={{ borderColor: border }}
              >
                {!isSong && (
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(element);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNote(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {element.notes ? "Editar Notas" : "Adicionar Notas"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(element.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {(isEditingNote || element.notes) && (
        <div className="px-4 pb-3">
          {isEditingNote ? (
            <div
              className="flex items-center gap-2 pt-2 border-t"
              style={{ borderColor: border }}
            >
              <input
                type="text"
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder="Ex: Introdução ao piano, repetir refrão 2x..."
                className="flex-1 text-xs rounded-lg border px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: border, boxShadow: "none" }}
                autoFocus
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onNoteChange(element.id, localNote);
                  setIsEditingNote(false);
                }}
              >
                <Save className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div
              className="text-xs italic px-2.5 py-2 rounded-xl border"
              style={{
                backgroundColor: goldSoft,
                color: "#8A6A1F",
                borderColor: "#E9D9AE",
              }}
            >
              {element.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// ── Welcome Modal ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; notes: string }) => void;
  initial?: { title: string; content: string; notes: string };
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(
    initial?.title || "Boas-vindas & Oração Inicial",
  );
  const [content, setContent] = useState(initial?.content || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "Boas-vindas & Oração Inicial");
      setContent(initial?.content || "");
      setNotes(initial?.notes || "");
    }
  }, [isOpen, initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Boas-vindas & Oração">
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#EBF5FF" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#1D4ED8", color: "white" }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#1D4ED8" }}>
              Boas-vindas
            </p>
            <p className="text-[11px] text-slate-500">
              Momento de acolhimento e oração inicial do culto.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Boas-vindas & Oração Inicial"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Detalhes / Conteúdo
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ex: Saudação pelo pastor, oração de abertura..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: O pastor João faz a saudação..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title, content, notes });
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════
// ── Message Modal ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; notes: string }) => void;
  initial?: { title: string; content: string; notes: string };
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(initial?.title || "Mensagem / Sermão");
  const [content, setContent] = useState(initial?.content || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "Mensagem / Sermão");
      setContent(initial?.content || "");
      setNotes(initial?.notes || "");
    }
  }, [isOpen, initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mensagem / Sermão">
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#FEF3C7" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#D97706", color: "white" }}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#D97706" }}>
              Mensagem
            </p>
            <p className="text-[11px] text-slate-500">
              Sermão, pregação ou ensino principal do culto.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Título do Sermão
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: A Caminhar pela Fé"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Resumo / Pontos Principais
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ex: Introdução sobre fé, 3 pontos sobre confiança em Deus..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Pregador: Pastor João. Duração: ~30min."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title, content, notes });
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════
// ── Announcement Modal ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; notes: string }) => void;
  initial?: { title: string; content: string; notes: string };
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(initial?.title || "Avisos da Igreja");
  const [content, setContent] = useState(initial?.content || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "Avisos da Igreja");
      setContent(initial?.content || "");
      setNotes(initial?.notes || "");
    }
  }, [isOpen, initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Avisos da Igreja">
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#ECFDF5" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#059669", color: "white" }}
          >
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#059669" }}>
              Avisos
            </p>
            <p className="text-[11px] text-slate-500">
              Comunicações e anúncios da comunidade.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Avisos da Semana"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Lista de Avisos
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              "Ex:\n• Ensaio do coral: sábado às 15h\n• Retiro da juventude: 15-17 de Setembro\n• Culto especial: próximo domingo"
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Responsável: Diácono Pedro"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title, content, notes });
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════
// ── Reading Modal ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface ReadingModalProps {
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

const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(initial?.title || "Leitura Responsiva");
  const [content, setContent] = useState(initial?.content || "");
  const [passage, setPassage] = useState(initial?.passage || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "Leitura Responsiva");
      setContent(initial?.content || "");
      setPassage(initial?.passage || "");
      setNotes(initial?.notes || "");
    }
  }, [isOpen, initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leitura Responsiva">
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#F3E8FF" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#7E22CE", color: "white" }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#7E22CE" }}>
              Leitura Responsiva
            </p>
            <p className="text-[11px] text-slate-500">
              Leitura alternada entre dirigente e congregação.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Leitura Responsiva"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Passagem
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            placeholder="Ex: Salmos 136"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Conteúdo da Leitura
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ex: Dirigente: Rendei graças ao Senhor&#10;Congregação: Porque ele é bom..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Dirigente: irmã Maria"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title, content, passage, notes });
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════
// ── Custom Element Modal ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; notes: string }) => void;
  initial?: { title: string; content: string; notes: string };
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "");
      setContent(initial?.content || "");
      setNotes(initial?.notes || "");
    }
  }, [isOpen, initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Elemento Personalizado">
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#F1F5F9" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#475569", color: "white" }}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#475569" }}>
              Personalizado
            </p>
            <p className="text-[11px] text-slate-500">
              Crie qualquer elemento de culto que precisar.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Oração de Intercessão, Santa Ceia..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Detalhes / Conteúdo
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descreva o conteúdo deste momento..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas
            <span className="font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionais..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title, content, notes });
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

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

const ScriptureModal: React.FC<ScriptureModalProps> = ({
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
                borderColor: accepted ? "#BBF7D0" : border,
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

// ══════════════════════════════════════════════════════════════════════
// ── Main Page ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

type ModalType =
  | "welcome"
  | "scripture"
  | "message"
  | "reading"
  | "announcement"
  | "custom"
  | null;

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading, isError } = useService(id || null);
  const { updateElements, updateService } = useServices();
  const { songsQuery } = useSongs({ limit: 200 });

  const [elements, setElements] = useState<ServiceElement[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingElement, setEditingElement] = useState<ServiceElement | null>(
    null,
  );

  useEffect(() => {
    if (service) {
      setGeneralNotes(service.notes || "");
      const sortedElements = [...(service.elements || [])].sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );
      setElements(sortedElements);
    }
  }, [service]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" label="A carregar plano de culto..." />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
        <h2 className="text-lg font-bold" style={{ color: navy }}>
          Plano de Culto Não Encontrado
        </h2>
        <Button
          variant="primary"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
      </div>
    );
  }

  const allAvailableSongs = songsQuery.data?.songs || [];
  const addedSongIds = new Set(
    elements.filter((e) => e.type === "song").map((e) => e.songId),
  );

  const filteredLibrarySongs = allAvailableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      (s.artist || "").toLowerCase().includes(librarySearch.toLowerCase()),
  );

  const syncElements = async (newElements: ServiceElement[]) => {
    const updated = newElements.map((e, index) => ({ ...e, position: index }));
    setElements(updated);
    await updateElements({
      serviceId: service.id,
      data: { elements: updated, updatedAt: service.updatedAt },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((item) => item.id === active.id);
      const newIndex = elements.findIndex((item) => item.id === over.id);
      const updated = arrayMove(elements, oldIndex, newIndex);
      await syncElements(updated);
    }
  };

  const handleRemoveElement = async (elementId: string) => {
    const nextElements = elements.filter((e) => e.id !== elementId);
    await syncElements(nextElements);
  };

  const handleNoteChange = async (elementId: string, note: string) => {
    const nextElements = elements.map((e) =>
      e.id === elementId ? { ...e, notes: note } : e,
    );
    await syncElements(nextElements);
  };

  const handleSaveGeneralNotes = async () => {
    await updateService({
      id: service.id,
      data: { notes: generalNotes },
    });
  };

  const handleAddSongToService = async (songId: string) => {
    const newElem: ServiceElement = {
      id: crypto.randomUUID(),
      type: "song",
      title: "Cântico",
      songId: songId,
      position: elements.length,
    };
    await syncElements([...elements, newElem]);
  };

  // ── Modal openers ────────────────────────────────────────────────
  const openAddModal = (type: ModalType) => {
    setEditingElement(null);
    setActiveModal(type);
  };

  const openEditModal = (element: ServiceElement) => {
    setEditingElement(element);
    const t = element.type as ModalType;
    // Map known types to their modals; unknown types go to custom
    const knownTypes: ModalType[] = [
      "welcome",
      "scripture",
      "message",
      "reading",
      "announcement",
      "custom",
    ];
    setActiveModal(knownTypes.includes(t) ? t : "custom");
  };

  // ── Generic save handler ────────────────────────────────────────
  const handleModalSave = async (
    type: string,
    data: { title: string; content?: string; passage?: string; notes?: string },
  ) => {
    let nextElements = [...elements];

    if (editingElement) {
      nextElements = nextElements.map((e) =>
        e.id === editingElement.id
          ? {
              ...e,
              title: data.title,
              content: data.content || "",
              passage: data.passage || "",
              notes: data.notes || "",
            }
          : e,
      );
    } else {
      const newElem: ServiceElement = {
        id: crypto.randomUUID(),
        type,
        title: data.title,
        content: data.content || "",
        passage: data.passage || "",
        notes: data.notes || "",
        position: elements.length,
      };
      nextElements.push(newElem);
    }

    await syncElements(nextElements);
    setActiveModal(null);
    setEditingElement(null);
  };

  // ── Initial data for editing ────────────────────────────────────
  const editInitial = editingElement
    ? {
        title: editingElement.title,
        content: editingElement.content || "",
        passage: editingElement.passage || "",
        notes: editingElement.notes || "",
      }
    : undefined;

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col"
      style={{ backgroundColor: cream }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: navy }}
          >
            {service.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Arraste os elementos e cânticos para reordenar o culto.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 h-full min-h-0">
        <div
          className="bg-white rounded-3xl border shadow-sm flex flex-col h-full min-h-0"
          style={{ borderColor: border }}
        >
          <div
            className="p-5 pb-4 border-b shrink-0"
            style={{ borderColor: border }}
          >
            <h2 className="text-base font-bold mb-3" style={{ color: navy }}>
              Biblioteca de Cânticos
            </h2>
            <Input
              ref={searchInputRef as any}
              placeholder="Pesquisar cânticos..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div
            className="overflow-y-auto flex-1 min-h-0 divide-y"
            style={{ borderColor: border }}
          >
            {filteredLibrarySongs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum cântico encontrado.
              </div>
            ) : (
              filteredLibrarySongs.map((s) => {
                const isAdded = addedSongIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: navy }}
                      >
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {s.artist || "—"}
                      </p>
                    </div>

                    {isAdded ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: "#EAF6EE", color: "#2E8B4F" }}
                      >
                        <Check className="w-3 h-3" />
                        Na Lista
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddSongToService(s.id)}
                        className="p-1.5 rounded-lg shrink-0 cursor-pointer transition-colors hover:bg-sky-200"
                        style={{ backgroundColor: goldSoft, color: gold }}
                        title="Adicionar ao plano"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full min-h-0">
          <div
            className="bg-white rounded-2xl border p-4 space-y-2 shrink-0"
            style={{ borderColor: border }}
          >
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-bold flex items-center gap-1.5"
                style={{ color: navy }}
              >
                <FileText className="w-4 h-4" style={{ color: gold }} />
                Notas Gerais do Culto
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveGeneralNotes}
              >
                <Save className="w-3.5 h-3.5" style={{ color: gold }} />
                Guardar
              </Button>
            </div>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Horário do ensaio: 8:30. Mensagem do pastor: A Caminhar pela Fé."
              className="w-full text-xs rounded-xl border p-3 bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: border }}
            />
          </div>

          <div
            className="bg-white rounded-3xl border shadow-sm flex flex-col flex-1 min-h-0"
            style={{ borderColor: border }}
          >
            <div
              className="flex flex-wrap items-center justify-between px-5 py-4 border-b gap-2 shrink-0"
              style={{ borderColor: border }}
            >
              <h2 className="text-base font-bold" style={{ color: navy }}>
                Plano do Culto
                <span className="ml-2 text-xs font-medium text-slate-400">
                  ({elements.length} {elements.length === 1 ? "item" : "itens"})
                </span>
              </h2>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openAddModal("welcome")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  + Boas-vindas
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal("scripture")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 cursor-pointer transition-colors"
                >
                  + Escritura
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal("message")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer transition-colors"
                >
                  + Mensagem
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal("announcement")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer transition-colors"
                >
                  + Avisos
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col">
              {elements.length === 0 ? (
                <div
                  className="p-8 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 shrink-0"
                  style={{ borderColor: border }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: goldSoft, color: gold }}
                  >
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: navy }}>
                      O plano ainda está vazio
                    </h4>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={elements.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2.5">
                      {elements.map((element, index) => {
                        const songObj =
                          element.type === "song"
                            ? allAvailableSongs.find(
                                (s) => s.id === element.songId,
                              )
                            : undefined;
                        return (
                          <SortableRow
                            key={element.id}
                            id={element.id}
                            element={element}
                            song={songObj}
                            index={index}
                            onRemove={handleRemoveElement}
                            onEdit={openEditModal}
                            onNoteChange={handleNoteChange}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <div className="flex gap-2 mt-auto pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => searchInputRef.current?.focus()}
                  className="flex-1 py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ borderColor: border, color: gold }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Cântico
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal("custom")}
                  className="flex-1 py-3 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 text-slate-600"
                  style={{ borderColor: border }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Outro/Personalizado
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Specialized Modals ────────────────────────────────────── */}

      <WelcomeModal
        isOpen={activeModal === "welcome"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("welcome", data)}
        initial={editInitial}
      />

      <ScriptureModal
        isOpen={activeModal === "scripture"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("scripture", data)}
        initial={editInitial}
      />

      <MessageModal
        isOpen={activeModal === "message"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("message", data)}
        initial={editInitial}
      />

      <ReadingModal
        isOpen={activeModal === "reading"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("reading", data)}
        initial={editInitial}
      />

      <AnnouncementModal
        isOpen={activeModal === "announcement"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("announcement", data)}
        initial={editInitial}
      />

      <CustomModal
        isOpen={activeModal === "custom"}
        onClose={() => {
          setActiveModal(null);
          setEditingElement(null);
        }}
        onSave={(data) => handleModalSave("custom", data)}
        initial={editInitial}
      />
    </div>
  );
};
