import { useEffect } from 'react'

// Preserve URLs shared before the guide was split into separate pages.
const destinations: Record<string, string> = {
  "color": "/style-guide/color#color",
  "surfaces": "/style-guide/color#surfaces",
  "lines-that-cross-rows": "/style-guide/color#lines-that-cross-rows",
  "row-states-are-luminance-not-hue": "/style-guide/color#row-states-are-luminance-not-hue",
  "ink": "/style-guide/color#ink",
  "drag-affordances": "/style-guide/color#drag-affordances",
  "semantic-palette": "/style-guide/color#semantic-palette",
  "tones-as-text": "/style-guide/color#tones-as-text",
  "when-adding-a-new-concept": "/style-guide/color#when-adding-a-new-concept",
  "why-six-and-not-more": "/style-guide/color#why-six-and-not-more",
  "chart-axes": "/style-guide/color#chart-axes",
  "code-surfaces": "/style-guide/color#code-surfaces",
  "typography": "/style-guide/typography#typography",
  "spacing--layout": "/style-guide/spacing-layout#spacing--layout",
  "spacing-scale": "/style-guide/spacing-layout#spacing-scale",
  "page-grid": "/style-guide/spacing-layout#page-grid",
  "breakpoints": "/style-guide/spacing-layout#breakpoints",
  "touch-card-meta-goes-to-the-bottom-right-corner": "/style-guide/spacing-layout#touch-card-meta-goes-to-the-bottom-right-corner",
  "iconography": "/style-guide/iconography#iconography",
  "categories": "/style-guide/iconography#categories",
  "migration-backlog": "/style-guide/iconography#migration-backlog",
  "elevation--depth": "/style-guide/elevation#elevation--depth",
  "shadow-scale": "/style-guide/elevation#shadow-scale",
  "z-index-layers": "/style-guide/elevation#z-index-layers",
  "border--radius": "/style-guide/border-radius#border--radius",
  "radius-scale": "/style-guide/border-radius#radius-scale",
  "hairlines--dividers": "/style-guide/border-radius#hairlines--dividers",
  "motion": "/style-guide/motion#motion",
  "durations--easings": "/style-guide/motion#durations--easings",
  "loading-and-progress-one-shared-dot-spinner": "/style-guide/loading",
  "when-not-to-animate": "/style-guide/motion#when-not-to-animate",
  "zebra-lists": "/style-guide/zebra-lists#zebra-lists",
  "the-four-band-model": "/style-guide/zebra-lists#the-four-band-model",
  "per-state-colors": "/style-guide/zebra-lists#per-state-colors",
  "multi-row-runs": "/style-guide/zebra-lists#multi-row-runs"
}

export function LegacyStyleGuideLinks() {
  useEffect(() => {
    const redirect = () => {
      const destination = destinations[decodeURIComponent(window.location.hash.slice(1))]
      if (destination) window.location.replace(destination)
    }
    redirect()
    window.addEventListener('hashchange', redirect)
    return () => window.removeEventListener('hashchange', redirect)
  }, [])
  return null
}
