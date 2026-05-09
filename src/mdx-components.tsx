import {
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import { CodeBlock, H2 } from './components/prose'

// Component mapping for MDX. Heading tags get auto-IDs from rehype-slug
// (configured in vite.config.ts), so the H2 component receives `id` as
// a prop on its own. The other prose elements (h1, h3, p, ul, ol, li,
// table, code) keep their default tags — descendant CSS in
// `pages/+Layout.tsx`'s docContentCx wrapper styles them.
//
// rehype-shiki turns fenced code blocks into
//   <pre class="shiki language-X" data-language="X" data-file="...">
//     <code><span style="color:...">...</span>...</code>
//   </pre>
// Our `pre` override extracts language + file and wraps shiki's
// already-highlighted <pre> in our CodeBlock chrome. shiki's class +
// inline styles flow through unchanged.
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

  pre: (props: ComponentProps<'pre'>) => {
    const { children, className, ...rest } = props as {
      children?: ReactNode
      className?: string
      [k: string]: unknown
    }

    // Pull the language out of either <pre data-language> (set by our
    // stampLanguage transformer) or the inner <code class="language-X">.
    const dataLang = (rest as Record<string, unknown>)['data-language']
    const codeChild = isValidElement(children) ? (children as ReactElement) : null
    const codeClassName =
      (codeChild?.props as { className?: string } | undefined)?.className ?? ''
    const langFromCode = codeClassName.match(/language-(\S+)/)?.[1]
    const lang =
      (typeof dataLang === 'string' ? dataLang : undefined) ?? langFromCode ?? 'text'

    const file = (rest as Record<string, unknown>)['data-file']
    const fileStr = typeof file === 'string' ? file : undefined

    // Re-render the original <pre> as a child of our CodeBlock chrome,
    // preserving every property shiki set (class, dual-theme inline
    // styles, data attributes).
    return (
      <CodeBlock lang={lang} file={fileStr}>
        <pre className={className} {...rest}>
          {children}
        </pre>
      </CodeBlock>
    )
  },
}
