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
import { initDocs, type PageFrontmatter, type DocPageLoader } from '@dreamlake/dockit'

const pageMetadata = import.meta.glob<PageFrontmatter>('./pages/**/+Page.mdx', {
  eager: true, query: '?frontmatter', import: 'default',
})
const pageLoaders = import.meta.glob<Awaited<ReturnType<DocPageLoader>>>('./pages/**/+Page.mdx')
const rawPages = import.meta.env.DEV
  ? import.meta.glob<string>('./pages/**/+Page.mdx', { eager: true, query: '?raw', import: 'default' })
  : undefined

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
    continuousReading: true,
    /**
     * Studio's preview-inspector bridge (the "DOM picker"). With this site
     * open in Studio's Web Preview panel, the composer's element picker can
     * reach inside the frame and attach a `<dom-selection>` block — component
     * root + selector, computed styles, box metrics — to a chat message.
     *
     * Served same-origin-agnostic from the Studio docs CDN rather than via
     * the `previewInspector()` Vite plugin, because `@dreamlake/design-
     * integration` is not published to npm — a CDN tag needs no dependency
     * and, unlike the dev-only plugin, also ships on the deployed site, so
     * uikit.dreamlake.ai itself is pickable.
     *
     * It stays dormant until an allowlisted parent origin (any `dreamlake.ai`
     * / `fortyfive.ai` subdomain, or localhost) turns the picker on, and only
     * ever sends DOM metadata — never page contents.
     */
    headScripts: ['https://docs.studio.dreamlake.ai/design-integration.js'],
  },
  pageMetadata,
  pageLoaders,
  rawPages,
  // Topic sections are scoped to each topbar tab.
  sectionOrder: ['Get started', 'Introduction', 'Foundations', 'Interaction', 'Patterns', 'Developer notes', 'Components', 'Pipeline', 'Workflow'],
  // Overview is the catch-all; the style guide has its own topic navigation.
  tabs: [
    { id: 'overview', label: 'Overview', numeral: 'I', landing: '/', urlPrefix: '/overview' },
    { id: 'style-guide', label: 'Style guide', numeral: 'II', landing: '/style-guide', urlPrefix: '/style-guide' },
    { id: 'components', label: 'Components', numeral: 'III', landing: '/components/button', urlPrefix: '/components' },
    { id: 'pipeline', label: 'Pipeline View', numeral: 'IV', landing: '/pipeline-view/pipeline-graph', urlPrefix: '/pipeline-view' },
    { id: 'workflow', label: 'Workflow View', numeral: 'V', landing: '/workflow-view/workflow-canvas', urlPrefix: '/workflow-view' },
  ],
})
