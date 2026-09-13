# Recorded engine fixtures

These files are **unaltered HTTP response bodies**, recovered on 2026-09-13 from Claude Code's existing research scratchpad. They are distinct from the deliberately synthetic interactive demo scenarios in `data/fixtures/scenarios.json`. Tests do not make network requests or move these timetable dates to the present.

Both captures were made during the API audit on 2026-09-13 for travel on 2026-09-14. The originating commands are recorded in Claude research agent `a843e34faa39dee21`, session `d9b722cc-c905-4ede-8387-8ec9e6fa26f6`. Original files were `scratchpad/research/qR.json` and `qO.json`; the retry command's HTTP status suffix was removed by the original capture script before these JSON files were written.

| Fixture | Original request | SHA-256 |
| --- | --- | --- |
| `engine-margarethen-zurich-2026-09-14.json` | `/v1/connections?from=8589340&to=8503000&date=2026-09-14&time=08:15&limit=4` | `e7f7fe45736761673e8c1e6b8fa1f003bde57a6b8ea3aeeb72e00ac19401d185` |
| `engine-basel-zurich-candidates-2026-09-14.json` | `/v1/connections?from=8500010&to=8503000&date=2026-09-14&time=08:28&limit=4&transportations[]=train` | `f5a3f96cec77a382cc9bf1ef4eaf4446b86e6667d2f7280ef0d4a8357f2c58ff` |

Source host: `https://transport.opendata.ch`. The candidate capture used a train-only filter during early research. Production candidate requests omit that filter to preserve onward bus/boat legs; synthetic engine tests cover those onward connections.

The observed example is intentionally a **no-improvement** case: tram 2 reaches IWB at 08:24; the earliest catchable Zürich train is IC 3 at 08:33 on Gleis 11, already SBB's baseline, arriving 09:26. This demonstrates why a faster transfer does not by itself justify recommending a sprint.
