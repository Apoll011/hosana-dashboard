/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAvatarGradient, getInitials } from "@/src/utils";
import React from "react";
import { Assignee } from "../types";

interface AvatarStackProps {
  assignees: Assignee[];
  max?: number;
  size?: "sm" | "md";
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  assignees,
  max = 3,
  size = "sm",
}) => {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  const visible = assignees.slice(0, max);
  const overflow = assignees.length - visible.length;

  if (assignees.length === 0) {
    return (
      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic">
        Por atribuir
      </span>
    );
  }

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((a) => (
        <div
          key={a.id}
          title={a.name}
          className={`${dim} rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center font-extrabold text-white shrink-0 bg-linear-to-tr ${getAvatarGradient(
            a.name,
          )}`}
        >
          {a.avatarUrl ? (
            <img
              src={a.avatarUrl}
              alt={a.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(a.name)
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={`${dim} rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-800 shrink-0`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
