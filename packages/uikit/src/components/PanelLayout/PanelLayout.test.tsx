// @vitest-environment jsdom
import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { PanelLayout, type PanelLayoutHandle } from './PanelLayout'
import { panelLeaf, panelSplit, type LeafNode, type PanelNode } from './panel-tree'

// ─────────────────────────────────────────────────────────────────────────────
// The tree mutators are unit-tested without a renderer in panel-tree.test.ts.
// What THIS file covers is the wiring the component adds on top: that each
// policy prop actually reaches the pure function it parameterizes, that the
// imperative handle drives the same tree the render sees, and that controlled
// mode really hands control over. A seam that is plumbed but never connected
// type-checks perfectly and fails silently — these are the tests that catch it.
// ─────────────────────────────────────────────────────────────────────────────

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  // jsdom has no `elementFromPoint` (it has no layout to hit-test against), and
  // the drag's drop targeting calls it on every pointermove. Stub it so a drag
  // can be exercised at all; with no target the surrogate simply follows the
  // cursor, which is exactly the "over empty space" case.
  document.elementFromPoint = () => null
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function render(ui: React.ReactNode) {
  act(() => root.render(ui))
}

const leafIds = () =>
  [...container.querySelectorAll('[data-leaf-id]')].map((el) => el.getAttribute('data-leaf-id'))
const sizesOf = (n: PanelNode) => (n.kind === 'split' ? n.sizes : null)

/** A two-panel row: a `chat` leaf and an auxiliary one, 50/50. */
function twoPane() {
  return panelSplit('row', [
    panelLeaf({ view: 'chat', title: 'Chat' }),
    panelLeaf({ view: 'files', title: 'Files' }),
  ])
}

it('renders one element per leaf, tagged with data-leaf-id', () => {
  render(<PanelLayout initial={twoPane} />)
  expect(leafIds()).toHaveLength(2)
})

it('renderBody and renderHeader receive the leaf and render into the panel', () => {
  render(
    <PanelLayout
      initial={twoPane}
      renderBody={(l) => <div data-testid={`body-${l.view}`}>{l.view}</div>}
      renderHeader={(l) => <span data-testid={`head-${l.view}`}>{l.title}</span>}
    />
  )
  expect(container.querySelector('[data-testid="body-chat"]')).toBeTruthy()
  expect(container.querySelector('[data-testid="body-files"]')).toBeTruthy()
  expect(container.querySelector('[data-testid="head-files"]')?.textContent).toBe('Files')
})

// ── the seam most likely to be plumbed-but-not-connected ────────────────────

it('primaryView reaches applyClose: the named view absorbs the freed slot', () => {
  const ref = createRef<PanelLayoutHandle>()
  const tree = panelSplit(
    'row',
    [panelLeaf({ view: 'chat' }), panelLeaf({ view: 'files' }), panelLeaf({ view: 'diff' })],
    [50, 25, 25]
  )
  render(<PanelLayout ref={ref} initial={() => tree} primaryView="chat" />)
  const diffId = (tree as Extract<PanelNode, { kind: 'split' }>).children[2].id
  act(() => ref.current!.closeLeaf(diffId))
  // chat takes the whole freed 25 → [75, 25]; files is untouched.
  expect(sizesOf(ref.current!.getRoot())).toStrictEqual([75, 25])
})

it('WITHOUT primaryView the same close renormalizes proportionally', () => {
  const ref = createRef<PanelLayoutHandle>()
  const tree = panelSplit(
    'row',
    [panelLeaf({ view: 'chat' }), panelLeaf({ view: 'files' }), panelLeaf({ view: 'diff' })],
    [50, 25, 25]
  )
  render(<PanelLayout ref={ref} initial={() => tree} />)
  const diffId = (tree as Extract<PanelNode, { kind: 'split' }>).children[2].id
  act(() => ref.current!.closeLeaf(diffId))
  expect(sizesOf(ref.current!.getRoot())).toStrictEqual([(50 / 75) * 100, (25 / 75) * 100])
})

it('closing the header button routes through the same path as closeLeaf', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={twoPane} primaryView="chat" />)
  const btn = container.querySelectorAll<HTMLButtonElement>('button[aria-label="Close panel"]')[1]
  act(() => btn.click())
  // The split collapsed to the surviving chat leaf.
  expect(ref.current!.getRoot().kind).toBe('leaf')
  expect(leafIds()).toHaveLength(1)
})

// ── closable ─────────────────────────────────────────────────────────────────

it('closable withholds the close button from the panel it refuses, and only that one', () => {
  const tree = twoPane() as Extract<PanelNode, { kind: 'split' }>
  const [chat, files] = tree.children
  render(<PanelLayout initial={() => tree} closable={(l) => l.view !== 'chat'} />)

  const buttons = [
    ...container.querySelectorAll<HTMLButtonElement>('button[aria-label="Close panel"]'),
  ]
  expect(buttons).toHaveLength(1)
  // And it is the auxiliary panel's, not the subject's.
  expect(buttons[0].closest('[data-leaf-id]')?.getAttribute('data-leaf-id')).toBe(files.id)
  expect(leafIds()).toStrictEqual([chat.id, files.id])
})

it('closable refuses the close itself, not just the button — Delete never touches one', () => {
  const pinned = panelLeaf({ view: 'chat', title: 'Chat' })
  const spare = panelLeaf({ view: 'files', title: 'Files' })
  const ref = createRef<PanelLayoutHandle>()
  const tree: PanelNode = { kind: 'group', id: 'g', children: [pinned, spare], activeId: pinned.id }
  render(<PanelLayout ref={ref} initial={() => tree} closable={(l) => l.view !== 'chat'} />)

  const tabs = () => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  expect(tabs()).toHaveLength(2)
  // The refused tab carries no × either.
  expect(container.querySelectorAll('[aria-label="Close Chat"]')).toHaveLength(0)
  expect(container.querySelectorAll('[aria-label="Close Files"]')).toHaveLength(1)

  act(() => {
    tabs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
  })
  expect(tabs(), 'Delete on a panel that may not close does nothing').toHaveLength(2)

  act(() => {
    tabs()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
  })
  expect(tabs(), 'Delete on one that may still closes it').toHaveLength(0)
  expect(ref.current!.getRoot().kind, 'a group of one is just its child').toBe('leaf')
})

it('the handle can still close a panel the user may not — the host owns that call', () => {
  const ref = createRef<PanelLayoutHandle>()
  const tree = twoPane()
  render(<PanelLayout ref={ref} initial={() => tree} closable={() => false} />)
  expect(container.querySelectorAll('button[aria-label="Close panel"]')).toHaveLength(0)

  act(() => ref.current!.closeLeaf(leafIds()[1]!))
  expect(leafIds(), 'closeLeaf is deliberately ungated').toHaveLength(1)
})

// ── class seams ──────────────────────────────────────────────────────────────

it('leafClassName overrides the default opaque fill (tailwind-merge resolves it)', () => {
  render(
    <PanelLayout
      initial={twoPane}
      renderBody={(l) => <div>{l.view}</div>}
      leafClassName={(l) => (l.view === 'chat' ? 'bg-transparent' : undefined)}
    />
  )
  const [chat, files] = [...container.querySelectorAll('[data-leaf-id]')] as HTMLElement[]
  expect(chat.className).toContain('bg-transparent')
  expect(chat.className).not.toContain('bg-uikit-bg')
  expect(files.className).toContain('bg-uikit-bg')
})

it('headerContentClassName REPLACES the default overflow policy', () => {
  render(
    <PanelLayout
      initial={twoPane}
      renderHeader={(l) => <span>{l.view}</span>}
      headerContentClassName={(l) => (l.view === 'files' ? 'overflow-y-visible' : undefined)}
    />
  )
  const wrappers = [...container.querySelectorAll('header > div')] as HTMLElement[]
  expect(wrappers[0].className).toContain('overflow-hidden')
  expect(wrappers[1].className).toContain('overflow-y-visible')
  expect(wrappers[1].className).not.toContain('overflow-hidden')
})

it('contentColumnHeaderClass applies only to a custom header with a contentMax', () => {
  const tree = panelSplit('row', [
    panelLeaf({ view: 'chat', contentMax: 760 }),
    panelLeaf({ view: 'files' }), // custom header, but no contentMax
  ])
  render(
    <PanelLayout
      initial={() => tree}
      renderHeader={(l) => <span>{l.view}</span>}
      contentColumnHeaderClass="on-column"
    />
  )
  const headers = [...container.querySelectorAll('header')] as HTMLElement[]
  expect(headers[0].className).toContain('on-column')
  expect(headers[0].className).not.toContain('pl-[12px]')
  expect(headers[1].className).toContain('pl-[12px]')
})

it('a leaf with contentMax publishes --content-max alongside the box vars', () => {
  render(<PanelLayout initial={() => panelLeaf({ view: 'chat', contentMax: 760 })} />)
  const el = container.querySelector('[data-leaf-id]') as HTMLElement
  expect(el.style.getPropertyValue('--content-max')).toBe('760px')
  expect(el.style.getPropertyValue('--panel-x')).toContain('--panel-area-x')
})

it('rootBox replaces the default panel-area variable names', () => {
  render(
    <PanelLayout
      initial={() => panelLeaf({ view: 'chat' })}
      rootBox={{ x: 'var(--my-x)', w: 'var(--my-w)' }}
    />
  )
  const el = container.querySelector('[data-leaf-id]') as HTMLElement
  expect(el.style.getPropertyValue('--panel-w')).toContain('--my-w')
})

// ── imperative handle ────────────────────────────────────────────────────────

it('splitWith seeds a new panel and survives a zero-width target (no NaN sizes)', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={() => panelLeaf({ view: 'chat' })} />)
  const target = ref.current!.getRoot().id
  // jsdom reports every rect as 0×0 — exactly the un-laid-out case that used to
  // divide by zero and poison every size in the split with NaN.
  act(() => ref.current!.splitWith(target, 'row', 'files', 'Files'))
  const r = ref.current!.getRoot()
  const first = (r.kind === 'split' ? r.children[0] : r) as LeafNode
  expect(r.kind).toBe('split')
  expect(sizesOf(r)!.every(Number.isFinite), 'sizes must stay finite').toBe(true)
  expect(first.view).toBe('chat')
  expect(leafIds()).toHaveLength(2)
})

it('replaceRoot migrates a legacy tree and reseeds the counters', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={() => panelLeaf({ view: 'chat' })} />)
  // A legacy leaf: no instanceId, high id — what an old persisted blob carries.
  const legacy = { kind: 'leaf', id: 'n-900', n: 90, view: 'files' } as unknown as PanelNode
  act(() => ref.current!.replaceRoot(legacy))
  const r = ref.current!.getRoot() as LeafNode
  expect(r.instanceId, 'instanceId backfilled on the way in').toBe('n-900')
  // Counters were lifted past the restored tree, so a fresh split cannot collide.
  act(() => ref.current!.splitWith('n-900', 'row', 'diff'))
  const after = ref.current!.getRoot()
  const minted = (after.kind === 'split' ? after.children[1] : after) as LeafNode
  expect(Number(/(\d+)$/.exec(minted.id)![1])).toBeGreaterThan(900)
})

it('closing the last panel leaves a fresh blank one rather than nothing', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={() => panelLeaf({ view: 'chat' })} />)
  const only = ref.current!.getRoot().id
  act(() => ref.current!.closeLeaf(only))
  expect(ref.current!.getRoot().kind).toBe('leaf')
  expect(leafIds()).toHaveLength(1)
})

it('inspect() reports one entry per leaf with its view and title', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={twoPane} />)
  const info = ref.current!.inspect()
  expect(info.map((i) => i.view)).toStrictEqual(['chat', 'files'])
  expect(info[1].title).toBe('Files')
})

// ── controlled mode ──────────────────────────────────────────────────────────

it('controlled: the layout renders the prop and does NOT mutate itself', () => {
  const ref = createRef<PanelLayoutHandle>()
  const tree = twoPane()
  const seen: PanelNode[] = []
  render(<PanelLayout ref={ref} root={tree} onChange={(r) => seen.push(r)} />)
  const filesId = (tree as Extract<PanelNode, { kind: 'split' }>).children[1].id
  act(() => ref.current!.closeLeaf(filesId))
  // The host was told, but since it did not apply the change, the render is unchanged.
  expect(seen).toHaveLength(1)
  expect(seen[0].kind).toBe('leaf')
  expect(leafIds(), 'still two panels — the host owns the tree').toHaveLength(2)
})

it('uncontrolled: the same close DOES update the render', () => {
  const ref = createRef<PanelLayoutHandle>()
  const tree = twoPane()
  render(<PanelLayout ref={ref} initial={() => tree} />)
  const filesId = (tree as Extract<PanelNode, { kind: 'split' }>).children[1].id
  act(() => ref.current!.closeLeaf(filesId))
  expect(leafIds()).toHaveLength(1)
})

// ── keyboard ─────────────────────────────────────────────────────────────────

function pressSplit(shift = false) {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'd', metaKey: true, shiftKey: shift, bubbles: true })
    )
  })
}

it('⌘D splits the focused panel horizontally, ⌘⇧D vertically', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={() => panelLeaf({ view: 'chat' })} />)
  pressSplit()
  const r1 = ref.current!.getRoot()
  expect(r1.kind === 'split' && r1.dir).toBe('row')
  pressSplit(true)
  const r2 = ref.current!.getRoot()
  // The new panel took focus, so the vertical split lands on it (nested).
  expect(leafIds()).toHaveLength(3)
  expect(r2.kind).toBe('split')
})

it('splitShortcut={false} removes the binding', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(
    <PanelLayout ref={ref} initial={() => panelLeaf({ view: 'chat' })} splitShortcut={false} />
  )
  pressSplit()
  expect(ref.current!.getRoot().kind).toBe('leaf')
})

it('the shortcut ignores keystrokes typed into an input', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={() => panelLeaf({ view: 'chat' })} />)
  const input = document.createElement('input')
  document.body.append(input)
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }))
  })
  expect(ref.current!.getRoot().kind, 'typing "⌘D" in a field must not split').toBe('leaf')
  input.remove()
})

// ── toolbar ──────────────────────────────────────────────────────────────────

it('the toolbar is off by default and opt-in via showToolbar/toolbar', () => {
  render(<PanelLayout initial={twoPane} />)
  expect(container.textContent).not.toContain('Panels')

  render(<PanelLayout initial={twoPane} showToolbar />)
  expect(container.textContent).toContain('Panels')

  render(<PanelLayout initial={twoPane} toolbar={<span>Custom bar</span>} />)
  expect(container.textContent).toContain('Custom bar')
  expect(container.textContent).not.toContain('Panels')
})

it('Reset rebuilds the initial tree AND announces it through onChange', () => {
  const ref = createRef<PanelLayoutHandle>()
  const seen: PanelNode[] = []
  render(<PanelLayout ref={ref} initial={twoPane} showToolbar onChange={(r) => seen.push(r)} />)
  const filesId = (ref.current!.getRoot() as Extract<PanelNode, { kind: 'split' }>).children[1].id
  act(() => ref.current!.closeLeaf(filesId))
  expect(leafIds()).toHaveLength(1)

  const reset = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Reset')!
  act(() => reset.click())
  expect(leafIds(), 'the initial two-pane tree is back').toHaveLength(2)
  expect(seen.at(-1)!.kind, 'a reset is a tree change the host must hear about').toBe('split')
})

// ── tab groups ───────────────────────────────────────────────────────────────

it('a group renders a tab bar and mounts only the active leaf', () => {
  const a = panelLeaf({ view: 'editor', title: 'A' }) as LeafNode
  const b = panelLeaf({ view: 'editor', title: 'B' }) as LeafNode
  const tree: PanelNode = { kind: 'group', id: 'g', children: [a, b], activeId: b.id }
  render(<PanelLayout initial={() => tree} />)
  expect(container.querySelectorAll('[role="tab"]')).toHaveLength(2)
  expect(leafIds(), 'only the active tab is mounted').toStrictEqual([b.id])
})

it('clicking a tab activates it', () => {
  const a = panelLeaf({ view: 'editor', title: 'A' }) as LeafNode
  const b = panelLeaf({ view: 'editor', title: 'B' }) as LeafNode
  const ref = createRef<PanelLayoutHandle>()
  const tree: PanelNode = { kind: 'group', id: 'g', children: [a, b], activeId: b.id }
  render(<PanelLayout ref={ref} initial={() => tree} />)
  const tabA = container.querySelector(`[data-tab-id="${a.id}"]`) as HTMLElement
  act(() => tabA.click())
  const r = ref.current!.getRoot()
  expect(r.kind === 'group' && r.activeId).toBe(a.id)
  expect(leafIds()).toStrictEqual([a.id])
})

// ── multiple layouts on one page ─────────────────────────────────────────────

it('two layouts on a page do not see each other through the DOM', () => {
  const a = createRef<PanelLayoutHandle>()
  const b = createRef<PanelLayoutHandle>()
  render(
    <>
      <PanelLayout ref={a} initial={() => panelLeaf({ view: 'a-only' })} />
      <PanelLayout ref={b} initial={twoPane} />
    </>
  )
  // `data-leaf-id` is unique per tree, not per document, and every DOM lookup is
  // scoped to the layout's own root — so neither instance can measure, inspect,
  // or dock into the other's panels.
  expect(a.current!.inspect().map((i) => i.view)).toStrictEqual(['a-only'])
  expect(b.current!.inspect().map((i) => i.view)).toStrictEqual(['chat', 'files'])
  expect(container.querySelectorAll('[data-leaf-id]')).toHaveLength(3)
})

it('a grouped panel does not repeat its title and close button under the tab', () => {
  const a = panelLeaf({ view: 'editor', title: 'A' })
  const b = panelLeaf({ view: 'editor', title: 'B' })
  const tree: PanelNode = { kind: 'group', id: 'g', children: [a, b], activeId: a.id }

  // Default header: the tab already carries title + close + drag, so the leaf
  // header underneath is pure duplication and is suppressed.
  render(<PanelLayout initial={() => tree} />)
  expect(container.querySelectorAll('header')).toHaveLength(0)
  expect(container.querySelectorAll('button[aria-label="Close panel"]')).toHaveLength(0)
  expect(
    container.querySelectorAll('[role="button"][aria-label^="Close "]'),
    'the tab still closes it'
  ).toHaveLength(2)

  // A CUSTOM header carries controls the tab cannot, so it still renders.
  render(<PanelLayout initial={() => tree} renderHeader={() => <span>controls</span>} />)
  expect(container.querySelectorAll('header')).toHaveLength(1)
  expect(container.textContent).toContain('controls')
})

it('closing an id that is not in the tree announces nothing', () => {
  const ref = createRef<PanelLayoutHandle>()
  const seen: PanelNode[] = []
  render(<PanelLayout ref={ref} initial={twoPane} onChange={(r) => seen.push(r)} />)
  act(() => ref.current!.closeLeaf('no-such-leaf'))
  expect(seen, 'a host persisting onChange must not rewrite an unchanged tree').toHaveLength(0)
  expect(leafIds()).toHaveLength(2)
})

// ── regressions ──────────────────────────────────────────────────────────────

it('a TAB can be dragged out of its group (the tab bar is not inside the leaf)', () => {
  const a = panelLeaf({ view: 'editor', title: 'A' })
  const b = panelLeaf({ view: 'editor', title: 'B' })
  const tree: PanelNode = { kind: 'group', id: 'g', children: [a, b], activeId: a.id }
  render(<PanelLayout initial={() => tree} />)

  // The tab bar is a SIBLING above the panel, so a `closest('[data-leaf-id]')`
  // from a tab finds nothing — which used to abort the drag before it started.
  const tab = container.querySelector(`[data-tab-id="${b.id}"]`) as HTMLElement
  expect(tab.closest('[data-leaf-id]'), 'a tab really is outside every leaf').toBeNull()
  expect(
    container.querySelector(`[data-leaf-id="${b.id}"]`),
    'and an inactive tab has no leaf element to measure'
  ).toBeNull()

  act(() => {
    tab.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 })
    )
  })
  expect(document.body.style.cursor, 'not a drag yet — the pointer has not moved').toBe('')

  act(() => {
    window.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 40, clientY: 5 })
    )
  })
  expect(document.body.style.cursor, 'past the threshold, the drag is live').toBe('grabbing')
  expect(container.textContent, 'the floating surrogate shows the dragged tab').toContain('B')
  act(() => {
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  })
  expect(document.body.style.cursor).not.toBe('grabbing')
})

it('a plain tab CLICK switches tabs without ever starting a drag', () => {
  // A tab is both a click target and a drag handle. Without a movement
  // threshold, every tab switch flashed the floating surrogate and pinned the
  // cursor to `grabbing` for as long as the button was held.
  const a = panelLeaf({ view: 'editor', title: 'Alpha' })
  const b = panelLeaf({ view: 'editor', title: 'Beta' })
  const ref = createRef<PanelLayoutHandle>()
  const tree: PanelNode = { kind: 'group', id: 'g', children: [a, b], activeId: a.id }
  render(<PanelLayout ref={ref} initial={() => tree} />)

  const tab = container.querySelector(`[data-tab-id="${b.id}"]`) as HTMLElement
  act(() => {
    tab.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 10, clientY: 10 })
    )
    // A hand is never perfectly still — a pixel of jitter is still a click.
    window.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 11, clientY: 10 })
    )
  })
  expect(document.body.style.cursor, 'jitter under the threshold is not a drag').toBe('')
  expect(container.querySelector('div.fixed'), 'no surrogate flashed').toBeNull()

  act(() => {
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    tab.click()
  })
  const r = ref.current!.getRoot()
  expect(r.kind === 'group' && r.activeId, 'the click did its job').toBe(b.id)
  expect(r.kind, 'and nothing got docked').toBe('group')
})

it('the tab bar is a real tablist: roving focus, arrow keys, linked panel', () => {
  const a = panelLeaf({ view: 'editor', title: 'Alpha' })
  const b = panelLeaf({ view: 'editor', title: 'Beta' })
  const ref = createRef<PanelLayoutHandle>()
  const tree: PanelNode = { kind: 'group', id: 'g', children: [a, b], activeId: a.id }
  render(<PanelLayout ref={ref} initial={() => tree} />)

  expect(container.querySelector('[role="tablist"]')).toBeTruthy()
  const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  expect(
    tabs.map((t) => t.tagName),
    'buttons, not bare divs'
  ).toStrictEqual(['BUTTON', 'BUTTON'])
  // Roving tabindex: the strip is one tab stop.
  expect(tabs.map((t) => t.tabIndex)).toStrictEqual([0, -1])

  // The selected tab and its panel point at each other.
  const panel = container.querySelector('[role="tabpanel"]') as HTMLElement
  expect(tabs[0].getAttribute('aria-controls')).toBe(panel.id)
  expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id)

  act(() => {
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  })
  const r = ref.current!.getRoot()
  expect(r.kind === 'group' && r.activeId, 'selection follows focus').toBe(b.id)
})

it('the divider is a keyboard-operable splitter', () => {
  const ref = createRef<PanelLayoutHandle>()
  render(<PanelLayout ref={ref} initial={twoPane} />)
  const sep = container.querySelector('[role="separator"]') as HTMLElement

  expect(sep.tabIndex, 'focusable, or there is no keyboard way to size a panel').toBe(0)
  expect(sep.getAttribute('aria-valuenow')).toBe('50')
  expect(sep.getAttribute('aria-valuemin')).toBe('0')
  expect(sep.getAttribute('aria-valuemax')).toBe('100')

  // jsdom reports a 0px container, so the shared clamp declines to move rather
  // than writing NaN — what matters here is that the key is handled at all.
  act(() => {
    sep.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    )
  })
  const sizes = sizesOf(ref.current!.getRoot())!
  expect(sizes.every(Number.isFinite), 'no NaN from a zero-width container').toBe(true)
})

it('a divider drag ends on the window pointerup, not only on one over the bar', () => {
  // The bug this pins: the divider used to end its drag from an element-scoped
  // `onPointerUp`. But a resize slides the boundary out from under the pointer,
  // so the release routinely lands off the 10px bar — the handler never fires,
  // the drag stays armed, and every later hover-move keeps resizing. The fix
  // moves pointermove/up/cancel to WINDOW listeners, which see the release
  // wherever it lands. The body cursor lock is the drag's observable tell: set
  // while armed, restored when it ends.
  render(<PanelLayout initial={twoPane} />)
  const sep = container.querySelector('[role="separator"]') as HTMLElement

  act(() => {
    sep.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 })
    )
  })
  expect(document.body.style.cursor, 'armed: the drag locks the resize cursor').toBe('col-resize')

  // Release over empty space, NOT over the bar — the case the old handler missed.
  act(() => {
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 400, clientY: 300 }))
  })
  expect(document.body.style.cursor, 'released: the drag ended and unlocked the cursor').toBe('')

  // And it stays ended: a later stray move must not re-arm or re-lock.
  act(() => {
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 420, clientY: 300 }))
  })
  expect(document.body.style.cursor, 'stays ended: no lingering drag tracking the pointer').toBe('')
})

it('a tree handed to `initial` is migrated and reseeds the id counters', () => {
  const ref = createRef<PanelLayoutHandle>()
  // A blob off disk: no instanceId, and ids above wherever the counter sits.
  const restored = {
    kind: 'split',
    id: 'n-800003',
    dir: 'row',
    sizes: [50, 50],
    children: [
      { kind: 'leaf', id: 'n-800001', n: 800001, view: 'chat' },
      { kind: 'leaf', id: 'n-800002', n: 800002, view: 'files' },
    ],
  } as unknown as PanelNode
  render(<PanelLayout ref={ref} initial={() => restored} />)

  const first = (ref.current!.getRoot() as Extract<PanelNode, { kind: 'split' }>)
    .children[0] as LeafNode
  expect(first.instanceId, 'migrated on the way in, like replaceRoot does').toBe('n-800001')

  act(() => ref.current!.splitWith('n-800002', 'row', 'fresh'))
  const ids: string[] = []
  const walk = (n: PanelNode) => (n.kind === 'leaf' ? ids.push(n.id) : n.children.forEach(walk))
  walk(ref.current!.getRoot())
  expect(new Set(ids).size, `no duplicate ids: ${ids.join()}`).toBe(ids.length)
  expect(leafIds().length, 'and the DOM agrees').toBe(3)
})

it('resetTo overrides what Reset rebuilds; without it Reset still uses initial', () => {
  const ref = createRef<PanelLayoutHandle>()
  // `initial` RESTORES (what a persistence hook does); `resetTo` starts over.
  const restored = () => panelSplit('row', [panelLeaf({ view: 'a' }), panelLeaf({ view: 'b' })])
  const startOver = () => panelLeaf({ view: 'blank' })

  render(<PanelLayout key="with" ref={ref} initial={restored} resetTo={startOver} showToolbar />)
  const reset = () =>
    [...container.querySelectorAll('button')].find((b) => b.textContent === 'Reset')!
  act(() => reset().click())
  expect(
    ref.current!.inspect().map((i) => i.view),
    'Reset starts over, not restores'
  ).toStrictEqual(['blank'])

  // Unchanged when resetTo is absent. A fresh `key` forces a real remount —
  // re-rendering the same element position would just reconcile onto the
  // instance above, which still holds the reset tree.
  render(<PanelLayout key="without" ref={ref} initial={restored} showToolbar />)
  act(() => ref.current!.closeLeaf(ref.current!.inspect()[1].id))
  act(() => reset().click())
  expect(ref.current!.inspect().map((i) => i.view)).toStrictEqual(['a', 'b'])
})
