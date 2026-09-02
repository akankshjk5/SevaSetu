# SevaSetu — Skilled Workforce & Local Services Platform (full-vision prototype)

A working prototype of a two-sided marketplace for India connecting **households**, **contractors** and
**training providers** with verified local workers — plus a worker skill passport, aggregated skill-demand
intelligence, and a government/skill-ecosystem partnership layer. Launch city: **Jaipur**.

Six experiences, three languages (English / हिन्दी / ಕನ್ನಡ), seeded with realistic demo data so every flow can
be clicked through end to end without any third-party account.

```bash
npm install
npm run dev          # http://localhost:3100
npm run check:flows  # walks all five phase loops through the service layer
npm run check:i18n   # every key used exists, and all three packs are complete
npm run build
```

## Honest framing: phases, not promises

Real rollout happens one phase at a time, starting with Phase 1. This prototype shows the whole roadmap so
partners can judge the direction — so **every Phase 2+ feature carries a visible badge**:

| Badge | Meaning |
| --- | --- |
| ● **Live** | Phase 1. Built and working today in the launch city. |
| ◐ **Beta** | Phases 2–4. Working demo of the loop, not production-hardened. |
| ○ **Roadmap** | Phase 5. Planned; shown so partners can see where this goes. |

Badges come from `src/components/PhaseBadge.tsx` and appear on the landing page, the login demo list, every
Phase 2+ screen header, and inline wherever a later-phase feature surfaces inside a Phase 1 screen.

## Open the demo

The landing page and `/login` both have one-click demo sign-ins. Phone + OTP login also works for real —
**any 6-digit code is accepted**, and an unrecognised number creates a new account.

| Experience | Demo account | Entry point | Phase |
| --- | --- | --- | --- |
| Household | Ankit Agarwal, Malviya Nagar | `/household` | 1 |
| Worker | Sunita Devi, verified cleaner | `/worker` | 1 |
| Platform admin | Ops — Priyanka Jain | `/admin` | 1 + 4 |
| Contractor | Mahendra Jangid, Shree Balaji Constructions | `/contractor` | 2 |
| Training provider | Dr. Meera Saxena, Jaipur Skill Centre | `/training` | 3 |
| Government partner | District skill office (read-only) | `/gov`, public `/partners` | 5 |

"Reset demo data" in the landing-page footer restores the seed.

## What each phase demonstrates

### Phase 1 — Household & quick services (Live)

- **Household**: OTP sign-up → post a need in 3 steps (service → schedule → location + budget) → ranked
  matches with a **visible 100-point match score** broken into skill fit, distance, rating, price and
  availability → worker profile with the verification badge explained in full → book with agreed price and
  cancellation policy → track `confirmed → en route → arrived → in progress → completed` → mock UPI/card
  payment sheet → rate on quality, punctuality and behaviour. Plus "my team" with a weekly calendar,
  pause/resume, replacement requests, and a **platform protection** panel on every paying screen.
- **Worker**: guided profile builder, a four-step verification pipeline (Government ID → police check → skill
  check → insurance) with plain-language reasons, accept/decline job requests, start/complete work, an
  earnings ledger with the 24-hour payout timeline, reviews received, and a recurring availability calendar.
- **Platform admin**: verification queue with approve/reject + reason and turnaround time, dispute queue with
  case notes and resolutions, review moderation, and a live list of city bookings by zone.

### Phase 2 — Workforce OS for sites (Beta)

Contractor company profile → create a project (site, dates, hours, trades, headcount, daily rate) → the
**same matching engine** shortlists workers per trade → request the whole team or one worker → workers accept
from their own job inbox → daily site check-in (demo stand-in for GPS/geofence, labelled as such) → per-worker
payroll from attendance → mark the project complete → **mutual contractor ↔ worker reviews**, which roll into
the worker's skill passport.

Site work reuses the Phase 1 `RecurringSchedule` shape and `scoreWorker()` — one scheduling and matching
engine, two UIs. The project screen says so on the page.

### Phase 3 — Digital skill passport (Beta)

`/worker/passport` builds a verified work record automatically from completed household bookings *and*
completed site assignments — jobs, hours, trades and income. On top of that: a short **skill quiz** for
lower-risk trades, a **scheduled practical check** for electrician and plumber (a quiz is not enough for those),
worker-added certificates, and matching training courses.

Passing a check earns a **Certified** sub-badge that shows next to "Verified" in the household's ranked list,
on the worker's profile, and in the contractor's shortlist — so the phases visibly connect.

**Training provider** portal lists courses by trade and district, and reads the aggregated district skill-gap
signal (never individual workers; the consent rule is stated on the screen).

### Phase 4 — Demand & supply intelligence (Beta)

`/admin/analytics` — demand and supply over six months, fill rate, shortages by trade, training-demand signal,
average income, all filterable by month, zone and trade.

### Phase 5 — Government & skill ecosystem (Roadmap)

Two clearly separated surfaces:

1. **Public pitch page `/partners`** (no login) — public-value proposition, an **impact dashboard** (workers
   verified, jobs completed, income disbursed, districts covered, skill-gap signals), how the platform
   complements Skill India/NSDC, e-Shram and NCS rather than duplicating them, a four-point **data-governance
   statement**, and a partnership request form (stored, shown in `/admin/inquiries`; no email is sent).
2. **Authenticated dashboard `/gov`** — the public-safe cut of the Phase 4 dataset, in a deliberately
   different official visual treatment, with an "aggregated data only" banner on every screen and CSV / print-
   to-PDF exports by district and trade.

Phase 4 and Phase 5 render the **same component** (`src/components/AnalyticsDashboard.tsx`) over the same
pre-aggregated table: built once, surfaced twice.

## Worker portraits, and how to use real photos

Worker avatars are **illustrations, not photographs** (`src/components/WorkerAvatar.tsx`). This build ships no
licensed photos, and putting stock photos of real people behind fictional worker names would misrepresent
those people. The illustration is warm and trade-appropriate — helmet for site trades, sun hat for the
gardener, chef cap for the cook, a dupatta/shawl band on some variants — and each worker's colours are derived
from their **id and trade**, never from guessing anything about them from their name.

To use real photographs, put the licensed image in `public/` and set the path on the worker's `photo` field:

```ts
{ id: "w1", name: "Sunita Devi", photo: "/workers/w1.jpg", ... }
```

`WorkerAvatar` renders the photo whenever `photo` is set and falls back to the illustration when it is not —
no component changes needed.

## Indian visual language

- Warm off-white page ground (`#fdf8f1`) rather than clinical grey.
- Marigold and terracotta as accent tokens (`--marigold`, `--terracotta`) alongside the teal brand.
- `.garland` — a marigold strip under the landing header, as hung over a doorway on an opening day.
- `.jaali` — a faint lattice-screen diamond pattern behind the hero.
- `.block-print-top` — a double rule echoing a Jaipur block print, on the trust cards.
- Category tiles use a warm marigold tint instead of plain white.
- Currency, dates and numbers format per locale (`en-IN`, `hi-IN`, `kn-IN`), so amounts read as ₹3,500.
- **Script-correct type**: Geist covers Latin only, so Hindi and Kannada were falling back to whatever face
  the device had. Noto Sans Devanagari and Noto Sans Kannada are loaded alongside it and the browser picks
  the right face per glyph. Line-height is loosened for those two scripts, whose marks sit above and below
  the baseline and get clipped by Latin-tuned leading.

## Easy mode — built for workers who read little

Most people doing this work have limited formal schooling, so the worker app cannot assume comfortable
reading. Three things address that, and all of them are available to households too:

- **Easy mode toggle** (👁 in the header of the worker and household apps). Scales the whole interface rather
  than restyling screens one by one: 18px base type, 56px action buttons, larger icons, stronger contrast on
  secondary text. Saved to the cookie *and* the profile, so setting it once carries to another phone.
- **"Who called you" first.** A worker's job list and job detail now lead with the household's face and name,
  then the amount, then the work — not a service category. `JobFactCard` lays out the five facts in the order
  workers actually ask them: who called me, what work, when, where, how much. Every row leads with a picture.
- **Listen aloud.** `SpeakButton` reads those five facts in the chosen language using the browser's built-in
  speech synthesis — no network call or account needed. It hides itself on devices with no speech support
  rather than showing a dead button.

## The job card reaches the worker on WhatsApp

When a household books someone, the worker is sent the same five facts they see in the app — who booked them,
what work, when, where and how much:

```
SevaSetu — New job for you

👤 Booked by: Ankit Agarwal
🧹 What work: House cleaning
🕐 When: 5 Sept 2026, 09:00
📍 Where: B-142, Sector 4, Malviya Nagar
💰 You get: ₹3,200
📝 Notes: 2BHK, dog at home, gate code 4412

Open the SevaSetu app to accept or decline.
```

- Composed by `buildJobMessage()` from the **same facts as `JobFactCard`**, so the message and the screen
  cannot drift apart.
- Written in the **worker's** saved language, not the household's — they are the one reading it.
- Sent through `notifyProvider` on booking; the booking records `notifiedAt`.
- The household's booking screen shows the literal message that went out, plus a **wa.me deep link** that
  opens real WhatsApp with the text prefilled and addressed to the worker. That makes the flow demonstrable
  today without a WhatsApp Business account; swapping `notifyProvider` for a real client sends it directly.

## Rapid services (hyperlocal)

The landing page's rapid-services hub covers three quick tasks: a shop pickup from a named local shop
("dukaan"), an urgent trade call-out, and an errand/parcel run. They run on the platform's own worker pool
rather than a separate system.

- Shops and pricing live in `src/lib/shops.ts`, not in the component, because the server has to look a shop up
  when an order is placed.
- **The fare is computed on the server** (`placeRapidOrder`) from the shop table and a clamped distance —
  never read from the form. A price that arrives from the client is not a price; a tampered `distanceKm=999`
  clamps to 25 km rather than billing whatever the browser asked for.
- Placing an order assigns the nearest suitable verified worker and sends them the **same five-fact job card**
  on WhatsApp that a household booking sends, in their language.
- `/household/rapid/[id]` tracks placed → assigned → picked up → delivered.

## Language layer

Every user-facing string — including toasts, errors, empty states, status labels and the government pages —
goes through `t()`. Nothing is hardcoded.

- Packs: `src/i18n/dictionaries/{en,hi,kn}.ts` — **719 keys, 100% translated in all three languages**.
- Resolution order: cookie (this device) → the language saved on the user's profile (follows them across
  devices) → English. Any missing key falls back to English rather than showing a blank.
- The switcher is visible on **every** screen, including the first one a new user sees.
- Numbers, currency and dates format per locale via `Intl` (`formatMoney`, `formatNumber`, `formatDate`).
- **Adding a fourth language**: add one pack file, add two lines in `src/i18n/config.ts` and one in
  `src/i18n/index.ts`. No component changes.
- `npm run check:i18n` fails the build if a key is used but undefined, if a pack defines an unknown key, or if
  a translation's `{placeholders}` don't match English.

## Architecture

```
src/lib/types.ts          domain model (all six roles, all five phases)
src/lib/seed.ts           Phase 1 seed — 29 workers, 6 households, 90+ jobs of history
src/lib/seed-phases.ts    Phase 2–5 seed — contractors, projects, attendance, passports, inquiries
src/lib/store.ts          in-memory singleton — the one file to swap for Postgres/PostGIS
src/lib/repo.ts           Phase 1 queries and aggregates
src/lib/repo-phases.ts    project, passport, training and impact queries
src/lib/services.ts       booking lifecycle rules, free of request/session concerns
src/lib/actions*.ts       server actions — thin: auth, call a service, revalidate
src/lib/match.ts          the transparent 100-point scoring function
src/lib/integrations/     provider boundaries: sms, payments, identity, notify
src/i18n/                 config, packs, server + client translators
```

### Swapping in real providers

Each integration is an interface with a mock implementation and a single named export the app imports:

| Module | Interface | Swap in |
| --- | --- | --- |
| `integrations/sms.ts` | `SmsProvider` | MSG91, Exotel, Gupshup |
| `integrations/payments.ts` | `PaymentProvider` | Razorpay, Cashfree |
| `integrations/identity.ts` | `IdentityProvider` | Aadhaar offline KYC, police-verification partner |
| `integrations/notify.ts` | `NotifyProvider` | WhatsApp Business API |

Write an object with the same shape, export it in place of the mock — no feature code changes.

## Data governance

The government dashboard and the training provider's gap view read **only** from the pre-aggregated
`AggregatedStat` table (district × trade × month). Worker names, household addresses, phone numbers and
individual bookings never reach them, and the CSV export is generated from the same aggregated rows.

## Checks

```bash
npm run check:flows   # 47 assertions across all five phase loops
npm run check:i18n    # key coverage, pack parity, placeholder parity
npm run build         # typecheck + production build
```

## Out of scope in this build

Multi-city support, real payment gateway, real government/NCS/e-Shram API integration, native mobile apps, and
actually sending email from the partnership form (submissions are stored and shown in the admin console). The
data model is shaped to allow all of these later.
