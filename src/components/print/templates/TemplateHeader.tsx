/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PrintOptions } from "../types";

interface TemplateHeaderProps {
  churchName?: string;
  churchLogo?: string | null;
  churchShortName?: string;
  accentColor?: string;
  title: string;
  subtitle?: string;
  metaBadge?: string;
  options: PrintOptions;
}

export const TemplateHeader: React.FC<TemplateHeaderProps> = ({
  churchName,
  churchLogo,
  churchShortName,
  accentColor = "#0284c7",
  title,
  subtitle,
  metaBadge,
  options,
}) => {
  const { templateFamily, showChurchHeader, showChurchLogo } = options;

  if (!showChurchHeader && !title) return null;

  // 1. CLASSIC LITURGICAL
  if (templateFamily === "classic") {
    return (
      <header className="border-b-2 border-slate-900 pb-3 mb-5 font-serif text-slate-900 print:text-black">
        {showChurchHeader && (churchName || churchLogo) && (
          <div className="flex flex-col items-center text-center pb-2 mb-2 border-b border-double border-slate-300">
            {showChurchLogo && churchLogo && (
              <img
                src={churchLogo}
                alt={churchName || "Logo"}
                className="h-12 w-auto max-w-[100px] object-contain mb-1.5 filter grayscale contrast-125"
              />
            )}
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-slate-700">
              {churchName || churchShortName}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <h1 className="text-2xl font-normal tracking-tight font-serif">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs italic text-slate-600 mt-0.5">{subtitle}</p>
            )}
          </div>
          {metaBadge && (
            <span className="text-xs italic border-b border-slate-400 pb-0.5">
              {metaBadge}
            </span>
          )}
        </div>
      </header>
    );
  }

  // 2. CONTEMPORARY STAGE
  if (templateFamily === "contemporary") {
    return (
      <header className="border-b-4 border-slate-950 pb-3 mb-5 font-sans text-slate-950 print:text-black">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {showChurchHeader && showChurchLogo && churchLogo && (
              <img
                src={churchLogo}
                alt={churchName || "Logo"}
                className="h-10 w-10 object-cover rounded-md border border-slate-900 shrink-0"
              />
            )}
            <div>
              {showChurchHeader && (churchName || churchShortName) && (
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-600">
                  {churchShortName || churchName}
                </span>
              )}
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none mt-0.5">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs font-semibold text-slate-700 mt-1 uppercase tracking-wide">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {metaBadge && (
            <div className="bg-slate-950 text-white print:border print:border-black print:text-black print:bg-slate-100 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider shrink-0 uppercase">
              {metaBadge}
            </div>
          )}
        </div>
      </header>
    );
  }

  // 3. COMPACT ECO
  if (templateFamily === "compact") {
    return (
      <header className="border-b border-slate-300 pb-2 mb-3 font-sans text-slate-900 print:text-black text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {showChurchHeader && showChurchLogo && churchLogo && (
              <img
                src={churchLogo}
                alt={churchName || "Logo"}
                className="h-6 w-6 object-contain rounded shrink-0"
              />
            )}
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight">{title}</span>
              {subtitle && (
                <span className="text-[11px] text-slate-600 ml-2">
                  — {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500">
            {showChurchHeader && (churchShortName || churchName) && (
              <span className="font-semibold uppercase tracking-wider">
                {churchShortName || churchName}
              </span>
            )}
            {metaBadge && (
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono">
                {metaBadge}
              </span>
            )}
          </div>
        </div>
      </header>
    );
  }

  // 4. MODERN MINIMAL (Default)
  return (
    <header className="border-b border-slate-200 pb-4 mb-5 font-sans text-slate-900 print:text-black">
      <div className="flex items-start justify-between gap-4">
        <div>
          {showChurchHeader && (churchName || churchLogo) && (
            <div className="flex items-center gap-2 mb-1.5">
              {showChurchLogo && churchLogo && (
                <img
                  src={churchLogo}
                  alt={churchName || "Logo"}
                  className="h-6 w-auto max-w-[80px] object-contain rounded"
                />
              )}
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                {churchShortName || churchName}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 print:text-black">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 print:text-slate-700 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {metaBadge && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-800 print:border-slate-300 shrink-0">
            {metaBadge}
          </span>
        )}
      </div>
    </header>
  );
};
