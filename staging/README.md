# staging — design source files

Reference material from a Claude Design handoff
(`api.anthropic.com/v1/design/h/SnNYFa5hiKnO2orNfaSmAA`). These are
the canonical specs for the `@dreamlake/uikit` docs site — the docs
pages under `pages/**/*.mdx` are derived from them, in pieces, as
each section gets cherry-picked.

These files are **read-only references**. Don't edit in place — when
a design rule is contradicted by something better at implementation
time, capture the divergence in `dev-notes/` (with a release note in
`dev-notes/CHANGELOG.mdx`), don't rewrite the source.

## Files

| File | What it is |
|---|---|
| [`dreamlake-design-guide.html`](./dreamlake-design-guide.html) | The single-page UIkit reference — 4,309 lines, 9 nav sections, ~40 anchors. Foundations, geometry, zebra lists, components (chrome/lists/atoms), compositions, icons, do-and-don't. The canonical handoff artifact. |
| [`tokens.css`](./tokens.css) | The shared color/surface/ink/accent token contract. Already partially mirrored into `src/theme.css` (`@theme` block) for Tailwind v4. The zebra-list row tokens (`--row-base-bg`, `--row-zebra-bg`, etc.) are still pending port. |
| [`design.md`](./design.md) | Cross-page reasoning: 6-color semantic palette, surface stack rationale, `ExperimentRowCompact` and `PipeJobRow` color schemes. The "why" behind tokens.css and the row components. |
| [`zebra-list-style-guide.md`](./zebra-list-style-guide.md) | The four-band zebra-list model — base, zebra, hover, selected. Per-state colors, multi-row run rules, when-to-pick-A-vs-B for selection styling. |
| [`pipe-jobrow-color-scheme.md`](./pipe-jobrow-color-scheme.md) | Specific PipeJobRow color scheme. Subset/specialization of the cross-page rules in `design.md`. |

## Origin

Pulled from a Claude Design (claude.ai/design) handoff bundle. The
bundle's own `README.md` instructs coding agents to read the chat
transcripts first — those weren't pulled into this repo (52
conversations, ~50 MB, not source-of-truth). The 5 files here are
the design output the user iterated to. Chat history can be
re-fetched from the original URL if needed.

The bundle also contained ~25 `*.jsx` reference implementations of
other DreamLake apps (ml-dash, dreamlake-pipelines, timetravel,
etc.) and per-page HTML prototypes. Those weren't pulled either —
they're app-specific assemblies, not uikit primitives. The uikit
docs site documents the **shared vocabulary** (foundations,
components, atoms); the apps are downstream consumers.

## How to navigate

When implementing a docs page, the workflow is:

1. Open the relevant section in `dreamlake-design-guide.html`
   (search for `<h2>` near the section name).
2. Cross-reference `design.md` for the "why" if the section involves
   semantic color or surfaces.
3. Cross-reference `zebra-list-style-guide.md` if the section
   involves list rows.
4. Port to MDX under `pages/<section>/+Page.mdx`. Cite this folder
   in the PR description (e.g. "spec: `staging/design.md` §Surface
   tokens").
