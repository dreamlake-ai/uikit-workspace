// Top-level tab definitions for the docs site (mirrors the lakeshore docs).
//
// A tab is a lens onto the docs — each one filters the sidebar to the pages
// whose URL falls under it. The sidebar reflows when the active tab changes;
// the URL itself encodes the tab via its first path segment (e.g.
// `/components/button` belongs to the `components` tab, `/pipeline-view/...`
// to the `pipeline` tab). The site root `/` — and any page not under a
// defined prefix (style guide, dev notes) — resolves to Overview.

export interface TabDef {
  id: string
  label: string
  /** Default landing path when the user clicks this tab from elsewhere. */
  landing: string
  /** URL prefix (first segment) that scopes pages to this tab. Overview is
   *  the catch-all fallback, so its prefix intentionally matches nothing. */
  urlPrefix: string
}

export const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', landing: '/', urlPrefix: '/overview' },
  { id: 'components', label: 'Components', landing: '/components/button', urlPrefix: '/components' },
  { id: 'pipeline', label: 'Pipeline View', landing: '/pipeline-view/pipeline-graph', urlPrefix: '/pipeline-view' },
]

/** First path segment of a URL: `/components/button` -> `components`,
 *  `/` -> ``, `/pipeline-view` -> `pipeline-view`. */
function firstSegment(url: string): string {
  const path = url.split(/[?#]/)[0]
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!trimmed) return ''
  return trimmed.split('/')[0]
}

/** Active tab for a page URL. Root and unknown prefixes fall back to
 *  Overview so an orphan page never leaves the sidebar empty. */
export function tabForUrl(url: string | undefined): string {
  if (!url) return TABS[0].id
  const seg = firstSegment(url)
  if (!seg) return TABS[0].id
  for (const tab of TABS) {
    if (tab.urlPrefix === `/${seg}`) return tab.id
  }
  return TABS[0].id
}

/** True if a page URL belongs to the given tab. */
export function urlInTab(url: string, tabId: string): boolean {
  return tabForUrl(url) === tabId
}
