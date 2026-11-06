# Style Guide

The complete design contract: surfaces and ink, the six-hue semantic palette, the
type pairing, the spacing scale and page grid, the icon catalog, the shadow +
z-index ladder, the radius scale and hairline weight, the motion vocabulary, and
the zebra-list four-band model. Every DreamLake page reads from this contract.

### Loading and progress: one shared dot spinner

Use the existing Braille dot spinner for every indeterminate wait in DreamLake.
The frame sequence is `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏`, advancing every 80ms (800ms
per cycle). This is the single loading animation across the app, UIKit, and
embedded viewers. Do not invent a loader for an individual feature.

- **With a label:** use a short description of the pending work, such as
  “Loading files…”, “Connecting…”, or “Uploading…”. Use this for pages, panels,
  lists, previews, buffering, and long-running operations. Keep measured counts,
  percentages, and named steps as text alongside the shared spinner.
- **Without a visible label:** use the same spinner in an icon-sized button or
  other constrained space. The containing control must retain an accessible
  name describing its action and expose its busy state.
- **Timing and layout:** delay the visual indicator by 250ms so fast operations
  do not flash. Keep the status accessible immediately. Reserve the space needed
  for the result, retain existing content during refreshes, and remove the
  indicator when work completes, fails, or is canceled.
- **Accessibility:** announce the status once with `role="status"`; keep the
  animated glyph decorative (`aria-hidden="true"`). Respect
  `prefers-reduced-motion` by showing a static first frame with the same label.
- **No alternative busy animations:** no expanding circles, rotating rings or
  refresh icons, pulsing dots, animated ellipses, shimmer, or pulsing skeletons.
  Static layout placeholders may reserve space; the dot spinner is the only
  animated indication of a wait. Ordinary navigation transitions and data
  visualizations are outside this loading rule.

**Implementation status:** the reference already exists in the app's
`components/ui/Loading.tsx` and `.dl-braille` in `styles/index.css`. UIKit's
exported `Spinner` and internal loading states still need migration to this
visual. Existing ring and skeleton previews document legacy behavior; they are
not approved alternatives. Until the shared UIKit implementation is migrated,
app features should reuse the existing app loader in its inline form or its
bare spinner instead of copying the glyph animation into new components.
