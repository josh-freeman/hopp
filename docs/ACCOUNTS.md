# Hopp accounts and progress

Current implementation, 13 September 2026. **Real accounts are not live yet:** both Fly builders rejected deployment because of overdue invoices, and production Hopp endpoints still return 404. Resolve billing and deploy the account API to enable Google sign-in, sync and server awards. The frontend checks availability before leaving Hopp and presents an unavailable message; isolated demo profiles remain usable.

The frontend remains a static app at `/hopp/`; optional accounts use `https://api.joshfreeman.me/hopp`. Searching, reading the map and using live guidance require no account. Profile is the sixth screen and sits outside Plan → Results → Go live.

## Shared identity, separate Hopp data

Google sign-in uses the website's existing user system and registered callback. An existing website `comment_token` can also be validated by the API. Cached `comment_user` data is never proof of identity. A new Hopp signup does not grant website membership, administrator privileges or a subscription.

The Google flow starts with top-level navigation to `/hopp/auth/google?return_to=/hopp/`. The API validates a browser-bound, ten-minute OAuth state, then redirects back with a browser-bound, single-use code valid for sixty seconds. The client immediately removes the query parameter and exchanges the code with credentials included. The bearer token is never placed in the redirect URL.

Dedicated tokens use Hopp audience/scope, a profile generation and thirty-day expiry. The frontend stores its token under `hopp.auth.token`, leaving website storage untouched. Existing website endpoints reject dedicated Hopp tokens. Returning Google users are matched by the stable provider subject; first-time email linking requires Google authority for that email. A third-party-email collision requires authentication to the website account rather than automatic linking.

Hopp sign-out clears its token and records `hopp.auth.website-suppressed` so the website session is not silently reused on reload. It does not sign out the rest of the website. Deleting Hopp data removes the profile, practice ledger, daily activity, private trip notes and pending codes, and revokes dedicated Hopp sessions. The shared website account, access and Google identity link remain.

## What a profile stores

- A Hopp nickname, selected profile-card style and preferences: `sprint_mps`, `bag`, `min_margin_s`, `offer_sprint_routes`.
- Server-awarded Hopp points, completed practice questions and cumulative active days.
- Private trip notes created by **On the platform**, with optional route, train, platform, departure and elapsed-time fields. They are always labelled **unverified** and worth **zero points**.

There is no GPS tracking, proof of boarding, public profile, leaderboard or speed reward. Profile styles do not change the pace, planner verdict, safety colors or fallback. Account failure leaves anonymous planning available.

## Points and delivered rewards

| Action | Points | Repeat behavior |
| --- | ---: | --- |
| First correct answer to a practice question | 25 | Zero for wrong answers or repeats; three questions, 75 total |
| First successful signed-in connection check on a Europe/Zurich calendar day | 5 | Zero additional points that day; last-seen time is refreshed |
| Open the app, create an account, Start sprint or On the platform | 0 | No travel award |

Practice covers the remaining time after margin, taking the regular fallback, and waiting for a known platform. Completing all three earns **Prepared**. Daily checks measure use of the planner, not journeys made. The engagement request contains only `{ "kind": "connection_checked" }`; it sends no route, search text, destination or location trail. The server chooses the date and prevents duplicate awards.

| Profile-card style | Points required |
| --- | ---: |
| Signal | 0 |
| Forest | 25 |
| Night | 75 |
| Track | 150 |
| Alpine | 300 |
| Dusk | 600 |

Unlocks do not spend the balance. The profile shows today's check status, this month's active days, the next unlock and cumulative milestones at **7, 30 and 100 active days**. The corresponding badge IDs are `regular`, `commuter` and `yearbook`. Progress does not expire or reset after a break. An SVG unlock notice offers a direct action such as **Use Forest** and respects reduced motion.

## Frontend contract

`src/account/types.ts` validates remote JSON with Zod. `createAccountClient({ mock })` exposes `state`, `subscribe(listener)`, `load()`, `signIn()`, `signOut()`, `saveProfile(update)`, `practice(scenarioId, answerId)`, `recordActivity('connection_checked')`, `recordAttempt(input)` and `deleteAccount()`. State is `guest`, `loading`, `signed-in` or `error`, with optional account/error plus scenario and private-attempt lists. Requests time out, session changes invalidate stale responses, and errors are presented through the account UI.

| Endpoint | Purpose |
| --- | --- |
| `GET /me` | Validated user, profile, stats, badges and unlock catalogue |
| `PUT /profile` | Update nickname, known unlocked style or partial preferences |
| `GET /practice` | Questions, choices and completion; no answer key |
| `POST /practice` | Grade an answer; return feedback, awarded points and account |
| `POST /activity` | Record a connection check; return recorded status, points and account |
| `GET /attempts?limit=20` | Current account's private trip notes, newest first |
| `POST /attempts` | Save an unverified, zero-point note with optional idempotency ID |
| `GET /rewards` | Current account's practice award ledger |
| `DELETE /me` | Delete Hopp data while preserving the website account |

All paths in the table are relative to the Hopp API base. Mutations receive an action or selection, never a client-authoritative point total, role or verification result. The API rejects unknown or locked themes and extra privileged fields. Its `rewards` field in the account response is the unlock catalogue; `GET /rewards` is the practice ledger.

Mock mode uses only `hopp.demo.account.v1` and explicit **Open demo profile** sign-in. It never reads real account tokens, exchanges callback codes or calls the account API. Demo awards and dates are local fixtures and do not contribute to production metrics.

## Engagement measurement

The administrator-only metrics endpoint uses existing website administrator authentication; a dedicated Hopp token cannot access it. It returns aggregate counts without a user list or trip details:

- **DAU/WAU/MAU/YAU:** distinct authenticated accounts with a connection check in the preceding 1/7/30/365 rolling UTC days. Repeated same-day checks refresh the timestamp without earning more points.
- **Activation:** accounts with any recorded connection check, divided by accounts with Hopp-specific data. Website accounts that never used Hopp and anonymous planner visitors are excluded.
- **DAU/MAU stickiness:** DAU divided by MAU. Both ratios are fractions and return `null` when the denominator is zero.
- **D7/D30 retention:** a connection check on exactly the seventh/thirtieth Europe/Zurich calendar day after the account's earliest Hopp record. Each report considers the last thirty signup dates whose target day has fully ended; today's incomplete follow-up day is excluded. Empty eligible cohorts return `null`.

The response also exposes total Hopp accounts, activated accounts and practice-completion counts. Deleting Hopp data removes the account's contribution. These are authenticated product-use metrics; they do not establish trips, physical activity or retention across all anonymous visitors. No additional location telemetry is collected for these calculations.

## Validation and remaining checks

The backend suite passed **68 tests**: 32 Hopp checks and 36 existing website/member/Stripe regressions. Coverage includes OAuth state/code binding, expiry and replay, identity linking, privilege separation, idempotent awards, Swiss dates and DST, locked themes, private history, deletion/session revocation and metric cohorts. The frontend passed **110 unit tests with 564 assertions**, including unavailable-API sign-in/race regressions. Five isolated backend response fixtures passed the frontend Zod schemas. All **56 browser checks passed in 21.3 seconds**, with 96 screenshots across sixteen viewport classes. Detailed coverage is maintained in [Phone QA](qa/README.md).

Automated OAuth tests use a fake provider. A complete human Google consent round trip, physical-device account testing and participant comprehension checks have not been recorded. Frontend Pages deployment and account API deployment are separate release steps. Backend source is ready and pushed; Fly billing currently blocks the latter.

Strava activity import, pace calibration and Strava-derived rewards remain deferred under the June 2026 API Policy. See [the integration assessment](research/2026-09-13-strava-integration.md) and [rewards research](research/2026-09-13-rewards-design.md). Hopp rewards require no Strava connection.
