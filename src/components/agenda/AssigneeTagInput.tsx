/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { Assignee } from "@/src/pages/agenda/types";
import { getAvatarGradient, getInitials } from "@/src/utils";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface AssigneeTagInputProps {
  assignees: Assignee[];
  onChange: (assignees: Assignee[]) => void;
  /**
   * Manually-typed assignees (no `memberId`) already used in other events —
   * suggested so users don't have to retype names for every event. Their ids
   * are unstable; when picked, a fresh manual assignee is created for the name.
   */
  manualSuggestions?: Assignee[];
}

const manualId = () =>
  `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function Avatar({
  assignee,
  className,
}: {
  assignee: Assignee;
  className: string;
}) {
  return (
    <span
      className={`${className} rounded-full flex items-center justify-center font-extrabold text-white shrink-0 bg-linear-to-tr ${getAvatarGradient(
        assignee.name,
      )} overflow-hidden`}
    >
      {assignee.avatarUrl ? (
        <img
          src={assignee.avatarUrl}
          alt={assignee.name}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(assignee.name)
      )}
    </span>
  );
}

/**
 * "Type a name" tag input with suggestions:
 * - organization members (linked via `memberId`) are suggested as you type;
 * - manually-typed names still create a plain assignee (no `memberId`);
 * - previously used manual assignees (from any event) are suggested too.
 */
export const AssigneeTagInput: React.FC<AssigneeTagInputProps> = ({
  assignees,
  onChange,
  manualSuggestions = [],
}) => {
  const { organization } = useAuth();
  const [draft, setDraft] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const members = organization?.members ?? [];

  // Org members first, then manual assignees whose name doesn't collide with a
  // member (a member link always wins over a free-typed name).
  const suggestions = useMemo<Assignee[]>(() => {
    const memberNames = new Set(
      members.map((m) => m.user.name.trim().toLowerCase()),
    );
    const memberSuggestions: Assignee[] = members.map((m) => ({
      id: m.id,
      memberId: m.id,
      name: m.user.name,
      avatarUrl: m.user.image,
    }));
    const manual = manualSuggestions.filter(
      (a) => !memberNames.has(a.name.trim().toLowerCase()),
    );
    return [...memberSuggestions, ...manual];
  }, [members, manualSuggestions]);

  const q = draft.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? suggestions.filter((s) => s.name.toLowerCase().includes(q))
        : suggestions,
    [suggestions, q],
  );

  const isDuplicate = (a: Assignee) =>
    assignees.some((x) =>
      a.memberId && x.memberId
        ? x.memberId === a.memberId
        : x.name.trim().toLowerCase() === a.name.trim().toLowerCase(),
    );

  const addAssignee = (a: Assignee) => {
    if (!isDuplicate(a)) {
      onChange([...assignees, a.memberId ? a : { ...a, id: manualId() }]);
    }
    setDraft("");
    setOpen(false);
    setHighlight(0);
  };

  const addFromDraft = () => {
    const name = draft.trim();
    if (!name) return;
    addAssignee({ id: manualId(), name });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draft.trim() && filtered.length > 0) {
        addAssignee(filtered[highlight % filtered.length]);
      } else {
        addFromDraft();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) =>
        filtered.length ? (h - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Escape") {
      setOpen(false);
    } else {
      setOpen(true);
      setHighlight(0);
    }
  };

  // Close the dropdown when clicking anywhere outside the input.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={rootRef}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {assignees.map((a) => (
          <span
            key={a.id}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <Avatar assignee={a} className="w-5 h-5 text-[9px]" />
            {a.name}
            {a.memberId && (
              <span className="text-[9px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900/60 px-1.5 py-0.5 rounded-full">
                Membro
              </span>
            )}
            <button
              onClick={() => onChange(assignees.filter((x) => x.id !== a.id))}
              className="text-slate-400 hover:text-rose-500 cursor-pointer"
              title="Remover"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva um nome e prima Enter"
            className="flex-1 h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
          />
          <button
            type="button"
            onClick={addFromDraft}
            className="px-3 h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-m3-hover transition-colors cursor-pointer"
          >
            Adicionar
          </button>
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5">
            {filtered.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addAssignee(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  i === highlight
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Avatar assignee={s} className="w-6 h-6 text-[10px]" />
                <span className="flex-1 min-w-0 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {s.name}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 shrink-0">
                  {s.memberId ? "Membro" : "Outros eventos"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
