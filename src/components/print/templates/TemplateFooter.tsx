/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import React from "react";
import { PrintOptions } from "../types";

interface TemplateFooterProps {
  options: PrintOptions;
  churchName?: string;
  ccli?: string;
  copyright?: string;
}

export const TemplateFooter: React.FC<TemplateFooterProps> = ({
  options,
  churchName,
  ccli,
  copyright,
}) => {
  const { t } = useI18n();
  const { customFooter, templateFamily } = options;
  const currentYear = new Date().getFullYear();

  const isClassic = templateFamily === "classic";
  const isContemporary = templateFamily === "contemporary";
  const isCompact = templateFamily === "compact";

  const defaultBrand = t("print.footer.defaultWorship");

  return (
    <footer
      className={`mt-8 pt-3 border-t text-[10px] text-slate-500 print:text-slate-600 print:mt-auto flex flex-wrap items-center justify-between gap-2 ${
        isClassic
          ? "font-serif border-double border-slate-300 italic"
          : isContemporary
            ? "font-mono border-slate-900 uppercase font-semibold text-[9px]"
            : isCompact
              ? "font-sans border-slate-200 mt-4 pt-1 text-[9px]"
              : "font-sans border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        {customFooter ? (
          <span>{customFooter}</span>
        ) : (
          <span>
            {churchName ? `${churchName} • ` : ""}
            {defaultBrand}
          </span>
        )}
        {ccli && <span>CCLI: {ccli}</span>}
        {copyright && <span>© {copyright}</span>}
      </div>

      <div className="flex items-center gap-2">
        <span>Hosana © {currentYear}</span>
      </div>
    </footer>
  );
};
