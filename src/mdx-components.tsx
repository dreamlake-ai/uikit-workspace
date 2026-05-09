import type { ComponentProps } from 'react'
import { H2 } from './components/prose'

// Component mapping for MDX. Heading tags get auto-IDs from rehype-slug
// (configured in vite.config.ts), so the H2 component receives `id` as
// a prop on its own. The other prose elements (h1, h3, p, ul, ol, li,
// table, code) keep their default tags — descendant CSS in
// `pages/+Layout.tsx`'s docContentCx wrapper styles them.
//
// TODO(prop-forwarding): the H2 component's signature accepts only
// `{ id, children }`, so any extra props rehype plugins might attach
// (data-*, classes from rehype-autolink-headings, etc.) get dropped
// here. Not an issue with the current plugin set; widen H2's signature
// when/if we add plugins that decorate headings.

export const mdxComponents = {
  h2: (props: ComponentProps<'h2'>) => {
    const { id, children } = props
    if (!id) return <h2 {...props} />
    return <H2 id={id}>{children}</H2>
  },
}
