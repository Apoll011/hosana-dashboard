/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Domain types for the Agenda (schedule) feature.
 *
 * These are intentionally storage-agnostic — nothing here knows about
 * localStorage, Prisma, or RxDB. That's on purpose: when it's time to wire
 * this up to the real backend, only `useAgendaStorage.ts` needs to change.
 */

export type ResponsibilityColor =
  | "amber"
  | "violet"
  | "sky"
  | "rose"
  | "emerald"
  | "cyan"
  | "slate"
  | "indigo";

/** Icon key — mapped to an actual lucide-react component in `iconMap.ts`. */
export type ResponsibilityIconKey =
  | "mic"
  | "music"
  | "volume"
  | "light"
  | "monitor"
  | "book"
  | "heart"
  | "users"
  | "camera"
  | "custom";

export interface Assignee {
  id: string;
  name: string;
  /** Optional avatar image URL. Falls back to initials when absent. */
  avatarUrl?: string;
}

/**
 * A "role" that can be assigned in a service — e.g. "Líder do Culto",
 * "Músicos", "Som". Reusable across services (this is the master list
 * managed from the "Responsabilidades" button).
 */
export interface ResponsibilityCategory {
  id: string;
  label: string;
  icon: ResponsibilityIconKey;
  color: ResponsibilityColor;
}

/** A category assigned to one specific service, with its assignees. */
export interface Responsibility {
  id: string;
  serviceId: string;
  categoryId: string;
  assignees: Assignee[];
}

export interface ReminderSettings {
  enabled: boolean;
  /** Human label, e.g. "2 dias antes às 18:00". Kept as free text for now. */
  label: string;
}

/**
 * A calendar entry in the Agenda: "there's a Culto on this day, at this
 * time, for this long". This is deliberately NOT the same thing as the
 * `Service` type in `@/src/types` (that one is an order-of-worship — a
 * `name`, a `date`, and an ordered list of `elements` like songs/scripture/
 * announcements). Two different concepts that happen to share a real-world
 * subject: a given Sunday morning culto has both a schedule entry (this
 * type) and, usually, an order of worship (their `Service`).
 *
 * `linkedServiceId` is the seam for connecting the two later: set it to an
 * `@/src/types` `Service.id` once you want "open order of worship" from
 * the Agenda to jump straight to `ServiceDetailPage`.
 */
export interface AgendaService {
  id: string;
  /** ISO date string, yyyy-mm-dd, in local time. */
  date: string;
  title: string;
  /** Free-text service type, e.g. "Culto Dominical", "Ensaio de Louvor". */
  type: string;
  /** 24h time, "HH:mm". */
  time: string;
  durationMinutes: number;
  location?: string;
  notes?: string;
  reminder: ReminderSettings;
  /** Optional link to the matching order-of-worship `Service.id`. */
  linkedServiceId?: string | null;
}

/** Shape persisted to storage. Kept flat/normalized (by id) on purpose. */
export interface AgendaState {
  services: Record<string, AgendaService>;
  responsibilities: Record<string, Responsibility>;
  categories: Record<string, ResponsibilityCategory>;
}
