# PostHog Self-driving setup report

_Generated 2026-08-27 for project Hosana Studio (project 259262)_

## Summary

PostHog Self-driving has been configured for Hosanna Studio. Session Replay, Error Tracking, and Support (Conversations) products are enabled, seven native signal sources are wired up, GitHub and GitHub Issues are connected, a focused 8-scout troop is active, and two Replay Vision scanners are armed and watching key flows. Findings will start appearing in the [Self-driving inbox](https://eu.posthog.com/project/259262/inbox) within approximately 30 minutes.

---

## AI data processing

**Approved.** Organization-level AI data processing consent was verified by the wizard before this run started.

---

## GitHub

**Connected during this run.**

- Integration ID: 80607
- Account: Apoll011 (Tiago, hosanna.songbook@gmail.com)
- Connected at: 2026-08-27T13:43:33Z

---

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Already enabled | Server toggle was already ON before this run |
| Error Tracking | Already enabled | Server toggle was already ON before this run |
| Support (Conversations) | Enabled during this run | Tickets only arrive once an inbound channel is connected — see follow-ups |

**`posthog.init` check:** The init in `src/lib/posthog.ts` has no `disable_session_recording` or `capture_exceptions` overrides — no edits were needed.

---

## Signal sources

| Source product | Source type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | ON by default — no row created (creating would opt out) |
| `health_checks` | `health_issue` | **Enabled** (new) |
| `error_tracking` | `issue_created` | **Enabled** (new) |
| `error_tracking` | `issue_reopened` | **Enabled** (new) |
| `error_tracking` | `issue_spiking` | **Enabled** (new) |
| `session_replay` | `session_analysis_cluster` | **Enabled** (new) — sample rate 0.1 (server default) |
| `conversations` | `ticket` | **Enabled** (new) — dormant until an inbound channel is connected |
| `replay_vision` | — | Skipped — scanners are self-authorizing via `emits_signals` flag (see Replay Vision section) |
| `llm_analytics` | — | Skipped — no LLM/AI analytics in use |
| `logs` | — | Skipped — PostHog logs product not in use |

---

## Connected tools

| Tool | Status |
|---|---|
| GitHub Issues | **Connected by this run** — warehouse source id `01a0437b-065f-0000-2436-b48118b00027`, syncing `issues` table (incremental on `updated_at`), first sync started. Additional tables (PRs, releases) can be enabled in the PostHog data warehouse UI. |
| Linear | Not used (not selected) |
| Jira | Not used (not selected) |
| Sentry | Not used (not selected) |
| Zendesk | Not used (not selected) |

---

## Scout troop

**Run budget:** 100 runs/day (0 used today). Early-access banner: _"Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."_

### Enabled (8 total)

| Scout | What it watches |
|---|---|
| `signals-scout-general` | Cross-product correlations and surfaces no specialist covers |
| `signals-scout-product-analytics` | Funnels, retention, lifecycle, and stickiness flows for conversion regressions |
| `signals-scout-feature-flags` | Flag evaluation cliffs, ghost flags, and distribution shifts |
| `signals-scout-experiments` | A/B experiment validity threats (SRM, contamination, zombies) |
| `signals-scout-health-checks` | PostHog setup health issues weighted by blast radius |
| `signals-scout-hosanna-onboarding-funnel` | `user_registered` → `organization_created`/`invitation_accepted` conversion drops |
| `signals-scout-hosanna-content-health` | Weekly `song_created` + `service_created` volume for engagement regressions |
| `signals-scout-hosanna-invitation-health` | `invitation_accepted` vs `invitation_rejected` ratio for collaboration friction |

### Disabled (22)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by native error tracking source — would duplicate |
| `signals-scout-session-replay` | Covered by native session replay source — would duplicate |
| `signals-scout-surveys` | No surveys in use |
| `signals-scout-revenue-analytics` | No payment SDK detected |
| `signals-scout-ai-observability` | No `$ai_*` events or LLM analytics |
| `signals-scout-logs` | PostHog logs product not in use — enable if you adopt it |
| `signals-scout-csp-violations` | No CSP reporting configured — enable if you add it |
| `signals-scout-web-analytics` | Hosanna Studio is a PWA, not a marketing site |
| `signals-scout-web-vitals` | Same — enable if Core Web Vitals become a priority |
| `signals-scout-customer-analytics` | No group/accounts analytics in use |
| `signals-scout-data-pipelines` | No CDP destinations or hog flows |
| `signals-scout-data-warehouse` | No data warehouse imports beyond GitHub Issues |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry spans |
| `signals-scout-anomaly-detection` | Troop ceiling — enable if you add dashboards to monitor |
| `signals-scout-conversations` | No `$conversation_*` events yet (Support just enabled) |
| `signals-scout-observability-gaps` | Troop ceiling — enable later once insights exist |
| `signals-scout-replay-vision` | New scanners have no accumulated observations yet — enable after data builds up |
| `signals-scout-inbox-validation` | Fresh setup — no shipped fixes to validate yet |
| `signals-scout-insight-alerts` | No insight alerts configured yet |
| `signals-scout-mcp-tool-calls` | No `$mcp_tool_call` events |
| `signals-scout-tasks` | No PostHog Tasks in use |
| `signals-scout-skills-store` | Skill hygiene — enable if wanted |

**Noise escape hatch:** If a scout becomes noisy, set `emit: false` on its config in PostHog to switch it to dry-run (it still runs and logs but writes nothing to the inbox).

---

## Custom scouts

Three custom scouts were created and approved, covering Hosanna Studio surfaces no built-in scout watches:

### `signals-scout-hosanna-onboarding-funnel`
- **Watches:** `user_registered` → `organization_created` / `invitation_accepted` funnel
- **Discriminator:** Ratio of workspace-completion events to `user_registered` in a 14-day rolling window. Fires when ratio drops below 0.6 sustained for 3+ days, or week-over-week drop ≥20pp.
- **Why no built-in covers it:** `signals-scout-product-analytics` watches saved PostHog funnel insights — none exist yet (first run). This scout queries the events directly.

### `signals-scout-hosanna-content-health`
- **Watches:** Weekly `song_created` + `service_created` volume across organizations
- **Discriminator:** Combined weekly total; fires on ≥30% week-over-week drop sustained for 2+ weeks, or near-zero activity after a period of regular creation.
- **Why no built-in covers it:** These are domain-specific "value realized" events not covered by any enabled specialist or the general scout.

### `signals-scout-hosanna-invitation-health`
- **Watches:** `invitation_accepted` vs `invitation_rejected` ratio over rolling 14-day windows
- **Discriminator:** Acceptance rate = accepted/(accepted+rejected). Fires when rate < 0.5 sustained for 5+ days with ≥10 events, or a ≥20pp week-over-week drop.
- **Why no built-in covers it:** No built-in scout watches invitation-flow health; the general scout does not drill into domain-specific event ratios.

**Surfaces considered and ruled out:**
- `song_saved` / `service_archived` events — too granular; covered by the content-health scout's broader volume signal
- Sync/offline health — no sync events are currently captured, so not watchable
- Two-factor auth flow — insufficient event coverage to build a meaningful discriminator

---

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches one session recording at a time on a schedule, writes an observation, and — when `emits_signals` is on — pushes what it found into the Self-driving inbox. Findings arrive at half weight; they need corroboration from a second independent finding before they're promoted into a full report.

**No recordings exist yet** — the project is new. Both scanners are armed and will start working automatically the day recordings begin. This step is the only part of this setup that spends Replay Vision quota; cost is 5 credits per observation.

| Scanner | Type | Query scope | Sampling | Estimated monthly credits | Status |
|---|---|---|---|---|---|
| Hosanna Studio broken flows | Monitor | Sessions visiting URLs containing `/songs` (song library + editor — the primary content creation flow) | 50% random | 0 (no recordings yet) | **Created** |
| Hosanna Studio user frustration | Monitor | Sessions with a `$rageclick` event (any page) | 100% of matches | 0 (no recordings yet) | **Created** |

**Broken flows scanner scope rationale:** `/songs` covers both the song library explorer and the song editor — the flows where content creation and saving happen and where a silent break (blank editor, save spinner stuck) would cost the most.

**Disjointness:** The breakage monitor owns the URL axis (`/songs`); the frustration monitor owns the event axis (`$rageclick`). Their queries don't overlap structurally, keeping corroboration independent.

---

## Follow-ups

- [ ] **Connect a Support inbound channel** — Conversations product is enabled but the `conversations/ticket` signal source stays dormant until an email, inbox, or Slack channel is connected in PostHog. Connect one at [Settings → Support](https://eu.posthog.com/project/259262/settings).
- [ ] **Enable more GitHub Issues tables** — Only the `issues` table is syncing. You can enable `pull_requests`, `releases`, and other tables in the [data warehouse source UI](https://eu.posthog.com/project/259262/pipeline/new/source).
- [ ] **Create PostHog funnel insights** — `signals-scout-product-analytics` watches saved funnel/retention/lifecycle insights. Create at least one in PostHog to give it something to monitor (e.g. `user_registered` → `organization_created` funnel, or `song_created` retention).
- [ ] **Enable `signals-scout-logs`** — if you adopt the PostHog logs product, enable this scout from the inbox.
- [ ] **Enable `signals-scout-csp-violations`** — if you add Content-Security-Policy reporting to Hosanna Studio, enable this scout.
- [ ] **Enable `signals-scout-replay-vision`** — once session recordings accumulate and the two new scanners have built up observations, enable this scout to watch for observation trends.
- [ ] **Enable `signals-scout-inbox-validation`** — once the inbox has resolved findings, enable this scout to verify fixes held.

---

## What happens next

- The scout coordinator picks up the new configs within ~30 minutes and runs the first scans.
- Each run draws from the project's daily budget (100 runs/day during early access).
- Findings cluster into reports in the inbox; immediately-actionable ones can automatically start coding tasks.
- The Replay Vision scanners start working the day the first session recordings arrive — no additional setup needed.
- Visit your inbox: [https://eu.posthog.com/project/259262/inbox](https://eu.posthog.com/project/259262/inbox)
