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
  /**
   * Better Auth organization member id (`organization.members[].id`) when
   * this assignee is an org member. Absent for manually-typed assignees.
   */
  memberId?: string;
  /** Optional avatar image URL. Falls back to initials when absent. */
  avatarUrl?: string;
}

/**
 * A "role" that can be assigned to an event — e.g. "Líder do Culto",
 * "Músicos", "Som". Reusable across events (this is the master list
 * managed from the Settings → General "Responsabilidades" card).
 */
export interface ResponsibilityCategory {
  id: string;
  label: string;
  icon: ResponsibilityIconKey;
  color: ResponsibilityColor;
}

/**
 * A category assigned to one specific event, with its assignees.
 * Lives inside its `AgendaEvent` (see `AgendaEvent.responsibilities`), so it
 * doesn't need to know which event it belongs to.
 */
export interface Responsibility {
  id: string;
  categoryId: string;
  assignees: Assignee[];
}

export interface ReminderSettings {
  enabled: boolean;
  /** Human label, e.g. "2 dias antes às 18:00". Kept as free text for now. */
  label: string;
}

/**
 * A calendar entry in the Agenda: "there's an Event on this day, at this
 * time, for this long" — e.g. a Culto, an Ensaio, a team meeting.
 *
 * This is deliberately NOT the same thing as the `Service` type in
 * `@/src/types` (that one is an order-of-worship — a `name`, a `date`, and
 * an ordered list of `elements` like songs/scripture/announcements). An
 * Event is just a calendar slot: it MAY be linked to an order of worship
 * through `linkedServiceId`, but it doesn't have to be. A given Sunday
 * morning culto typically has both an Event (this type) and, usually, an
 * order of worship (their `Service`).
 */
export interface AgendaEvent {
  id: string;
  /** ISO date string, yyyy-mm-dd, in local time. */
  date: string;
  title: string;
  /** Free-text event type, e.g. "Culto Dominical", "Ensaio de Louvor". */
  type: string;
  /** 24h time, "HH:mm". */
  time: string;
  durationMinutes: number;
  location?: string;
  notes?: string;
  reminder: ReminderSettings;
  /**
   * Optional link to an order-of-worship `Service.id` (`@/src/types`).
   * Set it to jump straight to `ServiceDetailPage` from the Agenda.
   */
  linkedServiceId?: string | null;
  /** Responsibilities assigned to this event (embedded — no `eventId` needed). */
  responsibilities: Responsibility[];
}

/** Shape persisted to storage. Kept flat/normalized (by id) on purpose. */
export interface AgendaState {
  events: Record<string, AgendaEvent>;
  categories: Record<string, ResponsibilityCategory>;
}
