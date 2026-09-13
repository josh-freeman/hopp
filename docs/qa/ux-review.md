# Hopp UX review · 2026-09-13

The current flow is **Plan → Results → Live**, with Settings and platform confirmation as separate screens. Results combines the train, budget, map, directions, route sources and fallback. One **Go live** action replaces the intermediate selection and route pages. The completed automated run and screenshot counts are recorded in the [QA guide](README.md).

## Changes and verification

| Finding | Change and verification |
| --- | --- |
| Reaching Live required several screens, while the map needed a separate tap. | The matching route appears directly in Results. A browser check verifies that the map starts in the upper half of representative phone viewports with at least 140 px visible. Results reaches Live in one tap. |
| Old links could keep the removed steps in circulation. | `#try`, `#route`, `#detail` and `#shortcut` resolve to `#results`; browser coverage checks each alias. Route sources expand within the result. |
| A browse-all directory and promotional headings did not fit the requested product. | Discovery stays tied to the searched trip. The offer leads with its public service number, departure, platform and arrival comparison. |
| Spare time could be confused with the buffer before margin. | Results subtracts both sprint and margin. Unit and browser assertions compare the displayed durations, allowing for rounding. |
| A compact fallback omitted where the passenger should remain aboard until. | The fallback includes the ride-on stop when relevant and remains consistent between Results and Live. Origin routes and bus feeders use the appropriate wording. |
| A live budget could keep showing its original available time. | Live recomputes available time against the clock. Countdown ticking and budget presentation have separate checks. |
| Old offers or unmatched stationboard data could appear usable. | Visible offers expire when the sprint window or two-minute freshness window closes. Unmatched trips do not reset freshness; the countdown pauses and the fallback remains available. |
| Passing an alight stop has different meanings before and after starting. | Live keeps separate Start sprint and On the platform actions. Starting preserves a run already in progress; confirmation retains the selected train. |
| Short viewports need both legible guidance and a reachable action. | Primary actions remain in the lower viewport quarter. Live's decision, countdown, platform and fallback fit without scrolling at 320 × 568. Controls and text have explicit minimum sizes. |
| WebKit reduced the native departure selector's height. | An explicit selector height and appearance keep the control usable across the WebKit viewport matrix. |

The browser suite also covers no-offer trips, passed stops, unknown platforms, offline and rate-limit errors, Not now dismissal, and a late feeder that changes the decision to STAY ON. All five screens pass the automated serious/critical axe checks on representative WebKit and Chromium phones. These checks cover only part of accessibility.

## Visual design

The app now loads Instrument Sans and IBM Plex Mono locally, replacing an unloaded font declaration. Labels and station names use the sans face; timetable numbers use the mono face. A connected pair of stop markers clarifies the search form, all primary actions share one treatment, and the live platform number uses a station-sign block. The maps use restrained geographic detail and larger endpoint labels.

Manual inspection covered Plan, Results and Live at 390 × 844 in light and dark mode and 320 × 568 in light mode. Fonts loaded, no horizontal overflow appeared, and all live information fit. On the shortest Results viewport, scrolling is needed to see the entire map; the 390 px layout shows both markers immediately. Screenshot capture waits for fonts before measuring layout.

## Visual evidence

The generated [390 × 844 Results screenshot](iphone-390x844/results.png) records the combined result, and the [320 × 568 Live screenshot](minimum-320x568/live.png) records the compact guidance layout. The map and timing take priority in the initial Results view; longer directions, expandable evidence and regular connections remain reachable by scrolling. Bottom padding keeps the final content above the fixed action.

Area maps show the researched station context and selected platform group. They are not indoor positioning or evidence that an entrance is currently open. The same public-crossing and field-verification qualifications apply to every map.

The screenshot matrix records the five current screens. Older design mockups remain historical references rather than the current navigation specification. The demo video records the actual browser UI with synthetic times; it is separate from the layout assertions and does not depict a physical journey.

## Expanded-route verification

The browser suite replays unmodified Winterthur Archstrasse → Aarau timetable captures at their original query time. It checks the 08:09 departure on platform 3, the 09:28 fallback arrival, the 23-minute modelled gain, station-specific map and directions, accessible inline source links, and origin-start instructions. Network requests in that test are fulfilled from local captures.

## Work not yet performed

- No physical iPhone or Samsung hardware has been tested. The evidence uses browser engines and CSS viewport emulation.
- No participant think-aloud sessions have been conducted. [The script](think-aloud-script.md) is ready; three-second understanding, one-handed comfort and trust have not been established with users.
- VoiceOver/TalkBack, software keyboard overlap, OS text scaling, browser chrome, safe areas, vibration and wake lock still need physical-device checks.
- Demo and captured-timetable results do not field-verify walking routes, train stopping positions, station access or current transport conditions.
