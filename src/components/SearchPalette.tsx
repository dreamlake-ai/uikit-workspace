import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { navGroups } from '../data/nav'

// ── SearchInput: the topbar search field ──────────────────────────
//
// When the palette is open we createPortal the field to <body> so it
// escapes the topbar's stacking context (which has backdrop-filter +
// position:sticky, both of which create stacking contexts that trap
// the input below the palette backdrop's z-index). The prototype
// achieved the same with imperative DOM reparenting; portal is the
// React-native equivalent.
//
// CSS in page-styles.css then takes over: `body.is-pal-open .doc-search`
// sets position:fixed, top:6px, full content-column width, z-index:71.

const SearchIconCx = 'w-3.5 h-3.5 text-muted shrink-0'
const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={SearchIconCx}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)

// Base position lives in the topbar's grid cell. When palette is open,
// `pal-open:` variants pull the field out: position fixed, top:6px,
// width spans the content text column, z-index above the backdrop.
// The same component is also createPortal'd to <body> when open (so
// it physically escapes the topbar's stacking context — see SearchInput).
const searchCx =
  'col-start-2 row-start-1 self-center justify-self-end mr-[56px] flex items-center gap-2 w-80 max-w-full pl-2.5 pr-1 py-1.5 bg-search rounded-[10px] border border-transparent transition-[border-color,background-color,width,box-shadow] duration-[180ms] focus-within:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] h-7 ' +
  'max-[880px]:w-[200px] max-[880px]:mx-3 ' +
  'pal-open:fixed pal-open:top-1.5 pal-open:left-auto pal-open:m-0 pal-open:max-w-none pal-open:z-[71] pal-open:bg-bg pal-open:border-faint pal-open:shadow-[0_4px_14px_var(--shadow-tint-2)] ' +
  'pal-open:right-[calc(max(240px,calc((100vw-1320px)/2+240px))+56px)] ' +
  'pal-open:w-[calc(100vw-2*(max(240px,calc((100vw-1320px)/2+240px))+56px))]'

const searchInputCx =
  'flex-1 appearance-none border-0 outline-0 bg-transparent font-ui text-[13px] text-ink tracking-[-0.005em] placeholder:text-muted placeholder:opacity-70'

const kbdCx =
  'font-mono text-[10px] font-medium text-muted opacity-80 px-[5px] py-px rounded-[4px] border border-faint bg-bg'

export function SearchInput() {
  const { inputRef, query, setQuery, isOpen, open } = useSearch()
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // After the portal swap (which remounts the DOM <input>), restore
  // focus so the user can keep typing without re-clicking.
  useEffect(() => {
    if (isOpen && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const onFocus = () => {
    if (focusTimer.current) clearTimeout(focusTimer.current)
    focusTimer.current = setTimeout(() => {
      if (document.activeElement === inputRef.current) open()
    }, 1000)
  }
  const onBlur = () => {
    if (focusTimer.current) {
      clearTimeout(focusTimer.current)
      focusTimer.current = null
    }
  }
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (!isOpen) open()
  }

  const content = (
    <label className={searchCx} htmlFor="doc-search-input">
      <SearchIcon />
      <input
        ref={inputRef}
        id="doc-search-input"
        type="text"
        placeholder="Search docs…"
        autoComplete="off"
        value={query}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className={searchInputCx}
      />
      <span className={kbdCx}>⌘K</span>
    </label>
  )

  if (mounted && isOpen) {
    return createPortal(content, document.body)
  }
  return content
}

type IndexItem = {
  kind: 'page' | 'heading'
  level?: 'h1' | 'h2' | 'h3'
  title: string
  href: string
  section: string
  body: string
}

type SearchCtxValue = {
  inputRef: RefObject<HTMLInputElement | null>
  query: string
  setQuery: (q: string) => void
  isOpen: boolean
  open: () => void
  close: () => void
}

const SearchCtx = createContext<SearchCtxValue | null>(null)

export function useSearch() {
  const v = useContext(SearchCtx)
  if (!v) throw new Error('useSearch must be used within SearchProvider')
  return v
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // ⌘K opens the palette and focuses the topbar input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Esc closes — captured so the browser's native "clear input" can't
  // swallow the first press.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [isOpen])

  // Body class drives the chrome fade-out (topbar brand/nav opacity → 0).
  useEffect(() => {
    document.body.classList.toggle('is-pal-open', isOpen)
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.classList.remove('is-pal-open')
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const value = useMemo<SearchCtxValue>(
    () => ({
      inputRef,
      query,
      setQuery,
      isOpen,
      open: () => setIsOpen(true),
      close: () => {
        setIsOpen(false)
        setQuery('')
      },
    }),
    [query, isOpen],
  )

  return <SearchCtx.Provider value={value}>{children}</SearchCtx.Provider>
}

function buildIndex(): IndexItem[] {
  const idx: IndexItem[] = []
  for (const g of navGroups) {
    for (const it of g.items) {
      idx.push({
        kind: 'page',
        title: it.label,
        href: it.href,
        section: 'Navigation',
        body: '',
      })
    }
  }
  document
    .querySelectorAll<HTMLHeadingElement>(
      '.doc-content h1[id], .doc-content h2[id], .doc-content h3[id]',
    )
    .forEach((h) => {
      const label = (h.firstChild?.textContent || h.textContent || '').trim()
      const lvl = h.tagName.toLowerCase() as 'h1' | 'h2' | 'h3'
      let snippet = ''
      let sib = h.nextElementSibling
      while (sib && !/^H[1-3]$/.test(sib.tagName) && snippet.length < 220) {
        if (sib.matches?.('p, ul, ol')) snippet += ' ' + (sib.textContent || '').trim()
        sib = sib.nextElementSibling
      }
      idx.push({
        kind: 'heading',
        level: lvl,
        title: label,
        href: '#' + h.id,
        section: 'Quickstart',
        body: snippet.replace(/\s+/g, ' ').trim().slice(0, 240),
      })
    })
  const seen = new Set<string>()
  return idx.filter((it) => {
    const k = it.title + '|' + it.href
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function score(item: IndexItem, q: string): number {
  if (!q) return 1
  const lq = q.toLowerCase()
  const t = item.title.toLowerCase()
  const b = (item.body || '').toLowerCase()
  if (t === lq) return 10
  if (t.startsWith(lq)) return 8
  if (t.indexOf(lq) !== -1) return 5
  if (b.indexOf(lq) !== -1) return 2
  // fuzzy: every char of q must appear in t in order
  let ti = 0
  for (let qi = 0; qi < lq.length; qi++) {
    ti = t.indexOf(lq[qi], ti)
    if (ti < 0) return 0
    ti++
  }
  return 1
}

function highlight(text: string, q: string) {
  if (!q) return text
  const lc = text.toLowerCase()
  const qi = lc.indexOf(q.toLowerCase())
  if (qi < 0) return text
  return (
    <>
      {text.slice(0, qi)}
      <mark>{text.slice(qi, qi + q.length)}</mark>
      {text.slice(qi + q.length)}
    </>
  )
}

const HeadingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
const PageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

function iconFor(item: IndexItem) {
  if (item.kind === 'heading' && item.level === 'h1') return <FileIcon />
  if (item.kind === 'heading') return <HeadingIcon />
  return <PageIcon />
}

export function SearchPalette() {
  const { isOpen, query, close } = useSearch()
  const [mounted, setMounted] = useState(false)
  const [index, setIndex] = useState<IndexItem[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setIndex(buildIndex())
  }, [])

  useEffect(() => {
    setActiveIdx(0)
  }, [query, isOpen])

  const matches = useMemo(() => {
    return index
      .map((it) => ({ item: it, s: score(it, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map((r) => r.item)
  }, [index, query])

  // Keyboard nav for arrows + enter — palette-scoped.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, matches.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        go(matches[activeIdx])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, matches, activeIdx])

  // Keep the active row in view.
  useEffect(() => {
    const list = listRef.current
    const el = list?.children[activeIdx] as HTMLElement | undefined
    if (!el || !list) return
    const top = el.offsetTop
    const h = el.offsetHeight
    const st = list.scrollTop
    const vh = list.clientHeight
    if (top < st) list.scrollTop = top
    else if (top + h > st + vh) list.scrollTop = top + h - vh
  }, [activeIdx])

  // List/preview resizer with localStorage-persisted width.
  useEffect(() => {
    if (!mounted) return
    const rez = resizerRef.current
    const body = bodyRef.current
    if (!rez || !body) return
    const STORE_KEY = 'docPalListW'
    const MIN_PX = 200
    const MIN_PREV_PX = 240
    try {
      const saved = localStorage.getItem(STORE_KEY)
      if (saved) body.style.setProperty('--pal-list-w', saved)
    } catch {}
    let dragging = false
    const onDown = (e: MouseEvent) => {
      dragging = true
      rez.classList.add('is-dragging')
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      e.preventDefault()
    }
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      const rect = body.getBoundingClientRect()
      let x = e.clientX - rect.left
      const max = rect.width - MIN_PREV_PX
      if (x < MIN_PX) x = MIN_PX
      if (x > max) x = max
      const val = x + 'px'
      body.style.setProperty('--pal-list-w', val)
      try {
        localStorage.setItem(STORE_KEY, val)
      } catch {}
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      rez.classList.remove('is-dragging')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    const onDbl = () => {
      body.style.removeProperty('--pal-list-w')
      try {
        localStorage.removeItem(STORE_KEY)
      } catch {}
    }
    rez.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    rez.addEventListener('dblclick', onDbl)
    return () => {
      rez.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      rez.removeEventListener('dblclick', onDbl)
    }
  }, [mounted])

  function go(it: IndexItem | undefined) {
    if (!it) return
    close()
    if (it.href.startsWith('#')) {
      const target = document.getElementById(it.href.slice(1))
      if (target) {
        history.replaceState(null, '', it.href)
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      location.href = it.href
    }
  }

  if (!mounted) return null

  // ── Class strings for the dialog tree ──────────────────────────
  const backdropCx =
    'fixed inset-0 z-40 [backdrop-filter:blur(6px)_saturate(105%)] [-webkit-backdrop-filter:blur(6px)_saturate(105%)] bg-[color-mix(in_srgb,#000_28%,transparent)] pointer-events-none opacity-0 transition-opacity duration-[220ms] ' +
    (isOpen ? 'opacity-100 pointer-events-auto' : '')
  const dialogCx =
    'fixed top-[41px] z-[49] m-0 w-auto bg-bg border border-faint rounded-[14px] flex flex-col overflow-hidden ' +
    'left-[calc(max(240px,calc((100vw-1320px)/2+240px))+56px)] right-[calc(max(240px,calc((100vw-1320px)/2+240px))+56px)] ' +
    'shadow-[0_24px_60px_var(--shadow-tint-3),0_6px_18px_var(--shadow-tint-2)] ' +
    'opacity-0 pointer-events-none -translate-y-1.5 max-h-0 transition-[opacity,max-height,transform] duration-[250ms] ' +
    (isOpen
      ? 'opacity-100! pointer-events-auto! translate-y-0! max-h-[min(70vh,540px)]!'
      : '') +
    ' max-[640px]:top-[8vh]'
  const palBodyCx =
    'grid grid-cols-[var(--pal-list-w,50%)_minmax(0,1fr)] flex-1 min-h-0 relative max-[640px]:grid-cols-[1fr]'
  const palListCx =
    'doc-pal-list overflow-y-auto p-1.5 border-r border-faint rounded-tr-xl rounded-br-xl bg-[color-mix(in_srgb,var(--color-panel)_35%,var(--color-bg))] min-h-[280px] max-h-[50vh] transition-[border-right-color] duration-150 ' +
    // When the resizer or its hover-state sibling is active, deepen the
    // list's right border so the user knows what they're grabbing.
    'has-[+_.doc-pal-resizer:hover]:border-r-muted has-[+_.doc-pal-resizer.is-dragging]:border-r-muted'
  const rowBaseCx =
    'flex items-center gap-2.5 w-full py-2 px-2.5 bg-transparent border-0 rounded-[10px] cursor-pointer text-left text-ink font-ui text-[13px] transition-[background-color] duration-100'
  const rowActiveCx = `${rowBaseCx} bg-selected`
  const palIconBaseCx =
    'inline-flex items-center justify-center w-6 h-6 rounded-[5px] bg-chip text-muted shrink-0 [&>svg]:w-[13px] [&>svg]:h-[13px]'
  const palIconActiveCx = 'inline-flex items-center justify-center w-6 h-6 rounded-[5px] bg-accent-soft text-accent shrink-0 [&>svg]:w-[13px] [&>svg]:h-[13px]'
  const palMetaCx = 'flex flex-col gap-0.5 min-w-0 flex-1'
  const palTitleCx =
    'font-medium text-ink whitespace-nowrap overflow-hidden text-ellipsis [&>mark]:bg-accent/[0.28] [&>mark]:text-inherit [&>mark]:rounded-[2px] [&>mark]:px-px'
  const palSectionCx =
    'font-mono text-[9.5px] font-medium text-muted uppercase tracking-[0.04em] whitespace-nowrap overflow-hidden text-ellipsis'
  const palArrowBaseCx = 'text-muted opacity-0 ml-auto transition-[opacity,transform] duration-150 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:block'
  const palArrowActiveCx = 'text-muted ml-auto transition-[opacity,transform] duration-150 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:block opacity-85 translate-x-0.5'
  const resizerCx =
    'doc-pal-resizer absolute top-0 bottom-0 w-1.5 cursor-col-resize z-[2] bg-transparent left-[calc(var(--pal-list-w,50%)-3px)]'
  const previewCx =
    'p-[18px] pt-[18px] pb-3.5 overflow-y-auto bg-[color-mix(in_srgb,var(--color-panel)_60%,transparent)] min-h-[280px] max-h-[50vh]'
  const prevCrumbCx =
    'font-mono text-[9.5px] font-medium text-muted uppercase tracking-[0.05em] mb-2.5'
  const prevTitleCx =
    'font-ui text-base font-semibold tracking-[-0.012em] text-ink m-0 mb-2 leading-[1.25]'
  const prevBodyCx =
    'block font-ui text-[12.5px] leading-[1.55] text-muted m-0 mb-3.5'
  const prevBodyEmptyCx = `${prevBodyCx} italic opacity-70`
  const prevFootCx =
    'flex items-center justify-between font-mono text-[10px] font-medium text-muted border-t border-dashed border-faint-dashed pt-2.5 mt-auto'
  const prevHrefCx = 'overflow-hidden text-ellipsis whitespace-nowrap max-w-[60%] text-muted opacity-80'
  const prevCtaKbdCx =
    '[&_kbd]:font-mono [&_kbd]:text-[9.5px] [&_kbd]:bg-bg [&_kbd]:border [&_kbd]:border-faint [&_kbd]:rounded-[3px] [&_kbd]:py-px [&_kbd]:px-1 [&_kbd]:mx-0.5 [&_kbd]:text-ink'
  const emptyCx =
    'absolute inset-0 flex-col items-center justify-center gap-1.5 text-muted bg-bg'
  const emptyGlyphCx = 'font-mono text-[28px] text-muted opacity-50'
  const emptyTitleCx = 'font-ui text-sm font-semibold text-ink'
  const emptySubCx = 'font-ui text-xs text-muted'
  const footCx =
    'flex items-center gap-3.5 py-[9px] px-3.5 border-t border-faint font-mono text-[10px] font-medium text-muted bg-[color-mix(in_srgb,var(--color-panel)_50%,transparent)]'
  const footKeyCx =
    'inline-flex items-center gap-[5px] [&_kbd]:font-mono [&_kbd]:text-[9.5px] [&_kbd]:bg-bg [&_kbd]:border [&_kbd]:border-faint [&_kbd]:rounded-[3px] [&_kbd]:py-px [&_kbd]:px-1 [&_kbd]:text-ink [&_kbd]:min-w-[14px] [&_kbd]:text-center'

  const active = matches[activeIdx]
  const dialog = (
    <>
      <div className={backdropCx} onClick={close} aria-hidden="true" />
      <div className={dialogCx} role="dialog" aria-modal="true" aria-label="Search">
        <div className={palBodyCx} ref={bodyRef}>
          <div className={palListCx} ref={listRef} role="listbox">
            {matches.map((it, i) => {
              const isAct = i === activeIdx
              return (
                <button
                  key={it.href + '|' + it.title}
                  type="button"
                  role="option"
                  className={isAct ? rowActiveCx : rowBaseCx}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => go(it)}
                >
                  <span className={isAct ? palIconActiveCx : palIconBaseCx}>{iconFor(it)}</span>
                  <span className={palMetaCx}>
                    <span className={palTitleCx}>{highlight(it.title, query)}</span>
                    <span className={palSectionCx}>
                      {it.section}
                      {it.kind === 'heading' && it.level ? ` · ${it.level.toUpperCase()}` : ''}
                    </span>
                  </span>
                  <span className={isAct ? palArrowActiveCx : palArrowBaseCx}>
                    <ArrowIcon />
                  </span>
                </button>
              )
            })}
          </div>
          <div
            className={resizerCx}
            ref={resizerRef}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize list"
          />
          <aside className={`${previewCx} max-[640px]:hidden`}>
            {active ? (
              <>
                <div className={prevCrumbCx}>
                  {active.section}
                  {active.kind === 'heading' && active.level ? ` / ${active.level.toUpperCase()}` : ''}
                </div>
                <h3 className={prevTitleCx}>{active.title}</h3>
                {active.body ? (
                  <p className={prevBodyCx}>
                    {active.body}
                    {active.body.length >= 230 ? '…' : ''}
                  </p>
                ) : (
                  <p className={prevBodyEmptyCx}>Open to read this section.</p>
                )}
                <div className={prevFootCx}>
                  <span className={prevHrefCx}>{active.href}</span>
                  <span className={prevCtaKbdCx}>
                    Press <kbd>↵</kbd> to open
                  </span>
                </div>
              </>
            ) : null}
          </aside>
          {!matches.length && (
            <div className={`${emptyCx} flex`}>
              <div className={emptyGlyphCx}>⌕</div>
              <div className={emptyTitleCx}>No matches</div>
              <div className={emptySubCx}>Try a different phrase or partial word.</div>
            </div>
          )}
        </div>
        <div className={footCx}>
          <span className={footKeyCx}>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span className={footKeyCx}>
            <kbd>↵</kbd> open
          </span>
          <span className={footKeyCx}>
            <kbd>esc</kbd> close
          </span>
          <span className="flex-1" />
          <span className="opacity-80">Search · DreamLake docs</span>
        </div>
      </div>
    </>
  )

  return createPortal(dialog, document.body)
}
