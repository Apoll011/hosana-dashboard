/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrintTemplateFamily, TemplateFamilyInfo } from "./types";

export const TEMPLATE_FAMILIES: TemplateFamilyInfo[] = [
  {
    id: "modern",
    name: "Modern Minimal",
    namePt: "Moderno Minimalista",
    description:
      "Clean sans-serif typography, elegant pill badges, and refined dividers.",
    descriptionPt:
      "Tipografia moderna e limpa, etiquetas em pílula e divisores subtis.",
    badge: "Moderno",
    fontFamily: "font-sans",
    previewClass: "border-sky-500/40 bg-sky-50/30 dark:bg-sky-950/20",
  },
  {
    id: "classic",
    name: "Classic Liturgical",
    namePt: "Clássico Litúrgico",
    description:
      "Stately serif typography, double hairline dividers, and formal hymn structure.",
    descriptionPt:
      "Estilo tradicional com serifa, linhas duplas e apresentação solene.",
    badge: "Clássico",
    fontFamily: "font-serif",
    previewClass: "border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20",
  },
  {
    id: "contemporary",
    name: "Contemporary Stage",
    namePt: "Contemporâneo Palco",
    description:
      "High-contrast bold headers, large key/tempo indicators for musicians on stage.",
    descriptionPt:
      "Alto contraste com caixas de tom e andamento bem visíveis na estante.",
    badge: "Palco",
    fontFamily: "font-sans",
    previewClass: "border-slate-800 bg-slate-100 dark:bg-slate-800/40",
  },
  {
    id: "compact",
    name: "Compact Eco",
    namePt: "Compacto Económico",
    description:
      "Space-saving density, multi-column optimization to minimize paper usage.",
    descriptionPt:
      "Disposição condensada em 2 colunas para poupar papel nos boletins.",
    badge: "Económico",
    fontFamily: "font-sans",
    previewClass:
      "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20",
  },
];

export function getTemplateFamilyInfo(
  id: PrintTemplateFamily,
): TemplateFamilyInfo {
  return TEMPLATE_FAMILIES.find((f) => f.id === id) || TEMPLATE_FAMILIES[0];
}
