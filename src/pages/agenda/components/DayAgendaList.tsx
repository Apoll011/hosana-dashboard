/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users } from "lucide-react";
import React from "react";
import { AgendaService } from "../types";

interface DayAgendaListProps {
  services: AgendaService[];
  selectedServiceId: string | null;
  responsibilityCounts: Record<string, number>;
  onSelectService: (id: string) => void;
}

export const DayAgendaList: React.FC<DayAgendaListProps> = ({
  services,
  selectedServiceId,
  responsibilityCounts,
  onSelectService,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-m3-border rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-m3-secondary opacity-70">
          Agendas do dia
        </h3>
        <span className="text-[11px] font-black text-m3-secondary bg-m3-sidebar/60 rounded-full px-2 py-0.5">
          {services.length}
        </span>
      </div>

      {services.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
          Sem agendas para este dia.
        </p>
      ) : (
        <div className="space-y-2">
          {services.map((service) => {
            const isSelected = service.id === selectedServiceId;
            const count = responsibilityCounts[service.id] ?? 0;
            return (
              <button
                key={service.id}
                onClick={() => onSelectService(service.id)}
                className={`w-full text-left rounded-xl p-3 border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50"
                    : "border-transparent hover:bg-m3-hover"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-[#0284c7]" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                    {service.time}
                    <span className="font-bold truncate">{service.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {service.type}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
