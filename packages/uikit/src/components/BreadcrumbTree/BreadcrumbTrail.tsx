import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../DropdownMenu";

type Crumb = { key: string; label: string; onSelect: () => void };

/** Collapse ancestors from the middle, keeping the root and current location. */
export function hiddenAncestorCount(
  widths: number[],
  available: number,
  controls: number,
  overflow: number,
) {
  if (
    widths.length < 3 ||
    available <= 0 ||
    widths.reduce((a, b) => a + b, controls) <= available
  )
    return 0;
  let used =
    Math.min(widths[0], available * 0.3) +
    widths[widths.length - 1] +
    controls +
    overflow;
  let hidden = widths.length - 2;
  for (let i = widths.length - 2; i > 0; i--) {
    if (used + widths[i] > available) break;
    used += widths[i];
    hidden--;
  }
  return Math.max(1, hidden);
}

const buttonClass =
  "appearance-none border-0 outline-none bg-transparent p-0 mr-1 cursor-pointer rounded-[2px] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-uikit-accent focus-visible:outline-offset-2 font-normal leading-[1.1] -translate-y-px transition-[color,opacity] duration-[120ms] data-[leaf]:text-uikit-ink data-[leaf]:opacity-100 hover:text-uikit-accent hover:opacity-100";
const separatorClass =
  "shrink-0 text-uikit-11 opacity-45 pr-1 select-none leading-none";

export function BreadcrumbTrail({
  items,
  children,
}: {
  items: Crumb[];
  children: ReactNode;
}) {
  const nav = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const controls = useRef<HTMLSpanElement>(null);
  const [hidden, setHidden] = useState(0);
  const labels = JSON.stringify(items.map(({ label }) => label));
  useLayoutEffect(() => {
    const update = () => {
      const row = nav.current;
      const samples = measure.current;
      if (!row || !samples) return;
      const widths = Array.from(
        samples.children,
        (el) => el.getBoundingClientRect().width,
      );
      const overflow = widths.pop() ?? 0;
      setHidden(
        hiddenAncestorCount(
          widths,
          row.clientWidth,
          controls.current?.getBoundingClientRect().width ?? 0,
          overflow,
        ),
      );
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    if (nav.current) observer.observe(nav.current);
    if (measure.current) observer.observe(measure.current);
    return () => observer.disconnect();
  }, [labels]);

  return (
    <div
      ref={nav}
      role="navigation"
      aria-label="Navigation path"
      className="relative inline-flex w-full min-w-0 max-w-full items-center gap-0 h-4 leading-4 whitespace-nowrap font-uikit-ui text-uikit-12 tracking-uikit-snug text-uikit-muted opacity-70"
    >
      {/* Noninteractive natural-width samples remain measurable after collapse.
        The clipped wrapper cannot extend the document's scrollable area. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          visibility: "hidden",
        }}
      >
        <span
          ref={measure}
          style={{ display: "inline-flex", width: "max-content" }}
        >
          {[...items.map((item) => item.label), "…"].map((label, i) => (
            <span key={i} style={{ display: "inline-flex", flexShrink: 0 }}>
              <span
                data-label={label}
                className={buttonClass + " before:content-[attr(data-label)]"}
              />
              {i !== items.length - 1 && (
                <span className={separatorClass}>›</span>
              )}
            </span>
          ))}
        </span>
      </span>
      {items.map((item, i) => {
        if (i > 0 && i <= hidden) return null;
        const leaf = i === items.length - 1;
        return (
          <Fragment key={item.key}>
            <button
              type="button"
              title={item.label}
              aria-current={leaf ? "location" : undefined}
              data-leaf={leaf || undefined}
              className={buttonClass + " min-w-0 truncate"}
              style={{
                flexShrink: leaf || i === 0 ? 1 : 0,
                ...(hidden && i === 0 ? { maxWidth: "30%" } : {}),
              }}
              onClick={(event) => {
                event.stopPropagation();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
            {!leaf && (
              <span aria-hidden="true" className={separatorClass}>
                ›
              </span>
            )}
            {i === 0 && hidden > 0 && (
              <>
                <DropdownMenu align="start">
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Show hidden ancestors"
                      className={buttonClass + " shrink-0"}
                    >
                      …
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-w-[min(90vw,360px)] max-h-[60vh] overflow-y-auto">
                    {items.slice(1, hidden + 1).map((ancestor) => (
                      <DropdownMenuItem
                        asChild
                        key={ancestor.key}
                        onSelect={ancestor.onSelect}
                      >
                        <button
                          type="button"
                          className="w-full text-left break-words whitespace-normal min-w-0"
                        >
                          {ancestor.label}
                        </button>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span aria-hidden="true" className={separatorClass}>
                  ›
                </span>
              </>
            )}
          </Fragment>
        );
      })}
      <span ref={controls} className="inline-flex shrink-0 items-center">
        {children}
      </span>
    </div>
  );
}
