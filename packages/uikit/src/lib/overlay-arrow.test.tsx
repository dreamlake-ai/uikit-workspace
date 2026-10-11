// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/Tooltip/Tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '../components/Popover/Popover'

let root: Root
let container: HTMLDivElement
let triggerBox = { x: 300, y: 300, width: 80, height: 30 }
const box = (x: number, y: number, width: number, height: number) => ({
  x, y, width, height, top: y, left: x, right: x + width, bottom: y + height, toJSON() {},
})
beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  triggerBox = { x: 300, y: 300, width: 80, height: 30 }
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.hasAttribute('data-trigger')) return box(triggerBox.x, triggerBox.y, triggerBox.width, triggerBox.height)
    if (this.hasAttribute('data-uikit-overlay')) return box(0, 0, 160, 80)
    if (this.hasAttribute('data-uikit-overlay-arrow')) return box(0, 0, 7, 7)
    return box(0, 0, 800, 600)
  })
  for (const [property, axis] of [['offsetWidth', 'width'], ['offsetHeight', 'height'], ['clientWidth', 'width'], ['clientHeight', 'height']] as const)
    vi.spyOn(HTMLElement.prototype, property, 'get').mockImplementation(function (this: HTMLElement) {
      return this.getBoundingClientRect()[axis]
    })
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})
type Kind = 'tooltip' | 'popover'
type Side = 'top' | 'right' | 'bottom' | 'left'
async function render(kind: Kind, { side = 'bottom', showArrow, motion }: { side?: Side; showArrow?: boolean; motion?: boolean } = {}) {
  await act(async () => root.render(kind === 'tooltip' ?
    <Tooltip defaultOpen side={side} showArrow={showArrow}>
      <TooltipTrigger data-trigger>Help</TooltipTrigger>
      <TooltipContent motion={motion}>Contextual help</TooltipContent>
    </Tooltip> :
    <Popover defaultOpen side={side} showArrow={showArrow}>
      <PopoverTrigger data-trigger>Help</PopoverTrigger>
      <PopoverContent><button>Done</button></PopoverContent>
    </Popover>))
}
const overlay = () => document.querySelector<HTMLElement>('[data-uikit-overlay]')!
const arrow = () => document.querySelector<HTMLElement>('[data-uikit-overlay-arrow]')!

it.each(['tooltip', 'popover'] as const)('%s shows a decorative default wedge and allows opting out with the original gap', async kind => {
  await render(kind)
  expect(arrow()).toBeTruthy()
  expect(arrow().getAttribute('aria-hidden')).toBe('true')
  expect(arrow().style.pointerEvents).toBe('none')
  expect(overlay().classList.contains('uikit-overlay-enter')).toBe(true)
  await render(kind, { showArrow: false })
  expect(arrow()).toBeNull()
  if (kind === 'popover') expect(overlay().style.top).toBe('336px')
  else expect(overlay().style.transform).toContain('336px')
})

it.each((['tooltip', 'popover'] as const).flatMap(kind => (['top', 'right', 'bottom', 'left'] as const).map(side => ({ kind, side }))))('$kind points its wedge at the trigger from $side', async ({ kind, side }) => {
  await render(kind, { side })
  const edge = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side] as Side
  expect(overlay().dataset.side).toBe(side)
  expect(arrow().dataset.side).toBe(side)
  expect(arrow().style[edge]).toBe('-0.5px')
})

it.each(['tooltip', 'popover'] as const)('%s wedge follows flipped placement at the viewport edge', async kind => {
  triggerBox.y = 560
  await render(kind, { side: 'bottom' })
  expect(overlay().dataset.side).toBe('top')
  expect(arrow().dataset.side).toBe('top')
  expect(arrow().style.bottom).toBe('-0.5px')
  expect(arrow().style.top).toBe('')
})

it.each(['tooltip', 'popover'] as const)('%s adjusts its arrow after horizontal collision shifting', async kind => {
  triggerBox.x = 0
  triggerBox.width = 20
  await render(kind, { side: 'bottom' })
  expect(overlay().dataset.side).toBe('bottom')
  expect(Number.parseFloat(arrow().style.left)).toBeLessThan(30)
  expect(Number.parseFloat(arrow().style.left)).toBeGreaterThanOrEqual(8)
})

it('can disable tooltip entry without disturbing Floating UI anchoring or tooltip semantics', async () => {
  await render('tooltip', { motion: false })
  expect(overlay().classList.contains('uikit-overlay-enter')).toBe(false)
  expect(overlay().style.transform).toContain('translate(')
  expect(overlay().getAttribute('role')).toBe('tooltip')
  expect(container.querySelector('button')?.getAttribute('aria-describedby')).toBe(overlay().id)
})
