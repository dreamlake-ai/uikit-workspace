// Fail when a component's *visual style* changed but its documentation page
// didn't. The rendered `<Preview>` blocks in the docs import the live
// component, so demos never drift — what drifts is the hand-written prose
// around them ("inverted ink-on-background fill") and the Props table
// (defaults, variant enums). Nothing catches that but a diff-time check.
//
// The check is deliberately structural: it asserts that the matching docs
// page appears in the same diff. It cannot tell whether the edit was
// *correct* — that's the AI drift-report job's half of the workflow.
//
// It only enforces for components that ALREADY have a docs page. Several
// components ported from the studio kit (TreeView, Dial, Waterfall, …) have
// no page yet, and blocking unrelated styling work on writing one from
// scratch would just teach everyone to reach for the escape hatch. Those are
// listed as a non-blocking notice instead, and the moment someone writes the
// page the component starts being enforced — no list to maintain.
//
// Usage:
//   node scripts/check-docs-sync.mjs                 compare against origin/main
//   node scripts/check-docs-sync.mjs --base <ref>    compare against <ref>
//   node scripts/check-docs-sync.mjs --json          machine-readable output
//
// Escape hatch: start a line of the PR body with `[skip docs-sync]`, followed
// by the reason (the workflow passes the body in via DOCS_SYNC_PR_BODY).
//
// It has to be at the start of a line, and commit messages are not consulted
// at all, because both looser rules fire on their own documentation: this
// script's own commit message and this feature's own PR both *mention* the
// marker in prose, and an earlier draft happily exempted them.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const COMPONENTS_DIR = 'packages/uikit/src/components'
const DOCS_PAGES_DIR = 'packages/docs/pages/components'
const DOCS_SPECIMENS_DIR = 'packages/docs/components/specimens/components'
const STYLE_GUIDE_DIR = 'packages/docs/pages/style-guide'
const UIKIT_STYLESHEET = 'packages/uikit/src/styles.css'

// Components whose docs live somewhere other than the kebab-cased page.
// Keep this list short — an entry here is a documented exemption, not a
// place to hide a component you didn't want to write docs for.
const DOCS_OVERRIDES = {
  // Icons has no per-component page by design; the catalog lives in the
  // style guide's iconography section.
  Icons: [`${STYLE_GUIDE_DIR}/sections/iconography.mdx`],
}

const SKIP_MARKER = '[skip docs-sync]'
const SKIP_RE = /^[ \t>*-]*\[skip docs-sync\]/im

// ── args ─────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const JSON_OUT = argv.includes('--json')
const baseIdx = argv.indexOf('--base')
const BASE = baseIdx !== -1 ? argv[baseIdx + 1] : (process.env.DOCS_SYNC_BASE || 'origin/main')

// ── git helpers ──────────────────────────────────────────────────────────

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 })
}

function mergeBase() {
  try {
    return git(['merge-base', BASE, 'HEAD']).trim()
  } catch {
    // Shallow clone or unknown ref — fall back to the ref itself and let the
    // diff be wider than necessary rather than silently passing.
    return BASE
  }
}

const DIFF_BASE = mergeBase()

// Diffed against the working tree, not HEAD, so a local `pnpm check:docs-sync`
// sees changes you haven't committed yet — otherwise running it before the
// commit reports a cheerful all-clear. In CI the working tree *is* the
// checked-out commit, so the two are identical there. (Brand-new untracked
// files are invisible to `git diff`; they show up once staged.)
function changedFiles() {
  return git(['diff', '--name-only', '--diff-filter=ACMRD', DIFF_BASE])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function fileDiff(path) {
  return git(['diff', '--unified=0', DIFF_BASE, '--', path])
}

// ── visual-change heuristic ──────────────────────────────────────────────
//
// Styling in this package is Tailwind utility classes carrying `uikit-`
// design tokens (`bg-uikit-ink`, `text-uikit-11`, `rounded-md`), assembled
// through `cn()` and stored in VARIANTS/SIZES maps. So a line is "visual"
// when it touches a className expression, a CSS custom property, or a
// quoted string that reads as a class list.

const TAILWIND_PREFIXES =
  /^(bg|text|border|rounded|shadow|opacity|font|tracking|leading|ring|outline|fill|stroke|from|via|to|decoration|divide|accent|caret|placeholder|backdrop|blur|brightness|contrast|saturate|grayscale|animate|transition|duration|delay|ease|translate|scale|rotate|skew|origin|cursor|select|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|w|h|min|max|size|space|inset|top|bottom|left|right|z|flex|grid|col|row|items|justify|content|self|place|order|basis|grow|shrink|overflow|whitespace|break|truncate|list|table|aspect|object|isolate|sr)(-|$)/

const VARIANT_PREFIX = /^(hover|focus|focus-visible|focus-within|active|disabled|group|group-hover|peer|peer-focus|first|last|odd|even|dark|sm|md|lg|xl|2xl|data|aria|motion-safe|motion-reduce|has|not|before|after|placeholder|selection|file|marker)[-:[]/

function looksLikeClassList(str) {
  const tokens = str.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return false
  // Every token must be shaped like a utility class (no spaces-in-prose,
  // no sentences) and at least one must carry a known prefix.
  if (!tokens.every((t) => /^[-\w:./[\]()#%,!*+&<>=]+$/.test(t))) return false
  return tokens.some((t) => {
    const bare = t.replace(/^[-!]/, '')
    const afterVariant = bare.includes(':') ? bare.slice(bare.lastIndexOf(':') + 1) : bare
    return TAILWIND_PREFIXES.test(afterVariant) || VARIANT_PREFIX.test(bare)
  })
}

// Not everything visual goes through a class name. Inline style objects and
// style-shaped defaults carry plenty of it — `height: indicatorHeight ?? 2`
// (09d6b72, the Tabs underline going from 4px to 2px) has no class list
// anywhere on the line. Match on the property name instead, against real CSS
// properties only: this file is full of layout-engine objects with `x:`,
// `y:`, `d:`, `toDot:` keys that are data, not style.
const CSS_PROPERTIES = new Set(
  `color backgroundColor background backgroundImage opacity visibility display position
   top right bottom left inset zIndex
   width height minWidth minHeight maxWidth maxHeight aspectRatio
   margin marginTop marginRight marginBottom marginLeft
   padding paddingTop paddingRight paddingBottom paddingLeft
   border borderWidth borderStyle borderColor borderRadius borderTop borderRight
   borderBottom borderLeft borderTopWidth borderBottomWidth
   boxShadow textShadow outline outlineOffset outlineWidth outlineColor
   font fontSize fontWeight fontFamily fontStyle lineHeight letterSpacing
   textAlign textDecoration textTransform whiteSpace wordBreak
   overflow overflowX overflowY objectFit
   flex flexDirection flexBasis flexGrow flexShrink flexWrap alignItems alignSelf
   justifyContent justifyItems placeItems gap rowGap columnGap order
   gridTemplateColumns gridTemplateRows gridColumn gridRow
   transform transformOrigin rotate scale translate
   transition transitionDuration transitionProperty transitionTimingFunction
   animation animationDuration cursor pointerEvents userSelect
   fill stroke strokeWidth strokeDasharray strokeLinecap filter backdropFilter mixBlendMode`
    .split(/\s+/)
    .filter(Boolean),
)

function isCssPropertyLine(body) {
  const m = body.match(/^\s*['"]?([a-zA-Z][\w-]*)['"]?\s*:/)
  if (!m) return false
  const camel = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  return CSS_PROPERTIES.has(camel)
}

function quotedStrings(line) {
  const out = []
  const re = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  let m
  while ((m = re.exec(line)) !== null) out.push(m[2])
  return out
}

function isVisualLine(line) {
  const body = line.slice(1) // drop the +/- marker
  if (/\bclassName\b|\bclass=|\bcn\(|\bclsx\(|\bcva\(|\bstyle=\{/.test(body)) return true
  if (/var\(--|--[a-z][\w-]*\s*:/.test(body)) return true
  if (isCssPropertyLine(body)) return true
  return quotedStrings(body).some(looksLikeClassList)
}

function diffTouchesVisualStyle(path) {
  if (path.endsWith('.css')) return true
  const diff = fileDiff(path)
  return diff
    .split('\n')
    .filter((l) => (l.startsWith('+') || l.startsWith('-')) && !/^(\+\+\+|---)/.test(l))
    .some(isVisualLine)
}

// ── component → docs mapping ─────────────────────────────────────────────

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function docsTargetsFor(component) {
  if (DOCS_OVERRIDES[component]) return DOCS_OVERRIDES[component]
  const slug = kebab(component)
  return [`${DOCS_PAGES_DIR}/${slug}/+Page.mdx`, `${DOCS_SPECIMENS_DIR}/${slug}/`]
}

// ── main ─────────────────────────────────────────────────────────────────

function main() {
  const skipReason = SKIP_RE.test(process.env.DOCS_SYNC_PR_BODY || '')

  const files = changedFiles()

  // Which components had a visual change?
  const touched = new Map() // component -> [changed source files]
  for (const f of files) {
    const m = f.match(new RegExp(`^${COMPONENTS_DIR}/([^/]+)/`))
    if (!m) continue
    if (!diffTouchesVisualStyle(f)) continue
    if (!touched.has(m[1])) touched.set(m[1], [])
    touched.get(m[1]).push(f)
  }

  const violations = []
  const undocumented = []
  for (const [component, sources] of touched) {
    const targets = docsTargetsFor(component)
    const touchedInDiff = files.some((f) => targets.some((t) => (t.endsWith('/') ? f.startsWith(t) : f === t)))
    if (touchedInDiff) continue
    // No page to keep in sync yet — surface it, don't block on it.
    if (!targets.some((t) => existsSync(join(REPO_ROOT, t.replace(/\/$/, ''))))) {
      undocumented.push({ component, sources, expected: targets })
      continue
    }
    violations.push({ component, sources, expected: targets })
  }

  // The shared stylesheet defines the tokens the style guide documents.
  if (files.includes(UIKIT_STYLESHEET) && !files.some((f) => f.startsWith(STYLE_GUIDE_DIR))) {
    violations.push({
      component: '(design tokens)',
      sources: [UIKIT_STYLESHEET],
      expected: [`${STYLE_GUIDE_DIR}/sections/*.mdx`],
    })
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ base: DIFF_BASE, skipped: skipReason, violations, undocumented }, null, 2))
    return violations.length && !skipReason ? 1 : 0
  }

  if (!touched.size) {
    console.log('docs-sync: no visual-style changes to uikit components in this diff.')
    return 0
  }

  console.log(`docs-sync: ${touched.size} component(s) with visual-style changes in this diff.`)

  if (undocumented.length) {
    console.log('\nNot enforced — these components have no docs page yet:\n')
    for (const u of undocumented) console.log(`  ${u.component}  (would be ${u.expected[0]})`)
    console.log('\nWriting one is welcome but not required here.')
  }

  if (!violations.length) {
    console.log('\nEvery documented component in this diff has a matching documentation edit.')
    return 0
  }

  console.log('\nThe following visual changes have no matching documentation edit:\n')
  for (const v of violations) {
    console.log(`  ${v.component}`)
    for (const s of v.sources) console.log(`    changed:  ${s}`)
    for (const t of v.expected) console.log(`    expected: ${t}`)
    console.log('')
  }
  console.log(
    'Update the prose and the Props table on those pages so they still describe\n' +
      'what the component actually looks like. The <Preview> blocks render the live\n' +
      'component and update themselves; the words around them do not.\n' +
      `\nIf this change genuinely has no visual effect, start a line of the PR body\n` +
      `with "${SKIP_MARKER}" followed by the reason.\n`,
  )

  if (skipReason) {
    console.log(`Overridden by "${SKIP_MARKER}" — passing anyway.`)
    return 0
  }
  return 1
}

process.exit(main())
