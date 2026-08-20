import { CodeBlock } from '@dreamlake/uikit'

const snippet = `pnpm add @dreamlake/uikit
pnpm add -D tailwindcss@4
`

export const UnnamedSpec = () => <CodeBlock value={snippet} lang="bash" />
