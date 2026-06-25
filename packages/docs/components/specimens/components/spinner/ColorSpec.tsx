import { Spinner } from '@dreamlake/uikit'

export const ColorSpec = () => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
    {/* Default — inherits the muted token */}
    <Spinner />
    {/* Override via a text color utility (tailwind-merge keeps the last) */}
    <Spinner className="text-uikit-tone-blue" />
    <Spinner className="text-uikit-tone-red" />
    {/* Or inherit an arbitrary color from a parent */}
    <span style={{ color: 'var(--tone-green)' }}>
      <Spinner />
    </span>
  </div>
)
