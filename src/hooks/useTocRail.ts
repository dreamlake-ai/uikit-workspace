import { useEffect } from 'react'
import type { TocItem } from '../components/RightTOC'

// Ports the prototype's continuous-SVG-rail behaviour: builds a smooth path
// down the TOC links (with a curved bend on indent changes), animates an
// active-stroke segment to the current section, and tracks the active
// heading via scroll position rather than IntersectionObserver (sticky h2's
// thrash IO callbacks).
export function useTocRail(items: TocItem[]) {
  useEffect(() => {
    const headings = items
      .map((it) => document.getElementById(it.id))
      .filter((h): h is HTMLElement => !!h)
    if (!headings.length) return

    const links: Record<string, HTMLAnchorElement> = {}
    const linksOrdered: HTMLAnchorElement[] = []
    document.querySelectorAll<HTMLAnchorElement>('.doc-toc a[href^="#"]').forEach((a) => {
      links[a.getAttribute('href')!.slice(1)] = a
    })
    document.querySelectorAll<HTMLAnchorElement>('#toc-list a[href^="#"]').forEach((a) => {
      linksOrdered.push(a)
    })

    const railSvg = document.getElementById('toc-rail') as unknown as SVGSVGElement | null
    if (!railSvg) return
    const railBase = railSvg.querySelector<SVGPathElement>('.rail-base')
    const railActive = railSvg.querySelector<SVGPathElement>('.rail-active')
    const railBody = railSvg.parentElement
    if (!railBase || !railActive || !railBody) return

    let railPoints: { id: string; len: number }[] = []

    const buildRail = () => {
      const bodyRect = railBody.getBoundingClientRect()
      const rows = linksOrdered.map((a) => {
        const li = a.parentElement!
        const r = a.getBoundingClientRect()
        return {
          a,
          id: a.getAttribute('href')!.slice(1),
          top: r.top - bodyRect.top,
          h: r.height,
          indent: li.classList.contains('lvl-3') ? 12 : 0,
        }
      })
      if (!rows.length) return

      const X0 = 4
      const BEND = 8

      let d = ''
      d += `M ${X0 + rows[0].indent} ${rows[0].top + 4}`
      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1]
        const cur = rows[i]
        const prevX = X0 + prev.indent
        const curX = X0 + cur.indent
        const midY = cur.top + 4
        if (prevX === curX) {
          d += ` L ${curX} ${midY}`
        } else {
          const bendStart = midY - BEND
          const bendEnd = midY + 2
          d += ` L ${prevX} ${bendStart}`
          d += ` C ${prevX} ${bendStart + BEND * 0.6}, ${curX} ${bendStart + BEND * 0.4}, ${curX} ${bendEnd}`
        }
      }
      const lastRow = rows[rows.length - 1]
      d += ` L ${X0 + lastRow.indent} ${lastRow.top + lastRow.h / 2}`

      railBase.setAttribute('d', d)
      railActive.setAttribute('d', d)
      const pathLen = railBase.getTotalLength()

      const endRect = railSvg.querySelector('.rail-end')
      if (endRect) {
        const endPt = railBase.getPointAtLength(pathLen)
        const SIZE = 5
        endRect.setAttribute('x', String(endPt.x - SIZE / 2))
        endRect.setAttribute('y', String(endPt.y - SIZE / 2))
        endRect.setAttribute('width', String(SIZE))
        endRect.setAttribute('height', String(SIZE))
      }

      railPoints = rows.map((row) => {
        const midY = row.top + row.h / 2
        let lo = 0, hi = pathLen
        for (let k = 0; k < 18; k++) {
          const mid = (lo + hi) / 2
          const p = railBase.getPointAtLength(mid)
          if (p.y < midY) lo = mid
          else hi = mid
        }
        return { id: row.id, len: (lo + hi) / 2 }
      })
    }

    let animReq: number | null = null
    let animFromLen = 0
    let animToLen = 0
    let animStart = 0
    const DURATION = 350
    let currentLen = 0

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

    const applyLen = (len: number) => {
      currentLen = len
      railActive.style.setProperty('--seg-len', String(len))
      const dot = railSvg.querySelector<SVGCircleElement>('.rail-dot')
      if (dot && len >= 0) {
        const p = railBase.getPointAtLength(Math.max(0, len))
        dot.setAttribute('cx', String(p.x))
        dot.setAttribute('cy', String(p.y))
      }
    }
    const tick = (now: number) => {
      const t = Math.min(1, (now - animStart) / DURATION)
      const v = animFromLen + (animToLen - animFromLen) * ease(t)
      applyLen(v)
      if (t < 1) animReq = requestAnimationFrame(tick)
      else animReq = null
    }
    const animateTo = (targetLen: number) => {
      if (Math.abs(targetLen - animToLen) < 0.5 && animReq) return
      animFromLen = currentLen
      animToLen = targetLen
      animStart = performance.now()
      if (!animReq) animReq = requestAnimationFrame(tick)
    }

    const setActiveRail = (activeId: string | null) => {
      const dot = railSvg.querySelector('.rail-dot')
      if (!activeId) {
        animateTo(0)
        if (dot) dot.classList.remove('is-on')
        return
      }
      const match = railPoints.find((p) => p.id === activeId)
      if (!match) return
      railActive.style.setProperty('--seg-start', '0')
      if (dot) dot.classList.add('is-on')
      animateTo(match.len)
    }

    let currentActiveId: string | null = null
    const applyActive = () => setActiveRail(currentActiveId)

    const rebuild = () => {
      buildRail()
      applyActive()
    }
    if (document.fonts?.ready) document.fonts.ready.then(rebuild)
    window.addEventListener('resize', rebuild)
    const t0 = setTimeout(rebuild, 50)

    const ACTIVATE_LINE = 110
    const pickActive = () => {
      let activeId = headings[0].id
      for (let i = 0; i < headings.length; i++) {
        const top = headings[i].getBoundingClientRect().top
        if (top - ACTIVATE_LINE <= 0.5) activeId = headings[i].id
        else break
      }
      if (activeId === currentActiveId) return
      Object.keys(links).forEach((id) => {
        links[id].classList.toggle('is-active', id === activeId)
      })
      currentActiveId = activeId
      setActiveRail(activeId)
    }

    let rafScheduled = false
    const onScrollOrResize = () => {
      if (rafScheduled) return
      rafScheduled = true
      requestAnimationFrame(() => {
        rafScheduled = false
        pickActive()
      })
    }
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    pickActive()

    return () => {
      clearTimeout(t0)
      if (animReq) cancelAnimationFrame(animReq)
      window.removeEventListener('resize', rebuild)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [items])
}
