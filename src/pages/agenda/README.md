# Agenda page

UI-complete "Agenda" page (calendar + day list + responsibilities + details/notifications),
matching the Hosanna Studio look. No backend calls — state is persisted to
`localStorage` under the key `hosanna:agenda:v1`, seeded from `mockData.ts`
the first time it runs.

## Files

```
AgendaPage.tsx              main page (drop into your router, e.g. next to FoldersPage/TeamsPage)
types.ts                    domain types (Service, Responsibility, Category, Assignee...)
mockData.ts                 seed data (matches the reference screenshot)
useAgendaStorage.ts         ← the swap point. All CRUD goes through here.
iconMap.ts                  icon + color lookup for responsibility categories
components/
  MiniCalendar.tsx           month calendar with dots for days with services
  DayAgendaList.tsx          list of services for the selected day
  ServiceDetailPanel.tsx     header card + responsibilities list
  ResponsibilityRow.tsx      one responsibility row (icon, avatars, actions)
  AvatarStack.tsx            overlapping avatar circles
  AssigneeTagInput.tsx       free-text "type a name, press Enter" chip input
  DetailsSidebar.tsx         details card + notifications/reminder card
  ServiceModals.tsx          all modals: create/edit service, add/edit
                              responsibility, manage categories, edit reminder
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

That's a different concept from what this Agenda models. Here, `AgendaService`
(renamed from a plain `Service` to avoid clashing with yours) is a **schedule
entry** — "there's a culto on this day, at this time, for this long,
needing these responsibilities filled". Same Sunday morning, two different
records: one is the running order, the other is the calendar slot + who's
covering sound/projection/etc.

`AgendaService.linkedServiceId` is the seam for connecting them later — set
it to a real `Service.id` so "open order of worship" on the Agenda can route
straight into `ServiceDetailPage`. When you're ready:

```ts
const { data: linkedService } = useService(agendaService.linkedServiceId ?? null);
```

and when creating an Agenda entry you could offer "link to an existing
service" using `useServices().servicesQuery.data` to populate a picker.
None of that is wired up yet — it's UI-only, as requested.

## Swapping localStorage for the real backend later

Everything reads/writes through the `useAgendaStorage()` hook. Its public
surface (`services`, `responsibilities`, `categories`, `addService`,
`updateService`, `addResponsibility`, `updateResponsibilityAssignees`, etc.)
is the contract the UI depends on — nothing else touches storage directly.
To go live:

- Replace `loadState()`/`persist()` with your Prisma/RxDB calls (or a
  `useQuery`/`useMutation` pair per entity).
- Keep the function names and shapes the same, or update `AgendaPage.tsx`'s
  calls accordingly.
- `resetToMockData()` is there for quick manual testing/demoing — delete it
  once real data exists.
