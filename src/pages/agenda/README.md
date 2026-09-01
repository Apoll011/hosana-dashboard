# Agenda page

UI-complete "Agenda" page (calendar + day list + events + responsibilities + details/notifications),
matching the Hosanna Studio look. Backed by the RxDB `agendaEvents` collection,
which replicates with the server over the same HTTP pull/push protocol as
`songs`, `folders` and `services` (see the agendaEvents replication contract).

## Files

```
AgendaPage.tsx              main page (drop into your router, e.g. next to FoldersPage/TeamsPage)
types.ts                    domain types (AgendaEvent, Responsibility, Category, Assignee...)
useAgenda.ts                ← the data hook. All CRUD goes through here (RxDB-backed).
components/
  MiniCalendar.tsx           month calendar with dots for days with events
  DayAgendaList.tsx          list of events for the selected day
  EventModals.tsx            all modals: create/edit event, add/edit
                             responsibility, edit reminder
  ResponsibilitiesPanel.tsx  responsibilities list for the selected event
  ResponsibilityRow.tsx      one responsibility row (icon, avatars, actions)
  AvatarStack.tsx            overlapping avatar circles
  AssigneeTagInput.tsx       member-aware "type a name" chip input with
                             suggestions (org members + previously used names)
  ServiceLinkField.tsx       searchable service picker + linked-service card
                             (used by the create/edit event modal)
  DetailsSidebar.tsx         details card + notifications/reminder card
  EventModals.tsx            all modals: create/edit event, add/edit
                             responsibility, edit reminder
```

The RxDB side lives in `src/db`:

```
schemas.ts      AgendaEventDocType + agendaEventSchema (mirrors the wire doc)
database.ts     registers the agendaEvents collection on the hosanadb instance
replication.ts  live pull/push replication for agendaEvents (services pushed
                first — linkedServiceId is a real FK, see §6 of the contract)
trash.ts        agenda events join the expired-trash purge sweep
validation.ts   validateAgendaEventRules (title/date/type/time/duration)
```

## Wiring it up

1. Copy the `agenda/` folder into your dashboard source, e.g.
   `src/pages/agenda/` (or wherever `FoldersPage.tsx`/`TeamsPage.tsx` live).
2. Add a route that renders `<AgendaPage />` (it's a self-contained page,
   no props required — same pattern as `TeamsPage`).
3. It imports `Button`, `Input`, `Modal` from `@/src/components/common` to
   stay visually consistent with the rest of the app — adjust the import
   path if yours differs.
4. Strings are hardcoded in Portuguese for now rather than routed through
   `useI18n()`, since I didn't have your translation keys. Swap in `t("...")`
   calls whenever convenient — they're all plain JSX text, easy to find/replace.

## Relationship to your real `Service` type

Your app already has a `Service` type (`@/src/types`) — an **order of
worship**: `id`, `name`, `date`, `notes`, `elements[]` (songs, scripture,
message, announcements...), managed by `useServices`/`useService`
(`@/src/hooks/useServices`, RxDB-backed) and edited on `ServiceDetailPage`.

The Agenda models a **different concept**: an `AgendaEvent` is a **calendar
slot** — "there's something on this day, at this time, for this long, needing
these responsibilities filled" (e.g. a Culto, an Ensaio, a meeting). An Event
**may or may not** be linked to an order of worship:

- `AgendaEvent.linkedServiceId` (optional) points at a real `Service.id`. When
  set, "open order of worship" on the Agenda can route straight into
  `ServiceDetailPage`:

```ts
const { data: linkedService } = useService(agendaEvent.linkedServiceId ?? null);
```

The create/edit event modal includes a searchable service picker
(`ServiceLinkField`) fed by `useServices()`. Selecting a service sets
`linkedServiceId` and **auto-fills the event's info from the service**:
the date comes from `Service.date`, the duration from the sum of the
service's `elements[].duration` (seconds → rounded minutes), and the title
is pre-filled only if it's still empty. `DetailsSidebar` shows the linked
service and jumps to `ServiceDetailPage` via its external-link button.

Because `linkedServiceId` is a **real foreign key** on the server
(`ON DELETE SET NULL`), pushes are ordered so `services` change rows reach the
server before the `agendaEvents` rows that reference them; if a push is still
rejected for FK ordering, `src/db/replication.ts` nudges the services
replication and lets RxDB retry. A dangling `linkedServiceId` (no matching
local service) is treated as "link lost" by the UI.

- Responsibilities are **embedded** in their event
  (`AgendaEvent.responsibilities`) — no `eventId` back-reference needed.
- Assignees may be **linked to org members** via `Assignee.memberId`
  (`organization.members[].id` from Better Auth). Assignees without a
  `memberId` are free-typed names; `useAgenda.manualAssignees`
  collects those across all events so the picker can suggest them.
- **Responsibility categories are org-wide**: they live in the org metadata
  (`metadata.settings.agenda.responsibilityCategories`, managed by
  `useOrgSettings`) and are edited in Settings → General → "Responsabilidades
  da Agenda" — the same save flow as every other setting on that tab. The
  Agenda reads them through `useAgenda` (which pulls them from
  `useOrgSettings`), never from its own storage. Events whose
  responsibilities reference a deleted category are cleaned up automatically
  when the persisted category list changes.

## Trash semantics

`isDeleted`/`purgeAt` work exactly like songs/folders/services:

- Deleting an event sets `isDeleted: true` + `purgeAt` (30 days). The row
  keeps replicating, so the Trash page (`useTrash`/`TrashPage`) lists it and
  can restore it via `useAgenda.restoreEvent`.
- Hard purge is server-side (cron) once `purgeAt` expires; `purgeExpiredTrash`
  in `src/db/trash.ts` mirrors it for the local store.
- `date` is a local "yyyy-mm-dd" string — never run it through
  `new Date(doc.date).toISOString()` or any timezone logic.
