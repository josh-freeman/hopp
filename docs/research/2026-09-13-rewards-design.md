# Hopp accounts, progress and free rewards

Research checked 13 September 2026. Updated for the implemented shared-account, practice and daily-use rewards. Deployment and test evidence are recorded separately in [Phone QA](../qa/README.md); a complete human Google consent round trip and journey verification have not been established. Real accounts are not live: Fly billing blocked the API deployment, production Hopp endpoints return 404, and server awards await that deployment. Isolated demo profiles and rewards work.

## Recommendation

The implemented design uses an optional Google account shared with the website, a private profile, saved preferences and six selectable profile-card styles. Three server-graded practice questions award 25 points each once; the first successful signed-in connection check each Europe/Zurich calendar day awards 5. Cumulative active-day milestones at 7, 30 and 100 days reward continued use without a streak reset. These are Hopp-use points, not travel verification. Travel awards remain disabled. Strava is deferred; pace calibration is not cleared under its current API Policy.

The immediate rewards are themes that actually change when selected. A badge with no associated feature is recognition; a promised ticket, discount or sponsor benefit without an agreement is not a deliverable. Nothing in the implemented reward rules requires purchases, advertising views, referrals, consecutive-day use or a faster transfer.

The trip remains **Plan → Results with map → Go live**. Profile and rewards live outside that path. There is no public route directory, challenge feed or leaderboard in the first release.

## What the research supports

Three randomized trials support testing modest progress feedback, while also showing why Hopp cannot infer that competitive station sprinting is beneficial.

| Primary research | Finding relevant to the design | Limit on applying it to Hopp |
| --- | --- | --- |
| BE FIT, 2017: 200 adults in 94 families, 12-week intervention and 12-week follow-up | Family gamification with goals, points and levels increased daily steps relative to control; the adjusted difference fell from 953 steps during the intervention to 494 during follow-up. [^1] | This studied daily walking activity and social support, not hurried transfers. It does not establish that badges alone cause the effect. |
| STEP UP, 2019: 602 adults, 24-week intervention and 12-week follow-up | Support, collaboration and competition designs all increased physical activity during the intervention; competition produced the largest increase. [^2] | Participants were a selected employee population, and the trial measured steps rather than health outcomes or station safety. Competition being effective in that setting is not a reason to rank Hopp users by speed. |
| BE ACTIVE, 2024: 1,062 randomized adults at elevated cardiovascular risk, 12-month intervention | Gamification alone increased steps by an adjusted 538 per day versus attention control; the combined incentive arm had a larger difference. [^3] | Financial rewards were funded research interventions. The result does not provide Hopp with a source of free prizes, or evidence that running for a train is an appropriate activity target. |

These studies support a **product hypothesis**, not a health claim: clear, achievable progress may help people return to a useful tool. Hopp's practice questions and daily-check rewards are product choices, not interventions validated by these physical-activity trials. Test whether users understand and value it without changing their choice of safe connection.

Existing fitness products provide narrower operational lessons. Garmin challenge badges have explicit requirements and require joining a challenge. Hopp can borrow visible requirements without adding an enrollment step to each trip. [^4] Strava distinguishes private challenge progress from leaderboard eligibility and excludes manual activities from challenge leaderboards. This supports keeping evidence categories visible, although Hopp's accepted rule is stricter: a self-report earns no travel points. [^5]

Strava's sponsored prizes are supplied under partner-specific eligibility and fulfillment rules. They are not a pool of benefits another app can redistribute. Hopp's first rewards should therefore be assets it owns and can deliver immediately. [^5]

## Superseded mechanics in the original specification

The current product decisions and explicit user constraints take precedence over older draft mechanics in [the design specification](../superpowers/specs/2026-09-13-hopp-design.md).

| Original text | Conflict or missing capability | Current decision |
| --- | --- | --- |
| §10 identifies users by a device UUID in local storage and `X-Device`. | An editable identifier does not establish ownership of a Google account or protect a reward balance. | Use authenticated server sessions. Keep installation IDs only for local records, diagnostics or deduplication. |
| §10.x gives tap-only/unverified attempts half points, but also explicitly says that On the platform is self-report and earns no points. | These statements cannot both define the same award system. | Keep the explicit no-self-report-points rule. A record can be saved without receiving a travel award. |
| §10.x scores `plannerBudgetS − actualS`, breaks leaderboard ties by best time, and rewards beating a budget by five minutes. | The faster the user runs, the larger the reward. That is a speed incentive even without a close-call bonus. | Remove time-based scoring, best-time ranking and budget-beating badges. |
| §10.x offers an explorer multiplier and Scout badge for draft routes. | Rewards would encourage trying access that has not been approved for passenger use. | Never grant travel rewards for draft, disabled, expired or unsupported platform routes. Field research is a separate review process. |
| §10 starts timing from GO/RISKY screens. | The current application recommends only GO opportunities and keeps its margin visible. | Do not create a reward path that turns RISKY into an encouraged action. |
| §10.x describes GPS and target-train verification as a later phase. | Current source has nearest-stop geolocation only, no tracking or verifier. The catalogue has 11 desk-verified routes, one draft and zero departure corridors. | Show no verified travel count or earned travel points today. Add verification only after implementation and validation. |
| §10.x's movement rule interpolates a train position and treats three matches as verification. | Similar services, delays, slow departures, tunnels and noisy fixes can remain ambiguous. A match is evidence, not operator-confirmed boarding. | Keep an explicit inconclusive result. Validate against neighboring services and real traces before enabling any award. |
| §14 uses the device ID as OAuth `state`. | A predictable identifier is not a session-bound, single-use authorization transaction. | Google sign-in uses fresh browser-bound state. Strava linking remains deferred and would require its own validated transaction. |
| §14 says the Strava API is effectively a two-person stretch feature. | Current onboarding and developer prerequisites have changed. | Use the current capacity and subscription information below; do not carry forward old estimates. |
| §14 proposes calculating VMA/pace from imported Strava activities. | The June 2026 API Policy restricts analytics, derived outputs and combining Strava data with other customer data. | Defer calibration and activity imports until the intended use receives a written determination from Strava. |

Design spec §0 now records these overrides. The original later sections remain historical; [the account contract](../ACCOUNTS.md) describes the implemented endpoints and data boundaries.

## Evidence model for any future travel awards

Account authentication and travel evidence answer different questions. A valid Google sign-in establishes the Hopp account, not its location, activity or train. Neither a connected Strava account nor a client-supplied `verified: true` flag establishes a completed transfer.

The current API stores only unverified, zero-point trip notes. If a travel verifier is developed later, its proposed evidence categories should remain separate facts with a server-derived summary:

| Evidence state | What is known | User-facing wording | Travel award |
| --- | --- | --- | --- |
| `planned` | Hopp produced a route offer for a query. | Planned connection | None |
| `self_reported` | The user tapped Start sprint and/or On the platform. | Recorded by you | None |
| `location_supported` | Valid observations support part of the route, but the selected train is not established. | Location recorded · train not verified | None |
| `journey_supported` | A server verifier accepts start evidence and movement consistent with the selected service, with no unresolved competing explanation. | Journey checked against location and timetable | Eligible only under a separately enabled reward rule |
| `inconclusive` | Evidence is missing, insufficient or ambiguous. | Could not verify this journey | None; no penalty or loss of existing progress |
| `rejected` | Evidence contradicts the submission, is replayed or fails integrity checks. | This record could not be accepted | None |

`journey_supported` does not prove the exact platform arrival time when the only stop time is a tap. Store `platformTimeSource: tap | location | unavailable` separately. Do not infer a precise time saved from that tap. Keep planned arrival improvement labelled as an estimate rather than accumulating it as actual time saved.

GPS absence in a hall is not proof of success or cheating. The existing indoor exception can allow other evidence to be evaluated, but cannot manufacture the missing observation. Strava imports are deferred and cannot contribute evidence or points in the current design.

## Implemented account and reward behavior

### Optional profile

Profile is an optional sixth screen reached from Plan or Settings. Signing in is not a prerequisite for searching, map access, fallback information or live guidance. The signed-in screen shows the nickname, saved preferences, private progress, practice and profile-card customization.

The useful account benefit is continuity across devices. Hopp validates an existing website session or creates a separately scoped session through Google. Returning Google users are linked by stable subject; automatic first-time email linking requires Google authority for that email, while third-party-email collisions require authentication to the website account. Google documents server validation of ID-token signature, audience, issuer and expiry, stable `sub` identification and the distinction between Google-authoritative and third-party email addresses. [^6] Hopp signup grants no website membership or administrator role.

Hopp sign-out preserves the website session and suppresses automatic reuse. Deleting Hopp data removes its profile, progress and private trips and revokes dedicated Hopp sessions while retaining website access. Mock mode uses separate local storage and never reads real tokens or calls the account API.

### Progress that exists now

Profile lists saved private trip notes with an **unverified** label. On the platform is self-report and earns zero points. No GPS trail, verified-journey achievement or boarding claim is implemented.

The selected implementation uses **Practice**, an optional set of three questions within Profile. Each first correct answer earns 25 points; the server checks the answer and prevents a repeated answer or request retry from adding more points. All three correct answers earn the private **Prepared** badge. It records completion of practice, not verified travel, fitness or platform competence. Creating an account or tapping On the platform earns no points. The maximum practice total is 75.

A successful signed-in search records only `{ "kind": "connection_checked" }`. The server awards 5 points once per Europe/Zurich calendar day; repeated checks refresh last-seen time and award zero. It receives no destination, search text or location for this event. The profile shows today’s status, active days this month, the next style unlock and cumulative milestones. Daily checks indicate use of Hopp, even when the user takes the regular connection; they do not establish physical travel.

### Free rewards that can actually be delivered

Use repo-owned SVG/CSS assets and an actual saved theme selection. The implementation set is:

| Item | Availability and evidence | Concrete result |
| --- | --- | --- |
| Signal | Free default, 0 points | Standard profile-card style |
| Forest | 25 Hopp points | Selectable Forest profile card |
| Night | 75 Hopp points | Selectable Night profile card |
| Track | 150 Hopp points | Selectable Track profile card |
| Alpine | 300 Hopp points | Selectable Alpine profile card |
| Dusk | 600 Hopp points | Selectable Dusk profile card |
| Prepared | All three practice questions answered correctly | Private practice-completion badge |
| Regular / Commuter / Yearbook | 7 / 30 / 100 cumulative active days | Private milestone badge and progress track |

The SVG/CSS assets, selection control and persistence are implemented. An unlock notice provides a direct **Use Forest**-style action and respects reduced motion. Theme thresholds are unlock requirements, not purchases that consume the balance. These items have no cash value, do not expire and do not unlock a faster algorithm, a smaller safety margin or a hidden route. The selection changes the profile card only, preserving semantic verdict colors, map legibility and fallback visibility. No sponsor logos, train discounts, gift cards or redemption codes appear without a real fulfillment arrangement.

Free core accessibility and route information are never rewards. Font size, contrast, reduced motion, map clarity and full directions stay available to everyone.

## Future travel achievements

Enable these only after a verification-ready route set and the verifier pass field validation. Recommended eligible routes are field-verified, current and supported for the actual platform. All present catalogue routes therefore remain ineligible for travel awards.

A simple rule is one progress credit per eligible verified travel day, using the Europe/Zurich date. A duplicated attempt, repeated trip or extra run that day cannot create additional credit. There is no expiring streak and no penalty for taking the ordinary connection, declining GPS or having an inconclusive verification. If numeric points are required, use a fixed amount for that same credit; do not derive it from speed, slack, distance, elevation, timetable gain or time remaining.

| Private achievement | Requirement | Cosmetic unlock |
| --- | --- | --- |
| First checked journey | One eligible travel day | First-journey card stamp |
| Five travel days | Five lifetime eligible days, not necessarily consecutive | Alternate card border |
| Twenty travel days | Twenty lifetime eligible days | Alternate profile pattern |

These thresholds are design starting points, not research-derived optima. No notification should tell someone to make another transfer to finish today's progress. Avoid a public score, best-time list, station completion chase or a view of unvisited shortcuts. If earned station stamps are added later, show only the user's own visited stations.

A route closure or stale timetable still removes the offer regardless of progress. Reward logic cannot change the planner's GO/RISKY/NO decision, the default pace or the margin. Recognition appears after the journey or in Profile; nothing animates over a map, crossing instruction or live countdown.

## Current contract and measuring return use

The [account integration guide](../ACCOUNTS.md) records the implemented API. The client submits an action, such as a practice answer, connection check or theme selection; it never writes its own point total. Server-side account/question and account/Swiss-date uniqueness prevents duplicate awards. Only known, unlocked styles can be selected. Practice and daily-use ledgers remain separate from the unverified trip notes.

Administrator metrics measure authenticated use: distinct accounts with a connection check in rolling 1/7/30/365 UTC days form DAU/WAU/MAU/YAU. Lifetime activation means at least one connection check among accounts with Hopp-specific data; unrelated website accounts and anonymous planner visitors do not enter the denominator. The response includes activation rate, DAU/MAU stickiness and exact-day D7/D30 retention. Retention considers the last thirty eligible Swiss signup dates, excludes incomplete follow-up days and returns a null rate when no account is eligible. No additional route or location telemetry is collected.

These measurements let the user examine recurring usefulness across days, months and years, but they do not demonstrate that the reward design caused higher retention. Pair return-use metrics with comprehension and successful connection planning. Do not optimize sprint counts, speed or close connections. A break never resets the 7/30/100-day milestones or removes earned styles.

A configured backend URL and passing fake-provider tests do not establish a complete human Google consent round trip. Current deployment and validation evidence remain separate in the QA guide.

## Optional Strava

Strava is deferred and should neither award travel credit nor be needed to obtain any Hopp cosmetic. The 1 June 2026 API Policy §5.4 restricts analytics and combining Strava data with other customer data, including derived outputs. The proposed VMA/pace calculation is therefore not cleared simply because it would be private. Obtain a written determination from Strava for the intended use before building calibration or activity imports. This is an interpretation requiring confirmation, not a claim that the policy explicitly names Hopp or pace calibration. [^10] The separate [Strava integration assessment](2026-09-13-strava-integration.md) records the fuller scope review.

Current official documentation says creating an API app requires a Strava subscription. New apps begin with only the developer's own athlete; the dashboard can raise capacity to ten, and further expansion requires review. This is different from promising an integration with no prerequisites or assuming public launch capacity. [^7]

OAuth requires a confidential server-side code exchange, granted scopes must be checked, access tokens expire after six hours, and refresh-token replacement must be persisted. The June 2026 documentation also recommends the new revoke endpoint; the older deauthorization endpoint is due to cease support in June 2027. These are implementation details for the backend, not extra steps in the Hopp trip flow. [^8]

The current API agreement is effective 1 June 2026 and restricts display of a user's Strava data to that user. That display restriction does not grant permission for otherwise restricted analytics. The agreement says API access is currently uncharged, while the onboarding guide separately requires a subscription to create the app. Those are different costs and should not be conflated. [^9]

Use the documented webhook/deauthorization lifecycle when building the integration. A Hopp disconnect must revoke access where possible and remove the stored connection and imported data according to the implemented retention policy. Until that is implemented, omit the live connection control and describe Strava as planned in project documentation only. [^7][^8]

## Acceptance checks

1. A fresh visitor still searches and reaches live guidance without signing in or opening Profile.
2. A forged or expired Google credential cannot read another account or create grants. Successful sign-in resumes the same profile across devices.
3. On the platform, repeated Start sprint taps, demo mode, imported local records and client-written evidence flags award zero travel points.
4. A first correct practice answer earns 25 points, retries add zero, and three correct answers contribute 75 and earn Prepared. Wrong answers earn zero. A first signed-in check earns 5 per Swiss day; same-day repeats add zero. Applying an unlocked style changes the profile card and persists; locked and unknown theme IDs are rejected.
5. Practice achievements are labelled as practice; they never increment a verified-journey count or turn a self-report into a verified record.
6. Unsupported platforms, draft or closed routes, expired route versions and inconclusive evidence cannot unlock travel achievements.
7. Active-day milestones are cumulative at 7/30/100, without expiry or penalties. Daily event dates and awards come from the server; Swiss-midnight and DST behavior are tested. Travel-grant rules remain disabled.
8. Profile and cosmetic changes cannot alter route scoring, map colors, safety labels, margin arithmetic or fallback availability.
9. Account deletion works through the actual backend. Strava remains deferred; a failed Google sign-in leaves anonymous planning usable.
10. Profile controls retain minimum tap sizes, contrast and reduced-motion behavior in light/dark mode and at the existing 320px viewport.

Judge the release on account continuity, accurate labels, delivered customization and useful return visits measured by authenticated activity and retention. A higher active-user count is not evidence of safer transfers or a causal effect of points. No participant reward-comprehension session or full human Google consent test has been recorded; see [the current QA status](../qa/README.md).

## Sources

All external sources were checked on 13 September 2026. The account and daily-use rules above describe the implementation; sections explicitly marked future are proposals. The trials do not validate Hopp's rewards or any proposed GPS model.

[^1]: Patel MS et al. *Effect of a Game-Based Intervention Designed to Enhance Social Incentives to Increase Physical Activity Among Families: The BE FIT Randomized Clinical Trial*. JAMA Internal Medicine, 2017;177:1586–1593. [Primary article abstract and DOI](https://pubmed.ncbi.nlm.nih.gov/28973115/).
[^2]: Patel MS et al. *Effectiveness of Behaviorally Designed Gamification Interventions With Social Incentives for Increasing Physical Activity…: The STEP UP Randomized Clinical Trial*. JAMA Internal Medicine, 2019;179:1624–1632. [Primary article](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2749761).
[^3]: Fanaroff AC et al. *Effect of Gamification, Financial Incentives, or Both to Increase Physical Activity Among Patients at High Risk of Cardiovascular Events: The BE ACTIVE Randomized Controlled Trial*. Circulation, 2024;149:1639–1649. [Primary paper](https://www.ahajournals.org/doi/pdf/10.1161/CIRCULATIONAHA.124.069531). Indexed primary-paper results were available; direct PDF retrieval returned an access error.
[^4]: Garmin. *Introducing Garmin Connect Challenges*, 2020. [Official product description](https://www.garmin.com/en-US/blog/general/garmin-connect-challenges/).
[^5]: Strava. *Strava Challenges*. [Official rules, privacy distinctions and partner prize fulfillment](https://support.strava.com/en-us/articles/15401916-strava-challenges).
[^6]: Google Identity. *Verify the Google ID token on your server side*, updated 22 December 2025. [Official implementation guidance](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
[^7]: Strava Developers. *Getting Started with the Strava API*. [Current prerequisites, capacity and webhook guidance](https://developers.strava.com/docs/getting-started/).
[^8]: Strava Developers. *Authentication*. [OAuth, scopes, token rotation and revocation](https://developers.strava.com/docs/authentication/).
[^9]: Strava. *API Agreement (2026)*, effective 1 June 2026. [Current agreement](https://www.strava.com/legal/api).
[^10]: Strava. *API Policy (2026)*, effective 1 June 2026, §5.4. [Restrictions on analytics, combining data and derived outputs](https://www.strava.com/legal/api_policy).
