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
 *
 * The responsibility-category types (`ResponsibilityCategory`,
 * `ResponsibilityColor`, `ResponsibilityIconKey`) live in `@/src/types` and
 * are re-exported here for convenience — the master list is stored in the
 * org metadata (Settings → General → Responsabilidades), not in the agenda's
 * local storage.
 */

export type {
  ResponsibilityCategory,
  ResponsibilityColor,
  ResponsibilityIconKey,
} from "@/src/types";

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

/**
 * Shape persisted to the agenda's local storage. Kept flat/normalized (by id)
 * on purpose. Categories are NOT here — the master responsibility list lives
 * in the org metadata (`useOrgSettings`) and is read from there.
 */
export interface AgendaState {
  events: Record<string, AgendaEvent>;
}
