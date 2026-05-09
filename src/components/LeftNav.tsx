import { navGroups } from '../data/nav'

const asideCx =
  'sticky top-10 h-[calc(100vh-40px)] overflow-y-auto pt-[22px] pr-3 pb-8 pl-[18px] flex flex-col gap-0.5 ' +
  'max-[880px]:hidden ' +
  // Custom scrollbar — transparent until hover.
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[3px] hover:[&::-webkit-scrollbar-thumb]:bg-faint'

const groupCx = 'flex flex-col gap-px mb-[14px]'

const eyebrowCx =
  'flex items-center gap-1.5 px-2.5 pt-1.5 pb-1 font-mono text-[9px] font-semibold text-muted opacity-70 tracking-[0.14em] uppercase'

const rowBaseCx =
  'flex items-center gap-2 px-2.5 py-[5px] rounded-md font-ui text-[12.5px] font-medium tracking-[-0.005em] leading-[1.25] no-underline transition-[background-color,color] duration-[120ms]'

const rowDefaultCx = `${rowBaseCx} text-ink hover:bg-ink/5`
const rowActiveCx = `${rowBaseCx} bg-selected text-ink font-semibold`
const rowTodoCx = `${rowBaseCx} text-muted opacity-[0.42] line-through decoration-muted/70 decoration-1 cursor-not-allowed bg-transparent hover:bg-transparent`

export function LeftNav({ activeHref }: { activeHref: string }) {
  return (
    <aside className={asideCx} aria-label="Sections">
      {navGroups.map((g) => (
        <div className={groupCx} key={g.eyebrow}>
          <div className={eyebrowCx}>
            {g.eyebrow} <span className="ml-auto opacity-85">{g.count}</span>
          </div>
          {g.items.map((it) => {
            const cls = it.todo
              ? rowTodoCx
              : it.href === activeHref
                ? rowActiveCx
                : rowDefaultCx
            return (
              <a
                key={it.href}
                className={cls}
                href={it.todo ? '#' : it.href}
                aria-disabled={it.todo || undefined}
              >
                {it.label}
              </a>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
