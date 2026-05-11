declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export interface Frontmatter {
    title?: string
    section?: string
    order?: number
    kind?: 'component' | 'application'
    layer?: 'view' | 'dataIO'
    description?: string
  }
  export const frontmatter: Frontmatter
  const Component: ComponentType
  export default Component
}

declare module '*?raw' {
  const content: string
  export default content
}

/** Injected via Vite `define` in vite.config.ts. */
declare const __APP_VERSION__: string
declare const __GIT_HASH__: string
