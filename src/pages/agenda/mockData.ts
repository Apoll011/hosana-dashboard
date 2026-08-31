/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgendaState } from "./types";

/**
 * Seed data used the first time the agenda loads (empty storage). Feel free
 * to delete this once real data is flowing in — `useAgendaStorage` only
 * falls back to this when nothing is found under the storage key.
 */
export const DEFAULT_CATEGORIES: AgendaState["categories"] = {
  leader: { id: "leader", label: "Líder do Culto", icon: "mic", color: "amber" },
  musicians: { id: "musicians", label: "Músicos", icon: "music", color: "violet" },
  sound: { id: "sound", label: "Som", icon: "volume", color: "sky" },
  lighting: { id: "lighting", label: "Iluminação", icon: "light", color: "rose" },
  projection: { id: "projection", label: "Projeção", icon: "monitor", color: "cyan" },
  preacher: { id: "preacher", label: "Pregador", icon: "book", color: "indigo" },
  welcome: { id: "welcome", label: "Bem-vindos", icon: "heart", color: "emerald" },
};

const todayIso = new Date().toISOString().slice(0, 10);

export const MOCK_STATE: AgendaState = {
  categories: DEFAULT_CATEGORIES,
  services: {
    "svc-1": {
      id: "svc-1",
      date: todayIso,
      title: "Culto da Manhã",
      type: "Culto Dominical",
      time: "10:00",
      durationMinutes: 90,
      location: "Templo Principal",
      notes: "Levar instrumentos adicionais.",
      reminder: { enabled: true, label: "2 dias antes às 18:00" },
    },
    "svc-2": {
      id: "svc-2",
      date: todayIso,
      title: "Ensaio de Louvor",
      type: "Ensaio",
      time: "19:00",
      durationMinutes: 60,
      location: "Sala de Ensaios",
      notes: "",
      reminder: { enabled: false, label: "1 dia antes às 20:00" },
    },
  },
  responsibilities: {
    "resp-1": {
      id: "resp-1",
      serviceId: "svc-1",
      categoryId: "leader",
      assignees: [{ id: "u1", name: "Judson Weeden" }],
    },
    "resp-2": {
      id: "resp-2",
      serviceId: "svc-1",
      categoryId: "musicians",
      assignees: [
        { id: "u2", name: "Tiago Inês" },
        { id: "u3", name: "Mariana Weeden" },
        { id: "u4", name: "Carlos Silva" },
        { id: "u5", name: "Ana Lima" },
      ],
    },
    "resp-3": {
      id: "resp-3",
      serviceId: "svc-1",
      categoryId: "sound",
      assignees: [{ id: "u4", name: "Carlos Silva" }],
    },
    "resp-4": {
      id: "resp-4",
      serviceId: "svc-1",
      categoryId: "lighting",
      assignees: [{ id: "u6", name: "Mariana Costa" }],
    },
    "resp-5": {
      id: "resp-5",
      serviceId: "svc-1",
      categoryId: "projection",
      assignees: [{ id: "u2", name: "Tiago Inês" }],
    },
    "resp-6": {
      id: "resp-6",
      serviceId: "svc-1",
      categoryId: "preacher",
      assignees: [{ id: "u7", name: "Pr. João Mendes" }],
    },
    "resp-7": {
      id: "resp-7",
      serviceId: "svc-1",
      categoryId: "welcome",
      assignees: [
        { id: "u8", name: "Maria Santos" },
        { id: "u5", name: "Ana Lima" },
      ],
    },
  },
};
