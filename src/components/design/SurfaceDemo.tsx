// Live demonstration of the 3-tier surface stack — rail (left), body
// (center), floating panel (right). Uses the actual @theme tokens
// (bg-rail / bg-bg / bg-panel) so it doubles as visual proof the
// token wiring is correct under both light and dark themes.

const labelCx = 'font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted opacity-70 mb-1.5'
const itemCx = 'font-ui text-[12px] leading-[1.6]'
const itemActiveCx = `${itemCx} text-ink font-semibold`
const itemMutedCx = `${itemCx} text-muted`

export const SurfaceDemo = () => (
  <div
    className="grid grid-cols-[150px_minmax(0,1fr)] border border-faint rounded-md overflow-hidden h-[230px] my-6 shadow-[0_1px_2px_var(--shadow-tint-1)]"
    role="img"
    aria-label="Demo of the three-tier surface stack"
  >
    {/* Rail */}
    <aside className="bg-rail px-3 py-3 flex flex-col gap-3 border-r border-faint">
      <div>
        <div className={labelCx}>Workspaces</div>
        <div className={itemActiveCx}>acme · prod</div>
        <div className={itemMutedCx}>acme · staging</div>
        <div className={itemMutedCx}>sandbox</div>
      </div>
      <div>
        <div className={labelCx}>Recents</div>
        <div className={itemMutedCx}>events</div>
        <div className={itemMutedCx}>columns</div>
      </div>
    </aside>

    {/* Body + floating panel */}
    <div className="bg-bg relative p-4">
      <div className="absolute inset-x-4 top-4 bg-panel border border-faint rounded-md p-3 shadow-[0_2px_8px_var(--shadow-tint-1),0_8px_24px_var(--shadow-tint-2)]">
        <div className={labelCx}>Inspector · pipeline</div>
        <div className="font-ui text-[12.5px] leading-[1.55] text-ink [text-wrap:pretty]">
          Floating panels live on <code className="font-mono text-[0.88em] bg-chip text-ink py-px px-1.5 rounded border border-faint">--panel-bg</code>.
          Light: half-step darker than{' '}
          <code className="font-mono text-[0.88em] bg-chip text-ink py-px px-1.5 rounded border border-faint">--bg</code>.
          Dark: flattens onto{' '}
          <code className="font-mono text-[0.88em] bg-chip text-ink py-px px-1.5 rounded border border-faint">--bg</code>;
          the lift comes from a 1px hairline + shadow alone.
        </div>
      </div>
    </div>
  </div>
)
