import { pages, type PageMeta } from './navigation'

// Pull the raw MDX source for every page at build time. The
// `mdxRawLoader` plugin in vite.config.ts rewrites `*.mdx?raw` ids so
// they sidestep @mdx-js/rollup's filter, returning plain text via the
// standard `import.meta.glob` API.
const rawSources = import.meta.glob<string>('../pages/**/+Page.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export interface SearchEntry extends PageMeta {
  /** Heading text (h2/h3) for higher-weight ranking. */
  headings: string[]
  /** Plain-text body, lowercased, with markdown / JSX / code stripped. */
  body: string
}

function pathFromFile(filePath: string): string {
  const dir = filePath.replace('../pages/', '').replace('/+Page.mdx', '')
  return dir === 'index' ? '/' : `/${dir}`
}

/** Strip frontmatter, imports, JSX, code fences, and markdown decoration. */
function stripToText(raw: string): { headings: string[]; body: string } {
  let s = raw

  // Frontmatter block at the top.
  s = s.replace(/^---[\s\S]*?\n---\s*\n?/, '')

  // ESM `import ... from '...'` lines (MDX allows them in the body too).
  s = s.replace(/^[ \t]*import[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')

  // Fenced code blocks — drop entirely, they're noise for prose search.
  s = s.replace(/```[\s\S]*?```/g, ' ')

  // Inline `code` — keep the content but strip the backticks.
  s = s.replace(/`([^`]*)`/g, '$1')

  // Capture headings before stripping markdown so we can rank them higher.
  const headings: string[] = []
  s = s.replace(/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, (_m, text) => {
    headings.push(text.trim())
    return ' '
  })

  // JSX / HTML-ish tags. This removes `<Preview ...>` opening + `</Preview>`
  // closing, but keeps inner prose. Self-closing tags vanish.
  s = s.replace(/<[^>]+>/g, ' ')

  // Markdown link syntax → label only. `[label](url)` and `[label][ref]`.
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  s = s.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')

  // Bold / italic / strike markers.
  s = s.replace(/[*_~]+/g, ' ')

  // Table pipes.
  s = s.replace(/\|/g, ' ')

  // Collapse whitespace.
  s = s.replace(/\s+/g, ' ').trim().toLowerCase()

  return { headings, body: s }
}

const bodyMap = new Map<string, { headings: string[]; body: string }>()
for (const [filePath, raw] of Object.entries(rawSources)) {
  bodyMap.set(pathFromFile(filePath), stripToText(raw))
}

export const searchIndex: SearchEntry[] = pages.map(p => {
  const extracted = bodyMap.get(p.path) ?? { headings: [], body: '' }
  return { ...p, headings: extracted.headings, body: extracted.body }
})

export interface SearchHit {
  entry: SearchEntry
  score: number
  /** Up to ~140 chars of context around the first body match, for the preview pane. */
  snippet: string
}

/**
 * Rank weights — highest signal first:
 *   title exact / startsWith / contains
 *   heading contains
 *   description contains
 *   section contains
 *   body contains (count matters)
 *   subsequence fuzzy (last resort)
 */
export function search(query: string, limit = 30): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const hits: SearchHit[] = []
  for (const entry of searchIndex) {
    const title = entry.title.toLowerCase()
    const section = entry.section.toLowerCase()
    const description = (entry.description ?? '').toLowerCase()
    let score = 0
    let snippet = ''

    if (title === q) score += 30
    else if (title.startsWith(q)) score += 18
    else if (title.includes(q)) score += 10

    for (const h of entry.headings) {
      if (h.toLowerCase().includes(q)) {
        score += 6
        if (!snippet) snippet = h
      }
    }

    if (description.includes(q)) {
      score += 5
      if (!snippet) snippet = entry.description ?? ''
    }
    if (section.includes(q)) score += 3

    if (entry.body) {
      const idx = entry.body.indexOf(q)
      if (idx >= 0) {
        // Count occurrences (cheap heuristic).
        let count = 0
        let from = 0
        while (true) {
          const k = entry.body.indexOf(q, from)
          if (k < 0) break
          count++
          from = k + q.length
        }
        score += 2 + Math.min(count, 5)
        if (!snippet) {
          const start = Math.max(0, idx - 40)
          const end = Math.min(entry.body.length, idx + q.length + 80)
          snippet = (start > 0 ? '…' : '') + entry.body.slice(start, end) + (end < entry.body.length ? '…' : '')
        }
      }
    }

    if (score === 0) {
      // Fuzzy subsequence on title only — last resort, low weight.
      let i = 0
      for (const ch of title) {
        if (ch === q[i]) i++
        if (i === q.length) {
          score = 1
          break
        }
      }
    }

    if (score > 0) {
      hits.push({ entry, score, snippet: snippet || entry.description || '' })
    }
  }

  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, limit)
}
