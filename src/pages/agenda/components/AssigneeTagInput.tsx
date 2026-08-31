/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from "lucide-react";
import React, { useState } from "react";
import { getAvatarGradient, getInitials } from "../iconMap";
import { Assignee } from "../types";

interface AssigneeTagInputProps {
  assignees: Assignee[];
  onChange: (assignees: Assignee[]) => void;
}

/**
 * Minimal "type a name, press Enter" tag input — no user directory lookup,
 * just free text. Swap this for a real member picker once that's wired up.
 */
export const AssigneeTagInput: React.FC<AssigneeTagInputProps> = ({
  assignees,
  onChange,
}) => {
  const [draft, setDraft] = useState("");

  const addFromDraft = () => {
    const name = draft.trim();
    if (!name) return;
    onChange([
      ...assignees,
      { id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name },
    ]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {assignees.map((a) => (
          <span
            key={a.id}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white bg-linear-to-tr ${getAvatarGradient(
                a.name,
              )}`}
            >
              {getInitials(a.name)}
            </span>
            {a.name}
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
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addFromDraft();
            }
          }}
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
    </div>
  );
};
