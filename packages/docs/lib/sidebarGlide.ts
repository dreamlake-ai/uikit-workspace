/**
 * One highlight that glides between sidebar rows.
 *
 * The alternative — a background on each `a:hover` — makes every row light and
 * go dark on its own, so running down a list of fifty reads as fifty separate
 * events. A single block that travels says what is actually true: there is one
 * pointer, and it is on one row.
 *
 * The block is the rail's own `::before`, driven by custom properties. A real
 * element was the first attempt and it broke hydration: the rail is React's,
 * so a child injected into it is a node the server never rendered, and React
 * regenerates the tree and takes it away again. A pseudo-element is not in the
 * DOM at all, so there is nothing for React to disagree with.
 */
const RAIL = "aside.doc-sidebar";
const LINK = "a.sidebar-link";

let bound: HTMLElement | null = null;

function bind() {
  const rail = document.querySelector<HTMLElement>(RAIL);
  if (!rail || rail === bound) return;
  if (rail.querySelectorAll(LINK).length === 0) return;

  bound = rail;
  let parked = true;

  const place = (el: HTMLElement, show: boolean) => {
    const a = rail.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // The row's own box, not the rail's full width — the rows are inset, and
    // a block that runs edge to edge sits wider than the active pill it is
    // meant to echo.
    rail.style.setProperty("--glide-x", `${r.left - a.left}px`);
    rail.style.setProperty("--glide-w", `${r.width}px`);
    rail.style.setProperty("--glide-y", `${r.top - a.top + rail.scrollTop}px`);
    rail.style.setProperty("--glide-h", `${r.height}px`);
    rail.style.setProperty("--glide-o", show ? "1" : "0");
    parked = !show;
  };

  // Park it on the current page's row, invisible, so the first hover starts
  // from where the reader's attention already is rather than from nowhere.
  const current =
    rail.querySelector<HTMLElement>(`${LINK}[aria-current]`) ??
    rail.querySelector<HTMLElement>(`${LINK}[data-active]`) ??
    rail.querySelector<HTMLElement>(LINK);
  if (current) place(current, false);

  rail.addEventListener("pointerover", (event) => {
    const link = (event.target as HTMLElement | null)?.closest<HTMLElement>(LINK);
    if (!link) return;
    // Coming from parked, only the opacity animates — sliding in from a
    // position the reader never saw looks like the block flew in from
    // off-screen.
    rail.style.setProperty(
      "--glide-transition",
      parked ? "opacity" : "transform, width, height, opacity",
    );
    place(link, true);
  });

  rail.addEventListener("pointerleave", () => {
    rail.style.setProperty("--glide-transition", "opacity");
    rail.style.setProperty("--glide-o", "0");
    parked = true;
  });
}

function boot() {
  bind();
  // The rail belongs to the docs shell and is replaced on a client-side
  // navigation, so watch for the new one.
  new MutationObserver(() => bind()).observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}
