# Hopp UX review · 2026-09-13

The current flow is **Plan → Results → Live**, with Settings, platform confirmation and optional Profile as separate screens. There are six screens in total. Real accounts await API deployment because Fly billing blocked the backend release; the isolated demo profile is usable, and production sign-in presents an unavailable message. Results combines the train, budget, map, directions, route sources and fallback. One **Go live** action replaces the intermediate selection and route pages. The completed unit, backend and 56-check browser run plus screenshot counts are recorded in the [QA guide](README.md).

## Changes and verification

| Finding | Change and verification |
| --- | --- |
| Reaching Live required several screens, while the map needed a separate tap. | The matching route appears directly in Results. Browser checks verify that the entire map image fits above Go live at all sixteen viewport sizes, is at least 180 px high and contains both endpoints, including at 320 × 568. Results reaches Live in one tap. |
| Old links could keep the removed steps in circulation. | `#try`, `#route`, `#detail` and `#shortcut` resolve to `#results`; browser coverage checks each alias. Route sources expand within the result. |
| A browse-all directory and generic promotional headings did not fit the requested product. | Discovery stays tied to the searched trip. The offer leads with its public service number, departure, platform and arrival comparison; the later user-selected home phrase is retained. |
| The earlier stop could be mistaken for the regular station stop. | Early-alighting results say Get off early; Live leads with **GET OFF EARLY AT** and names the usual stop below. Origin starts keep their own instruction. |
| Accounts could add setup friction to the trip. | Profile remains optional, with no login gate on search, map or Live. The demo account uses separate local storage. |
| Points could imply a verified train journey or reward a faster sprint. | Three practice questions award 25 each once; a successful signed-in connection check awards 5 once per Swiss day. Private platform notes remain unverified and earn zero. |
| Cosmetic rewards needed a visible, usable result. | Six saved profile-card styles unlock at 0/25/75/150/300/600 points. An SVG unlock notice offers direct selection; the planner and safety colors stay independent. |
| Daily engagement could become an expiring streak. | Today’s status, monthly active days and cumulative 7/30/100-day milestones show progress without reset or loss after a break. |
| Spare time could be confused with the buffer before margin. | Results subtracts both sprint and margin. Unit and browser assertions compare the displayed durations, allowing for rounding. |
| A compact fallback omitted where the passenger should remain aboard until. | The fallback includes the ride-on stop when relevant and remains consistent between Results and Live. Origin routes and bus feeders use the appropriate wording. |
| A live budget could keep showing its original available time. | Live recomputes available time against the clock. Countdown ticking and budget presentation have separate checks. |
| Old offers or unmatched stationboard data could appear usable. | Visible offers expire when the sprint window or two-minute freshness window closes. Unmatched trips do not reset freshness; the countdown pauses and the fallback remains available. |
| Passing an alight stop has different meanings before and after starting. | Live keeps separate Start sprint and On the platform actions. Starting preserves a run already in progress; confirmation retains the selected train. |
| Short viewports need both legible guidance and a reachable action. | Primary actions remain in the lower viewport quarter. Live's decision, countdown, platform and fallback fit without scrolling at 320 × 568. Controls and text have explicit minimum sizes. |
| WebKit reduced the native departure selector's height. | An explicit selector height and appearance keep the control usable across the WebKit viewport matrix. |

The browser suite also covers no-offer trips, passed stops, unknown platforms, offline and rate-limit errors, Skip the sprint dismissal, and a late feeder that changes the decision to STAY ON. The suite checks all six screens and the signed-in Profile for serious/critical axe issues on representative WebKit and Chromium phones. The full 56-check browser suite passed; results are recorded in the QA guide. These checks cover only part of accessibility.

## Visual design

The app now loads Instrument Sans and IBM Plex Mono locally, replacing an unloaded font declaration. Labels and station names use the sans face; timetable numbers use the mono face. A connected pair of stop markers clarifies the search form, all primary actions share one treatment, and the live platform number uses a station-sign block. The maps use restrained geographic detail and larger endpoint labels. The explicitly chosen home text is “the art of being on time” and “Train shortcuts for runners.” The runner, account controls and reward graphics are SVGs rather than emoji. Unlock animation respects reduced motion and stays within the optional account flow.

Manual inspection covered Plan, Results and Live at 390 × 844 in light and dark mode and 320 × 568 in light mode. Fonts loaded, no horizontal overflow appeared, and all live information fit. The final compact Results layout shows the whole map image and both markers above Go live even at 320 × 568. The sixteen-size automated matrix confirms a minimum 180 px map height without image cropping. Screenshot capture waits for fonts before measuring layout.

## Visual evidence

The generated [390 × 844 Results screenshot](iphone-390x844/results.png) records the combined result, and the [320 × 568 Live screenshot](minimum-320x568/live.png) records the compact guidance layout. The map and timing take priority in the initial Results view; longer directions, expandable evidence and regular connections remain reachable by scrolling. Bottom padding keeps the final content above the fixed action.

Area maps show the researched station context and selected platform group. They are not indoor positioning or evidence that an entrance is currently open. The same public-crossing and field-verification qualifications apply to every map.

The screenshot matrix records the six current screens at sixteen viewport sizes: 96 images. Older design mockups remain historical references rather than the current navigation specification. The demo video records the actual browser UI with synthetic times; it is separate from the layout assertions and does not depict a physical journey.

## Expanded-route verification

The browser suite replays unmodified Winterthur Archstrasse → Aarau timetable captures at their original query time. It checks the 08:09 departure on platform 3, the 09:28 fallback arrival, the 23-minute modelled gain, station-specific map and directions, accessible inline source links, and origin-start instructions. Network requests in that test are fulfilled from local captures.

## Work not yet performed

- No physical iPhone or Samsung hardware has been tested. The evidence uses browser engines and CSS viewport emulation.
- No complete human Google consent round trip has been recorded; account automation uses a fake provider or isolated mock profile.
- No participant think-aloud sessions have been conducted. [The script](think-aloud-script.md) is ready; three-second understanding, one-handed comfort and trust have not been established with users.
- VoiceOver/TalkBack, software keyboard overlap, OS text scaling, browser chrome, safe areas, vibration and wake lock still need physical-device checks.
- Demo and captured-timetable results do not field-verify walking routes, train stopping positions, station access or current transport conditions.


## Design review · 2026-09-13 (evening)

A designer-eye audit (six lenses over fresh light/dark screenshots at 390 × 844 and 344 × 882, plus an independent source audit) graded the app **C-** overall and **D-** for generic patterns. Thirty findings were fixed as separate `style(design): FINDING-NNN` commits; the audit report, before/after screenshots and grades live outside the repo in the reviewer's gstack project folder.

What changed, in the rider's terms:

- **Results** leads with the decision: `Get off early at Central`, then `Arrive 23:50 · 10 min earlier`, then the map; the GO pill is gone; the timing reads `0:52 to spare` with the derivation `5:00 at the door − 3:04 run − 1:05 margin` underneath; directions are numbered steps; the actions are **Guide me there** and **Skip the sprint** (reversible).
- **Live** shows `Your stop in 0:58` as a third mono number, `LIVE / TIMETABLE / PAUSED`, an amber **STAY ON** state, a hairline `Miss it? Stay on the tram` row (never “fallback”, never “Gl.”), a quiet header without profile/settings, a band flip with a screen-reader announcement, and an urgent-red countdown under 30 s.
- **Brand**: the ↗-in-a-square mark became the hop line (header, PWA icon, profile pass); the stroke runner left the headline; every clock time and duration is IBM Plex Mono with a tight colon.
- **System**: a 12/14/16/20/24/32/40 type scale, three radii (4/8/12), a 4 px rhythm, one focus ring, pressed states on every control, hover only where hover exists, and an entrance/map-reveal/live-dot motion set that respects reduced motion.
- **Copy**: Settings say “Your sprint pace” and “Safety margin”; Profile is “Optional. Free. Private.”; provenance is one sentence (“Platform from the timetable · route not yet run by Hopp”).

Verification: `bun test` (110) and the full WebKit/Chromium suite (56 checks) pass. Test updates were limited to renamed labels, the new budget wording, an animation-settle helper before layout/axe measurements, and opening the profile from Results (the Live header hides it on purpose).
