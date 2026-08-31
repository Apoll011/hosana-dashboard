/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgendaState } from "./types";

/**
 * Seed data used the first time the agenda loads (empty storage). Feel free
 * to delete this once real data is flowing in — `useAgendaStorage` only
 * falls back to this when nothing is found under the storage key.
 *
 * Responsibility categories are NOT here: the master list lives in the org
 * metadata (see `DEFAULT_ORG_SETTINGS.agenda.responsibilityCategories` in
 * `useOrgSettings`) and is seeded there once, if missing.
 */

const todayIso = new Date().toISOString().slice(0, 10);

export const MOCK_STATE: AgendaState = {
  events: {
    "evt-1": {
      id: "evt-1",
      date: todayIso,
      title: "Culto da Manhã",
      type: "Culto Dominical",
      time: "10:00",
      durationMinutes: 90,
      location: "Templo Principal",
      notes: "Levar instrumentos adicionais.",
      reminder: { enabled: true, label: "2 dias antes às 18:00" },
      responsibilities: [
        {
          id: "resp-1",
          categoryId: "leader",
          assignees: [{ id: "manual-u1", name: "Judson Weeden" }],
        },
        {
          id: "resp-2",
          categoryId: "musicians",
          assignees: [
            { id: "manual-u2", name: "Tiago Inês" },
            { id: "manual-u3", name: "Mariana Weeden" },
            { id: "manual-u4", name: "Carlos Silva" },
            { id: "manual-u5", name: "Ana Lima" },
          ],
        },
        {
          id: "resp-3",
          categoryId: "sound",
          assignees: [{ id: "manual-u4", name: "Carlos Silva" }],
        },
        {
          id: "resp-4",
          categoryId: "lighting",
          assignees: [{ id: "manual-u6", name: "Mariana Costa" }],
        },
        {
          id: "resp-5",
          categoryId: "projection",
          assignees: [{ id: "manual-u2", name: "Tiago Inês" }],
        },
        {
          id: "resp-6",
          categoryId: "preacher",
          assignees: [{ id: "manual-u7", name: "Pr. João Mendes" }],
        },
        {
          id: "resp-7",
          categoryId: "welcome",
          assignees: [
            { id: "manual-u8", name: "Maria Santos" },
            { id: "manual-u5", name: "Ana Lima" },
          ],
        },
      ],
    },
    "evt-2": {
      id: "evt-2",
      date: todayIso,
      title: "Ensaio de Louvor",
      type: "Ensaio",
      time: "19:00",
      durationMinutes: 60,
      location: "Sala de Ensaios",
      notes: "",
      reminder: { enabled: false, label: "1 dia antes às 20:00" },
      responsibilities: [],
    },
  },
};
