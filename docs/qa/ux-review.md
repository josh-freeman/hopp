# Hopp UX review · 2026-09-13

The final build passed, and the complete browser suite passed **44 of 44 checks in 20.3 seconds** across WebKit and Chromium: 16 viewport flow checks and 14 behavior/accessibility checks on each of two representative phones. All 16 viewports have nine screenshots, producing 144 PNGs in this directory. Every PNG was checked against its named CSS viewport dimensions.

## Observed issues and fixes

| Finding | Change and verification |
| --- | --- |
| WebKit rendered the departure selector at 21 px high despite its minimum height. | An explicit 48 px height and custom select appearance now provide a usable target. All WebKit viewport audits pass. |
| Try it labeled the pre-margin buffer “Spare after margin”: a 5:00 budget, 3:04 sprint, and 1:05 margin showed 1:57 spare. | Results and Try it now subtract both sprint and margin. A browser assertion checks displayed arithmetic within two seconds of rounding. Live and Try it show approximately 0:52 for that fixture. |
| The compact fallback gave a train and platform without saying where the passenger should stay aboard until. | The fallback now includes “Stay on to Bahnhofplatz/HB” for the Zürich fixture. The same fallback persists through detail and Live. |
| A live budget could keep showing the original available time after time had elapsed. | Live computes its displayed budget against the current time. Countdown ticking and the budget presentation are checked separately. |
| A route preview could outlive the data that justified its offer. | Returning from a preview after two minutes cannot revive that offer. A browser clock regression verifies the normal connections remain available. |
| A stationboard response without matching journey data could make an old countdown appear fresh. | Unmatched live trips cannot reset the freshness timestamp. The regression verifies “Updates paused”, a paused countdown, a retained fallback, and no Start sprint button after expiry. |
| Passing the alight stop needs different handling before and after the passenger starts running. | Live has an explicit Start sprint action before On the platform, while the three taps from Results still reach Live. |
| Compact layouts needed the main action reachable while retaining live essentials. | Primary actions stay in the lower viewport quarter; Live's countdown, platform, stop, fallback, header, and practice banner fit at 320 × 568. Navigations must naturally return to scroll position zero. |
| The Results offer was so tall that regular connections disappeared below the initial 390 × 844 viewport. | Removed the duplicated large stats row and tightened the offer spacing. The first regular connection is now visible alongside the offer and fallback. |
| Fixed actions covered the Try it budget on short phones. | At heights up to 740 px, the decorative icon is hidden and the intro and stats use less space. The sprint/spare numbers and complete budget must now fit above the fixed actions on every tested viewport, including 320 × 568. |

The browser checks also cover no-offer trips, an already-passed stop, an unknown platform, offline and rate-limit errors, dismissal with Not now, the optional route, and a late tram that changes the decision to STAY ON. All nine screens pass the serious/critical axe checks on representative WebKit and Chromium phones. No claim is made that axe alone establishes full accessibility.

## Visual review

Representative screenshots were inspected for Samsung 412 × 915, iPhone 390 × 844, and the minimum 320 × 568 layout, and compared with the approved phone mockups. The minimum Live screen keeps its decision, numbers, fallback, and action visible. The minimum Plan screen shows both stations and its departure selector above the fixed action area.

The final [390 × 844 Results screenshot](iphone-390x844/results.png) shows the offer, actionable fallback, and first regular connection together. The final [320 × 568 Try it screenshot](minimum-320x568/try.png) shows full sprint time, spare after margin, have/need/margin arithmetic, and walking comparison above its actions. No serious unresolved visual issue was observed in this reviewed sample.

Route instructions and Settings can scroll behind their fixed action area, with bottom padding allowing the last content to be reached. Their viewport screenshots deliberately show only what fits on the phone; use the interactive preview to inspect the remaining content.

## Work not yet performed

- No physical iPhone or Samsung hardware has been tested. These are browser-engine and CSS-viewport emulations.
- No participant think-aloud sessions have been conducted. [The script](think-aloud-script.md) is ready; three-second understanding, one-handed comfort, and trust have not been established with users.
- VoiceOver/TalkBack, software keyboard overlap, OS text scaling, safe-area behavior with browser chrome, vibration, and wake lock still need physical-device checks.
- These demo results do not field-verify walking routes, train stopping positions, station access, or current transport conditions. Existing route verification labels remain necessary.

See [the QA guide](README.md) for commands, the full viewport matrix, and the scope of the automated assertions.

## Expanded-route verification

The browser suite now also replays unmodified Winterthur Archstrasse → Aarau timetable captures at their original query time. It verifies the 08:09 departure on platform 3, the 09:28 fallback arrival, the 23-minute modelled gain, correct station-specific directions, accessible source links, and origin-start instructions. All network requests in that test are fulfilled from local captures.

The copy pass removes the home tagline and promotional headings. No route directory is exposed on the home screen; route notes show only the searched trip’s access. Bus and origin arrival labels have unit coverage.

Visible offers now expire without a tap, both at the two-minute freshness limit and when an origin sprint window closes earlier. The browser suite verifies both transitions.
