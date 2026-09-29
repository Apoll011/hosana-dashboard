/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

type BadgeVariant =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  /** @deprecated Use accent */
  | "sky"
  /** @deprecated Use success */
  | "emerald"
  /** @deprecated Use warning */
  | "amber"
  /** @deprecated Use danger */
  | "rose"
  /** @deprecated Use neutral */
  | "slate";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_MAP: Record<string, string> = {
  accent: "bg-m3-primary/10 text-m3-primary border-m3-primary/20",
  sky: "bg-m3-primary/10 text-m3-primary border-m3-primary/20",
  success:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  emerald:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  amber:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  danger: "bg-m3-danger/10 text-m3-danger border-m3-danger/20",
  rose: "bg-m3-danger/10 text-m3-danger border-m3-danger/20",
  neutral: "bg-m3-hover text-m3-secondary border-m3-border",
  slate: "bg-m3-hover text-m3-secondary border-m3-border",
};

export const Badge: React.FC<BadgeProps> = React.memo(
  ({ children, variant = "accent", size = "sm", className = "" }) => {
    const sizeMap = {
      sm: "px-2 py-0.5 text-[11px] font-semibold",
      md: "px-2.5 py-1 text-xs font-semibold",
    };

    return (
      <span
        className={`inline-flex items-center rounded-[var(--radius-sm)] border ${VARIANT_MAP[variant]} ${sizeMap[size]} ${className}`}
      >
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";
