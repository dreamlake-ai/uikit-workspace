/**
 * Wires the @dreamlake/dockit shell for this site. Imported for its side
 * effect — FIRST — by both renderer entries, so `initDocs` runs before
 * anything renders (on the server and on the client).
 *
 *   ┌────────────────────────────────────────────────────┐
 *   │  {brand}. / {subtitle}   [uikit v0.1.8 ▾] ⎇ a1b2c3 │
 *   └────────────────────────────────────────────────────┘
 *
 * - The version chip reads `packages/uikit/package.json` at build time
 *   (`__APP_VERSION__` via Vite `define`); `dropdown: true` keeps the
 *   versions.json-backed version switcher.
 * - The 6-char git hash is captured at build/dev start (`__GIT_HASH__`).
 */
import { initDocs } from '@dreamlake/dockit'

const pages = import.meta.glob('./pages/**/+Page.mdx', { eager: true }) as Record<
  string,
  { frontmatter?: Record<string, unknown> }
>

const rawPages = import.meta.glob('./pages/**/+Page.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

initDocs({
  site: {
    brand: 'DreamLake',
    subtitle: 'uikit',
    /** Drives the GitHub link in the top-right of the header. Also used by
     *  the version badge to build the per-commit link. */
    repoUrl: 'https://github.com/dreamlake-ai/uikit-workspace',
    /** Repo + branch hosting these docs pages — drives the rail's
     *  "Edit this page" / "Report an issue" links. */
    docsRepoUrl: 'https://github.com/dreamlake-ai/uikit-workspace',
    docsBranch: 'main',
    /** Leftmost crumb in both the page-top and merged-topbar breadcrumbs. */
    breadcrumbRoot: 'Docs',
    /** Public origin the site is deployed at. Used to build absolute URLs in
     *  the LLM-readable artifacts (llms.txt, llms-full.txt, the skill). */
    url: 'https://uikit.dreamlake.ai',
    /** Importable agent-skill name (also the slug for the published zip). */
    skill: 'dreamlake-uikit',
    /** One-line product summary. Becomes the blockquote in llms.txt and the
     *  skill description. Keep it tight — it's what an LLM reads first. */
    summary:
      'DreamLake uikit is the React component library and design contract — surfaces, ink, semantic color, type, geometry, and the zebra-list patterns shared by every DreamLake page.',
    versionChips: [{ label: 'uikit', version: __APP_VERSION__, dropdown: true }],
    gitHash: __GIT_HASH__,
    docsPagesPath: 'packages/docs/pages',
    // The three-button segmented slider this site has always used (the
    // library default is the single-button cycle toggle).
    themeToggle: 'segmented',
  },
  pages,
  rawPages,
  // First-appearance order of the pre-migration sidebar (sections are
  // scoped per tab; this list preserves the previous rendering exactly).
  sectionOrder: ['Get started', 'Developer notes', 'Components', 'Pipeline'],
  // Moved verbatim from the old lib/tabs.ts. Overview is the catch-all
  // fallback, so its prefix intentionally matches nothing.
  tabs: [
    { id: 'overview', label: 'Overview', numeral: 'I', landing: '/', urlPrefix: '/overview' },
    { id: 'components', label: 'Components', numeral: 'II', landing: '/components/button', urlPrefix: '/components' },
    { id: 'pipeline', label: 'Pipeline View', numeral: 'III', landing: '/pipeline-view/pipeline-graph', urlPrefix: '/pipeline-view' },
  ],
})
