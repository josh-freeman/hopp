# Strava integration for Hopp

Checked 13 September 2026 against Strava’s current primary documentation. No application was registered and no athlete data was accessed.

## Recommendation

Keep Strava optional and outside the initial account/rewards release. Hopp does not need it to remember preferences, record a user-confirmed connection, or maintain its own achievements. A small private activity panel is technically feasible, but offers limited value without a useful, permitted connection to the trip experience.

Do **not** promise automatic pace calibration or Strava-backed rewards. The API Policy effective 1 June 2026 restricts analytics, derived outputs and combining Strava data with other customer data. Obtain a written determination for the exact proposed use before designing around it. Imported activity data must also stay out of AI services. [API Policy §§5.3–5.4](https://www.strava.com/legal/api_policy).

## What the integration could do

| Feature | Assessment for Hopp |
| --- | --- |
| Hopp account, settings and its own trip history | Implement independently of Strava. |
| Recent Strava runs visible only to their owner | Smallest plausible read integration; optional account panel, not a replacement activity feed. |
| Automatic pace estimate from previous runs | Not approved by this research; policy restrictions above prevent treating this as an available feature. |
| Public activity cards, Strava-derived badges or leaderboards | Exclude: the Agreement limits disclosure of a user’s Strava data to that user. [Agreement](https://www.strava.com/legal/api). |
| Evidence that somebody boarded a particular train | Unavailable. An activity record does not establish boarding. |
| Explicit export of a future recording made by Hopp | Separate future feature, only after Hopp records an actual activity. The Agreement permits optional uploads; do not upload a planned sprint as if it happened. [Agreement §7](https://www.strava.com/legal/api). |

For a private panel, `GET /api/v3/athlete/activities` returns activity summaries and supports `before`, `after`, `page` and `per_page`. A bounded request such as the most recent 30 activities would suffice; filter by `sport_type` and show at most five runs. Useful existing fields include title, date, distance and moving time. Do not request GPS streams, heart rate, equipment or full history for this panel. These are Hopp’s proposed limits, not API limits. [Activity reference](https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities).

An average running speed is not a measured station-transfer speed: traffic lights, stairs, luggage, crowds and train-door position remain unknown. More fundamentally, Strava accepts manual activities, and hidden activity start times can be returned as midnight plus one second. Neither an uploaded activity nor a matching approximate location proves that a train was caught. [Activity reference](https://developers.strava.com/docs/reference/#api-Activities-createActivity), [changelog, 3 July 2024](https://developers.strava.com/docs/changelog/).

## Actual access and cost

A Standard-tier developer now needs a Strava subscription to create an API app. Register the app in **Settings → My API Application**, provide its actual site and callback domain, and keep the issued client secret confidential. New apps start with one athlete: the developer. The dashboard allows a self-service increase to 10 athletes; more requires review. [Getting started](https://developers.strava.com/docs/getting-started/).

The official FAQ says an existing Strava subscription includes API access with no additional API fee. Standard apps can reach 9,999 athletes after review; Extended Access begins at 10,000 approved athletes. Review and further capacity are not guaranteed. Do not advertise this as an unrestricted free integration. Subscription eligibility should be checked in the owner’s dashboard; this research did not inspect an account. [Developer FAQ](https://communityhub.strava.com/developers-knowledge-base-14/strava-api-faq-12906).

| Access stage | Read requests / 15 minutes | Read requests / day | Overall / 15 minutes | Overall / day |
| --- | ---: | ---: | ---: | ---: |
| Initial default | 100 | 1,000 | 200 | 2,000 |
| Self-upgraded 10-athlete access | 200 | 2,000 | 400 | 4,000 |

These are application-wide quotas. Use the dashboard and returned `X-RateLimit-*` / `X-ReadRateLimit-*` headers as the operational limits. Respect `429`; do not repeatedly retry. Quarter-hour limits reset on clock boundaries and daily limits at midnight UTC. [Rate limits](https://developers.strava.com/docs/rate-limits/).

## OAuth and the backend boundary

For Hopp’s web app, authorize with `https://www.strava.com/oauth/authorize`, `response_type=code`, the registered redirect URI and `activity:read`. That scope includes Everyone/Followers activities but excludes Only You activities and privacy-zone data. Do not request `activity:read_all`, profile-write or activity-write for the proposed panel. Users can decline individual scopes; check the granted scopes. [Authentication](https://developers.strava.com/docs/authentication/).

Exchange the one-use code server-side at `POST https://www.strava.com/oauth/token`. Access tokens last six hours. Persist the latest refresh token atomically, since a newly issued refresh token invalidates its predecessor. For disconnect, use the recommended `POST https://www.strava.com/oauth/revoke` with HTTP Basic client authentication and an access/refresh token. Its idempotent success response is HTTP 200. The legacy `/oauth/deauthorize` endpoint retires on 1 June 2027. [Authentication](https://developers.strava.com/docs/authentication/).

Proposed implementation:

- Link an already authenticated Hopp account to the Strava athlete ID. Strava’s athlete response no longer supplies email, so it cannot substitute for Hopp’s email-based account recovery. [Changelog, 17 January 2019](https://developers.strava.com/docs/changelog/).
- Use a short-lived, single-use OAuth `state` bound to that Hopp session. Reject mismatches, expired attempts and unintended account replacement.
- Keep client credentials in server secrets and encrypted token records accessible only to the backend. Never place them in Vite variables, browser storage, static Pages assets, analytics or logs.
- Have the frontend request only the deliberately small display response from Hopp’s authenticated endpoint. Serialize refreshes for each athlete to avoid rotation races.
- Use a dedicated cache with expiry and deletion jobs. Keep integration records separate from Hopp’s trip records; obtain clarification on the deletion ambiguity below before promising retention on disconnect.

The OAuth flow requires a confidential client secret. Therefore GitHub Pages alone cannot host the complete integration; it needs the account backend or another controlled server component. This is an architectural conclusion, not a requirement to adopt a particular hosting vendor.

## Webhooks, privacy and deletion

Register one webhook subscription for the application. Strava sends athlete deauthorization and activity create/update/delete events. Validate the initial challenge and acknowledge events within two seconds, then process asynchronously. With `activity:read`, making an activity Only You produces a delete event. Use these events to invalidate cached activity displays instead of polling; handle duplicates and out-of-order events. [Webhooks](https://developers.strava.com/docs/webhooks/).

The current Policy imposes a seven-day cache maximum, expeditious activity deletion propagation within 48 hours, and permanent deletion following revocation/request within 30 days at the latest. Obtain explicit consent, provide a privacy policy, withdrawal/deletion controls, support details and written deletion confirmation. [API Policy §§2, 6–8](https://www.strava.com/legal/api_policy).

**Clarification required:** Policy §2.5 refers to deleting all defined “Data”; §7.4 names Strava and derived personal data. The Agreement defines “Data” to include the developer’s other app data. Do not assume disconnect automatically permits retaining every Hopp record. [API Policy](https://www.strava.com/legal/api_policy), [Agreement §2.3](https://www.strava.com/legal/api).

For Hopp, design deletion to hide imported content immediately, revoke access, purge caches/tokens and queued work, and show confirmation. The published maximum periods are not a reason to leave data visible. Integration errors must never block ordinary trip planning.

## Branding and current changes

Use Strava’s supplied OAuth button artwork if displaying a branded **Connect with Strava** button; its standard height is 48 px. Preserve the logo, keep Hopp’s identity distinct, and imply no endorsement. A link back to an activity should read **View on Strava** and be visibly styled as a link. Do not add a decorative, nonfunctional connection button before a real authorization flow exists. [Brand guidelines](https://developers.strava.com/guidelines/).

Club Activities/Members/Admins were removed on 1 September 2026, and Segment Explore is restricted to approved Extended Access apps. Those endpoints cannot supply Hopp’s social layer. The new API base `https://api-v3.strava.com` becomes available on 4 January 2027; keep the current base configurable and recheck the migration instructions before switching. [Changelog](https://developers.strava.com/docs/changelog/).

## What would make implementation ready

Before implementation, settle the exact private-panel use case and the deletion ambiguity with Strava, then obtain the app owner’s subscribed developer account, client ID/secret, actual callback domain and dashboard capacity. Add the privacy text, webhook endpoint and backend secret storage, and test declined scopes, token rotation, disconnect, deleted/private activities and quota exhaustion.

No credential, paid subscription, external registration or Strava review has been obtained by this research. Hopp’s account and trip features can proceed independently.
