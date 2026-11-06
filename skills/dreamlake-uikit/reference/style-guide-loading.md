# Loading & progress

Use the shared `Spinner` from `@dreamlake/uikit` for every indeterminate wait.
It cycles through `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` every 80ms (800ms per cycle).
The built-in spinner, busy buttons, tree loaders, pipeline controls, and video
buffering use this same implementation. Do not introduce a feature-specific
loader, including a separate agent thinking animation.

<div role="status" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
   Loading files…
</div>

## With a label

Name the pending work: “Loading files…”, “Connecting…”, or “Uploading…”. Use this
for pages, panels, lists, previews, buffering, and long-running operations.
Keep measured counts, percentages, and named steps as static text alongside the
spinner. The agent uses the same spinner with “Thinking” and elapsed seconds.

```tsx
<div role="status">
  <Spinner aria-hidden="true" /> Loading files…
</div>
```

## In a control

Use the same spinner without a visible label when space is constrained. Retain
an accessible action name and expose the control's busy state. `Button loading`
uses the shared spinner and disables the action while pending.

Saving…

## Timing and layout

The spinner appears after 250ms so fast operations do not flash; status text is
accessible immediately. Reserve space for the result and retain existing content
during refreshes. Remove the indicator when work completes, fails, or is canceled.
Static placeholders may preserve layout; they do not shimmer or pulse.

## Accessibility

Announce the status once with `role="status"`. If a surrounding label already
announces the operation, pass `aria-hidden="true"` to the spinner. Under
`prefers-reduced-motion`, the spinner remains on its first frame.

## Prohibited alternatives

No expanding circles, rotating rings or refresh icons, pulsing dots, animated
ellipses, shimmering text, shimmer, or pulsing skeletons. The Braille spinner is
the only animated indication of a wait. Ordinary navigation transitions and data
visualizations are outside this loading rule. UIKit's regression guard rejects
alternate rotating/pulsing loader implementations.
