import { CodeBlock } from '@dreamlake/uikit'

const log = Array.from(
  { length: 40 },
  (_, i) => `2026-08-19T14:0${i % 10}:12Z  step=${i * 25}  loss=${(2 / (i + 1)).toFixed(4)}`
).join('\n')

export const PlainSpec = () => <CodeBlock value={log} header={false} maxHeight={180} wrap />
