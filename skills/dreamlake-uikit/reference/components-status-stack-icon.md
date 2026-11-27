# StatusStackIcon

Use an 18px stack in a group row to summarize recorded descendant outcomes.
Green means passed, red means failed, amber means running, and neutral means other. Layers indicate
which categories are present; their area and number are **not percentages**.
Exact counts remain in the accessible label or the containing control's description.

A clear lower-right outcome mark leads: red × when any entry failed, amber running
when an entry is running and none failed, or the blue completion check described
below. Failure takes priority over running. Other states have no outcome mark; the counts remain available to assistive technology.

Layers use faint opaque pastel fills. Lower layers fade toward the neutral surface so
foreground status remains clear without colors showing through overlapping layers.
Two- and three-layer stacks share close, evenly spaced geometry; four categories
use a slightly tighter gap to stay within the same bounds. Two categories
stay centered in the same 18px slot. The completion check remains blue.

## Counts and completeness are explicit

Pass `counts={{ passed, failed, running, other }}` and the required `complete` boolean.
`running` is optional and defaults to zero for existing callers. Use it only for
explicitly executing entries, not queued or missing reports. Count every expected leaf once, independently of collapsed groups, filtering or
pagination. The caller maps its domain outcomes. Missing, queued, skipped,
deselected, cancelled or inconclusive entries cannot silently become passes;
`other` is deliberately not called pending because some of these are terminal.
Execution errors may be classified as failed by the caller's policy.

The bottom-right check appears only when `complete === true`, at least one entry
exists, and every counted entry passed. The stack is green in that case; the check
is `#23aaff`. An incomplete inventory with only reported passes remains a green
stack **without** a completion check. Do not invent an extra neutral entry to encode
unknown cardinality: pass `complete={false}`. An empty inventory is neutral and
never receives a check. Negative, fractional, non-finite or unsafe counts display
neutral status unavailable rather than success.

## Accessibility and compact rows

By default the icon has `role="img"` and announces exact counts plus completeness.
`label` prepends group context. The icon has no focus target or independent action.
Use `decorative` when the containing button already announces the same counts.
`CollectionRow`'s leading icon slot is decorative by default, so put exact counts
in the group button's accessible description and use a decorative status stack.
Keep the group title's expansion action and trailing chevron unchanged; this icon
summarizes outcomes and does not control disclosure.

The component has no evaluation schema, data fetching, inferred test hierarchy or
status aggregation logic. Keep those responsibilities with the caller. It uses
existing semantic green/red/neutral colors and stays within the icon bounds.
