import { CodeBlock } from '@dreamlake/uikit'

const source = `export function greet(name: string) {
  const parts = name.trim().split(/\\s+/)
  return \`Hello, \${parts[0] ?? 'world'}!\`
}
`

export const PreviewSpec = () => <CodeBlock value={source} lang="ts" filename="greet.ts" />
