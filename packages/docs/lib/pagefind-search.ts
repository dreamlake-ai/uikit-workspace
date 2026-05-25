import { search as fallbackSearch, searchIndex } from './search-index'
import { pages } from './navigation'

export interface SubResult {
  title: string
  url: string
  excerptHtml: string
}

export interface SearchResult {
  path: string
  title: string
  section: string
  description: string
  snippet: string
  /** Pagefind excerpt with <mark> highlights — empty when using the fallback. */
  excerptHtml: string
  subResults: SubResult[]
  score: number
}

let pagefind: any = null
let initPromise: Promise<any> | null = null

async function getPagefind() {
  if (pagefind) return pagefind
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (import.meta.env.DEV) return null
    try {
      const path = `/${['pagefind', 'pagefind.js'].join('/')}`
      const pf = await import(/* @vite-ignore */ path)
      await pf.options({ excerptLength: 200 })
      pagefind = pf
      return pf
    } catch {
      return null
    }
  })()

  return initPromise
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
  'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
  'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they',
  'this', 'to', 'was', 'will', 'with', 'how', 'what', 'when', 'where',
  'which', 'who', 'do', 'does', 'can', 'could', 'should', 'would',
  'has', 'have', 'had', 'my', 'your', 'its', 'our', 'from', 'about',
])

function extractMarked(html: string): string[] {
  const out: string[] = []
  const re = /<mark>([^<]*)<\/mark>/gi
  let m
  while ((m = re.exec(html)) !== null) out.push(m[1].toLowerCase())
  return out
}

function hasNonStopWordMatch(excerpts: string[]): boolean {
  for (const html of excerpts) {
    for (const term of extractMarked(html)) {
      const words = term.split(/\s+/)
      if (words.some(w => w && !STOP_WORDS.has(w))) return true
    }
  }
  return false
}

function countOccurrences(text: string, phrase: string): number {
  let count = 0
  let from = 0
  while (true) {
    const idx = text.indexOf(phrase, from)
    if (idx < 0) break
    count++
    from = idx + phrase.length
  }
  return count
}

function normalizeUrl(url: string): string {
  return url.replace(/\/index\.html$/, '').replace(/\.html$/, '') || '/'
}

export const defaultResults: SearchResult[] = searchIndex.slice(0, 12).map(entry => ({
  path: entry.path,
  title: entry.title,
  section: entry.section,
  description: entry.description ?? '',
  snippet: entry.description ?? '',
  excerptHtml: '',
  subResults: [],
  score: 0,
}))

const hiddenPaths = new Set(pages.filter(p => p.hidden).map(p => p.path))

export async function searchPages(query: string, limit = 30, showHidden = false): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) return defaultResults

  const pf = await getPagefind()

  if (!pf) {
    return fallbackSearch(q, limit)
      .filter(h => showHidden || !hiddenPaths.has(h.entry.path))
      .map(h => ({
        path: h.entry.path,
        title: h.entry.title,
        section: h.entry.section,
        description: h.entry.description ?? '',
        snippet: h.snippet,
        excerptHtml: '',
        subResults: [],
        score: h.score,
      }))
  }

  const results = await pf.search(q)
  const loaded = await Promise.all(
    results.results.slice(0, limit).map((r: any) => r.data()),
  )

  const ql = q.toLowerCase()
  const queryWords = ql.split(/\s+/).filter(Boolean)
  const hasMultipleWords = queryWords.length > 1
  const hasContentWords = queryWords.some(w => !STOP_WORDS.has(w))

  const mapped = loaded.map((r: any, i: number) => {
    const path = normalizeUrl(r.url)
    const entry = searchIndex.find(e => e.path === path)

    const subResults: SubResult[] = (r.sub_results ?? []).map((sr: any) => ({
      title: sr.title ?? '',
      url: normalizeUrl(sr.url),
      excerptHtml: sr.excerpt ?? '',
    }))

    let score = results.results.length - i

    if (hasContentWords) {
      const allExcerpts = [
        r.excerpt ?? '',
        ...(r.sub_results ?? []).map((sr: any) => sr.excerpt ?? ''),
      ]
      if (!hasNonStopWordMatch(allExcerpts)) {
        score = -1
      }
    }

    const titleLc = (r.meta?.title ?? entry?.title ?? '').toLowerCase()
    if (titleLc === ql) score += 500
    else if (titleLc.startsWith(ql)) score += 300
    else if (titleLc.includes(ql)) score += 200

    const sectionLc = (entry?.section ?? '').toLowerCase()
    if (sectionLc.includes(ql)) score += 50

    if (hasMultipleWords) {
      const allText = [
        r.excerpt ?? '',
        ...(r.sub_results ?? []).map((sr: any) => sr.excerpt ?? ''),
      ].join(' ').replace(/<[^>]+>/g, '').toLowerCase()

      const phraseCount = countOccurrences(allText, ql)
      if (phraseCount > 0) {
        score += 50 + Math.min(phraseCount, 5) * 10
      }
    }

    return {
      path,
      title: r.meta?.title ?? entry?.title ?? '',
      section: entry?.section ?? '',
      description: entry?.description ?? '',
      snippet: r.excerpt?.replace(/<[^>]+>/g, '').trim() ?? '',
      excerptHtml: r.excerpt ?? '',
      subResults,
      score,
    }
  })

  mapped.sort((a, b) => b.score - a.score)
  return mapped.filter(r => r.score >= 0 && (showHidden || !hiddenPaths.has(r.path)))
}
