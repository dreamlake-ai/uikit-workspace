import type { MDXComponents } from 'mdx/types'
import {
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  Callout,
  CodeBlock,
  Crumbs,
  H1 as ProseH1,
  H2 as ProseH2,
  H3 as ProseH3,
  In,
  Lede,
} from './components/prose'

// Shape of the props MDX passes to a `pre` override. Augments the
// standard <pre> intrinsic props with the data-* attributes our
// rehype-shiki transformer + parseMetaString stamp on at build time.
type PreProps = ComponentPropsWithoutRef<'pre'> & {
  'data-language'?: string
  'data-file'?: string
}

// Shape of the props MDX passes to a heading override. rehype-slug
// guarantees `id` is present at build time, so the prose H1/H2/H3
// components can rely on it without a fallback.
type HeadingProps = ComponentPropsWithoutRef<'h2'> & { children?: ReactNode }

// Components map injected into every .mdx via the MDXProvider in
// +Layout.tsx. Only override what we want to *transform*; leave plain
// elements alone so descendant Tailwind variants on .doc-content style
// them.
//
// rehype-slug runs at compile time and stamps every heading with a
// GitHub-style id, so `id` is always present on h2.
//
// rehype-shiki runs at compile time and turns fenced code blocks into
// <pre class="shiki language-X" data-language="X" data-file="...">
// <code><span style="color:...">...</span>...</code></pre>. Our `pre`
// override extracts the language + file and wraps the highlighted
// <pre> in our CodeBlock chrome.
export const mdxComponents: MDXComponents = {
  h1: ({ id, children }: HeadingProps) => (
    <ProseH1 id={id ?? ''}>{children}</ProseH1>
  ),
  h2: ({ id, children }: HeadingProps) => (
    <ProseH2 id={id ?? ''}>{children}</ProseH2>
  ),
  h3: ({ id, children }: HeadingProps) => (
    <ProseH3 id={id ?? ''}>{children}</ProseH3>
  ),

  // Custom prose primitives — surfaced by name so .mdx files can use
  // <Lede>, <Crumbs>, <Callout>, <In> without an explicit import. JSX
  // resolves PascalCase tags first against the file's local scope, then
  // falls back to the components passed into MDXProvider.
  Lede,
  Crumbs,
  Callout,
  In,

  pre: (props: PreProps) => {
    const { children, className, ...rest } = props

    // Pull the language out of either the <pre data-language> attr or
    // the inner <code class="language-X">. shiki sets data-language on
    // the <pre>; the latter is the fallback.
    const dataLang = rest['data-language']
    const codeChild = isValidElement(children)
      ? (children as ReactElement<{ className?: string }>)
      : null
    const codeClassName = codeChild?.props.className ?? ''
    const langFromCode = codeClassName.match(/language-(\S+)/)?.[1]
    const lang = dataLang ?? langFromCode ?? 'text'

    // Re-render the original <pre> as a child of our CodeBlock chrome,
    // preserving every property shiki set on it (class, style with
    // dual-theme colors, data attributes).
    return (
      <CodeBlock lang={lang} file={rest['data-file']}>
        <pre className={className} {...rest}>
          {children}
        </pre>
      </CodeBlock>
    )
  },
}
