# Project conventions for AI coding agents

This file is read by Claude Code and similar AI coding agents when
working on this repo. The conventions here apply to every change made
by an agent (and ideally by humans too).

## Pull-request workflow

**All changes go through a pull request.** No direct pushes to `main`.

- Branch off `main` with a topic name: `feat/...`, `fix/...`,
  `chore/...`, `docs/...`.
- Push the branch and open a PR via `gh pr create` with a meaningful
  title and a body that explains the *why* (not just the *what* — the
  diff already shows what).
- Wait for review (or self-review for small doc PRs) before merging.
- Squash-merge unless the branch's history is genuinely worth
  preserving.

`pnpm staging` and `pnpm prod` push to the deploy branches
(`netlify-staging`, `netlify-production`); those pushes are the
release trigger, not source-of-truth changes, so they don't go
through PR. Everything that lands on `main` does.

## Documentation release notes

**Each non-trivial change to `dev-notes/*.mdx` gets a release note in
`dev-notes/CHANGELOG.mdx`.** The PR description should cite the
release note so reviewers see the running history without leaving the
PR.

Entry format:

```md
## YYYY-MM-DD — short title

- One bullet per substantive change.
- Each bullet says what changed and why.
- Cite the doc by relative path (e.g. `migration-patterns.mdx`)
  when the change is doc-specific.
```

Use the actual calendar date, not "today" — entries get read out of
context later.

Scope: this rule applies to substantive doc changes (new patterns,
removed advice, restructured sections). README copy edits and typo
fixes don't need a changelog entry — judgment call.

## Format conventions

- Engineering notes are `.mdx` by default — see
  `dev-notes/README.mdx` for the rationale.
- New docs added to `dev-notes/` must be listed in the README's
  index, with a one-line hook each.

## Pointers

- `dev-notes/migration-patterns.mdx` — patterns from the
  prototype-to-React conversion. Stack choices, CSS migration in
  stages, JS-to-React patterns, deploy workflow, gotchas.
- `dev-notes/CHANGELOG.mdx` — running history of doc changes.
- `dev-notes/README.mdx` — folder convention + index.

## Versioning and release (load-bearing rules)

- The root `package.json` plus every `packages/*/package.json` must agree on
  `version`. `pnpm prod` runs a check and **refuses to deploy** on mismatch.
- Bump version with `pnpm set-version <x.y.z>` (rewrites every package.json
  that declares a version), then `pnpm install`, then commit both
  `package.json` files and `pnpm-lock.yaml`.
- `pnpm prod` does, in order: version-consistency check → force-push HEAD to
  `v/<version>` snapshot branch → force-push HEAD to `netlify-production`.
- `pnpm staging` is intentionally lighter: just force-push HEAD to
  `netlify-staging`. No version check, no snapshot. Use for WIP previews.
- The version pipeline source is `scripts/{lib-packages,set-version,
  push-version-branch}.mjs`.

## pnpm scripts (versioning + release)

| Script                | What it does                                              |
| --------------------- | --------------------------------------------------------- |
| `pnpm set-version`    | Sync `version` across root + `packages/*/package.json`    |
| `pnpm version-branch` | Check versions, then force-push HEAD to `v/<version>`     |
| `pnpm prod`           | `version-branch` then push to `netlify-production`        |
| `pnpm staging`        | Push to `netlify-staging` (no check, no snapshot)         |
