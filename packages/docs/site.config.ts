/**
 * Site-level branding shown in the top-left of the docs shell.
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  {brand}. / {subtitle}   v0.1.0  ⎇ a1b2c3   │
 *   └─────────────────────────────────────────────┘
 *
 * - `brand` and `subtitle` are author-edited here.
 * - The version chip is injected from `package.json` at build time
 *   (`__APP_VERSION__`).
 * - The 6-char git hash is captured at build/dev start (`__GIT_HASH__`).
 */
export const siteConfig = {
  brand: 'DreamLake',
  subtitle: 'uikit',
  /** Drives the GitHub link in the top-right of the header. Set to an
   *  empty string to hide the icon. */
  repoUrl: 'https://github.com/dreamlake-ai/uikit-workspace',
  /** Leftmost crumb in both the page-top and merged-topbar breadcrumbs.
   *  Set to an empty string to omit the root crumb entirely. */
  breadcrumbRoot: 'Docs',
}
