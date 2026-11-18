# Full-overview timeline performance (2026-11-18)

Production builds of the same three-lane fixture, 2,000 segments per lane, Chromium 1440 × 1080, no CPU throttling. Both versions consume the package's public entry; baseline source is `2d7bdba`. The fixture has no video, so its scrub measurement isolates browser input/render work. Real media and review-card integration are checked separately in the consumer app.

All **6,000 cells remain mounted**, including during the native zoom drag from 1× to approximately 1.9×. Each action uses 60 Playwright pointer steps. Numbers are animation-frame intervals (not handler latency or guaranteed FPS), with >50 ms long-task counts. Shared-host results are indicative; the consumer's production-data acceptance is required before release.

| Interaction | Before median / P95 | After median / P95 | Long tasks before / after |
| --- | --- | --- | --- |
| Hover at 1× | 88.4 / 135.9 ms | 18.0 / 21.9 ms | 59 / 0 |
| Scrub at 1× | 47.3 / 86.1 ms | 17.9 / 33.3 ms | 42 / 0 |
| Zoom from 1× | 73.0 / 173.0 ms | 25.8 / 42.4 ms | 99 / 2 |

[Raw results](overview.json). [Before](before-overview.png) and [after](after-overview.png) show the same full-overview specimen and viewport. Unreadable text is hidden while all segment cells remain; hover retains captions and zoom reveals inline text.

Profiling identified two costs: lane reconstruction on pointer movement, and browser hit testing / layer processing / paint for thousands of clipped translucent captions. Isolating hover removes most JavaScript work. Density-aware text, alpha colors instead of individual opacity effects, and stable cell membership through 2× address the remaining full-overview costs. Higher zoom still uses the overscanned visible time window.

Validation: 550 tests / 51 files pass; UIKit TypeScript, docs-sync, and generated-reference checks pass. New coverage checks stable full-overview cells through low-magnification zoom and hover captions when inline text is hidden. Existing coverage checks original model indices after windowing, boundary edits, and read-only behavior. Node 26 test runs use `NODE_OPTIONS=--no-experimental-webstorage` so jsdom owns storage.
