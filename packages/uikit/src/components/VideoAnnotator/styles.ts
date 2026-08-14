import { useEffect } from "react";

const STYLE_ID = "uikit-video-annotator-styles";

/** Inject the component's scoped stylesheet once per document. Kept as an
 *  injected <style> (rather than a Tailwind class soup) because the timeline
 *  relies on :has(), ::before, color-mix(), and dynamic percentage positioning
 *  that don't map to utility classes. */
export function useAnnotatorStyles(): void {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/* Scoped stylesheet. Local `--va-*` vars alias the uikit design tokens (with
   the reference template's hex values as standalone fallbacks) so the widget
   looks identical to the original AND follows uikit light/dark theming. */
export const CSS = `
.va-root{
  --va-bg: var(--bg, #fffefb);
  --va-panel: var(--panel-bg, #fcfbf7);
  --va-panel2: var(--search-bg, #f3f1ea);
  --va-field: var(--panel-bg, #fefefa);
  --va-line: var(--faint, rgba(0,0,0,.08));
  --va-text: var(--ink, #1a1a1a);
  --va-muted: var(--uikit-muted, #6b6b6b);
  --va-accent: var(--uikit-accent, #23aaff);
  --va-good: var(--tone-green, #1f8f4a);
  --va-warn: var(--tone-amber, #c0922e);
  --va-reseg: var(--tone-purple, #8b5cf6);
  --va-danger: var(--tone-red, #c8513b);
  --va-idle: var(--tone-warm-gray, #9c907a);
  --va-selected: var(--selected-bg, #f5f3ee);
  --va-radius: var(--radius, 6px);
  /* Scrub rail — opaque so fill/knob never stack translucently (design tokens). */
  --va-scrub-track: #e6e4dc;
  --va-scrub-fill:  #73726e;
  --va-scrub-knob:  #5c5b57;
  /* Edited-segment ring — green (design --lab-edit = --diff-add). */
  --va-edit: var(--diff-add, var(--tone-green, #1f8f4a));
  /* Popover/tooltip drop shadow. Aliases the kit's theme-aware shadow token
     so it stays dark in dark mode — not a white glow off the light ink. */
  --va-shadow: var(--shadow-tint-2, rgba(0,0,0,.1));
  --va-hover: color-mix(in srgb, var(--va-text) 5%, var(--va-panel));
  /* Own stacking context so the timeline/tooltip/menu z-indexes (up to 60) stay
     contained and can't paint over a host's sticky header when scrolled. */
  isolation:isolate;
  display:flex; flex-direction:column; gap:8px; min-width:0; min-height:0; height:100%;
  color:var(--va-text);
  font:14px/1.45 var(--f-ui, "Inter Tight", ui-sans-serif, system-ui, -apple-system, sans-serif);
}
.va-root button{font:inherit;color:var(--va-text);background:transparent;border:1px solid transparent;
  border-radius:var(--va-radius);padding:6px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.va-root button:hover{background:var(--va-panel2)}
.va-root button:active{transform:translateY(1px)}
.va-root button:disabled{opacity:.35;cursor:default}
.va-root button:disabled:hover{background:transparent}

.va-head{display:flex;align-items:center;gap:10px;flex:none;min-height:28px}
.va-head-title{font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.va-head-sub{font:12px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.va-stage{position:relative;flex:1;min-height:0;background:#000;border-radius:var(--va-radius);
  overflow:hidden;display:flex;align-items:center;justify-content:center}
.va-video{max-width:100%;max-height:100%;background:#000}
.va-stage-msg{position:absolute;color:var(--va-muted);font-size:13px;text-align:center;padding:20px}
/* Buffering overlay (design-spec dreamlake-loading: thin ring + mono status),
   centered over the video; never intercepts clicks. */
.va-buffering{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:3}
.va-buf{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
@keyframes va-bufspin{to{transform:rotate(360deg)}}
.va-bufring{width:26px;height:26px;border-radius:50%;
  border:1.5px solid rgba(255,255,255,.18);border-top-color:rgba(255,255,255,.62);
  animation:va-bufspin .8s linear infinite}
.va-buflabel{font:500 9px/1 var(--f-mono, ui-monospace, monospace);letter-spacing:.14em;
  text-transform:uppercase;color:rgba(255,255,255,.55)}
.va-buflabel b{font-weight:500;color:rgba(255,255,255,.38)}
@media (prefers-reduced-motion: reduce){.va-bufring{animation:none}}
/* Shared scrub bar — a slim static progress rail that sits BELOW the video
   stage (design .lab-video__scrub): a 3px track, a played fill, and a small
   round knob that only appears on hover/drag. Inset 8px from the left/right
   edges so the rail clears the video corners (design .lab-video__scrub). */
.va-seek{position:relative;display:flex;align-items:center;height:11px;margin:-6px 8px 0;
  flex:none;cursor:pointer;touch-action:none}
.va-seek::before{content:"";position:absolute;left:0;right:0;top:-6px;bottom:-6px}
.va-seek-track{position:relative;flex:1;height:3px;border-radius:2px;background:var(--va-scrub-track)}
.va-seek-buf{position:absolute;left:0;top:0;bottom:0;border-radius:2px;
  background:color-mix(in srgb, var(--va-scrub-fill) 30%, transparent)}
.va-seek-fill{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--va-scrub-fill)}
.va-seek-thumb{position:absolute;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:999px;
  background:var(--va-scrub-knob);opacity:0;transition:opacity .12s ease;pointer-events:none}
.va-seek:hover .va-seek-thumb,.va-seek:active .va-seek-thumb{opacity:1}
/* Hand-pose overlay canvas: absolutely positioned by JS to sit exactly over the
   letterboxed video content. Never intercepts pointer events. */
.va-overlay{position:absolute;left:0;top:0;pointer-events:none;z-index:2}

/* 3-column grid with equal side tracks keeps the playback cluster on the true
   horizontal center — aligned with the centered video above — regardless of
   how wide the readout/speed (left) vs split/extract (right) groups are. */
.va-transport{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);
  align-items:center;gap:10px;flex:none;margin-top:-2px}
.va-tp-left,.va-tp-right{display:flex;align-items:center;gap:8px;min-width:0}
.va-tp-right{justify-content:flex-end}
.va-tp-center{display:flex;align-items:center;gap:8px;flex:none}
/* Transport controls are quiet round buttons (design .lab-round): fully round,
   transparent, resting at .75 opacity → ink on hover with a soft ink wash;
   active (toggles) turn accent. Scoped under .va-transport to beat the base
   .va-root button rules. */
.va-transport .va-icon{width:30px;height:30px;padding:0;justify-content:center;border-radius:999px;
  background:transparent;border:0;color:var(--va-text);opacity:.75;
  transition:opacity .12s ease, background .12s ease, color .12s ease}
.va-transport .va-icon:hover{opacity:1;color:var(--va-text);
  background:color-mix(in srgb, var(--va-text) 5%, transparent)}
/* Disabled (e.g. prev/next segment at the ends): no hover, no tooltip, no click.
   pointer-events:none stops the portaled tooltip from firing too. */
.va-transport .va-icon:disabled{opacity:.35;cursor:default;pointer-events:none;
  background:transparent;color:var(--va-text)}
/* Big center play/pause. */
.va-transport .va-icon.va-play{width:36px;height:36px}
/* Toggle icons (hand-pose + host transportExtra toggles): accent when ON. */
.va-transport .va-icon.on{opacity:1;color:var(--va-accent);background:transparent}
.va-transport .va-icon.on:hover{background:color-mix(in srgb, var(--va-text) 5%, transparent)}
.va-icon svg{flex:none}
.va-root svg{stroke-linejoin:round;stroke-linecap:round}

.va-readout{font:12px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-text);opacity:.8;
  padding:6px 0;text-align:left;flex:none;width:176px;white-space:nowrap}
.va-speedsel{position:relative;display:inline-flex}
/* Speed picker (design .lab-speed): a quiet mono token, no chrome at rest,
   ink + soft wash on hover/open. */
.va-speedsel .va-speedbtn{display:inline-flex;align-items:center;gap:3px;height:auto;padding:2px 4px;
  background:transparent;color:var(--va-muted);border:0;border-radius:6px;cursor:pointer;
  font:12px var(--f-mono, ui-monospace, Menlo, monospace)}
.va-speedbtn .va-caret{color:var(--va-muted)}
.va-speedbtn:hover{background:color-mix(in srgb, var(--va-text) 6%, transparent);color:var(--va-text)}
/* No press-shift on the speed button — the base button:active translate reads
   as jitter here next to the readout. */
.va-speedsel .va-speedbtn:active{transform:none}
.va-speedsel.open .va-speedbtn{background:color-mix(in srgb, var(--va-text) 6%, transparent);color:var(--va-text)}
.va-speedmenu{position:absolute;bottom:calc(100% + 6px);left:0;z-index:40;min-width:calc(100% + 8px);
  background:var(--va-panel);border:1px solid var(--va-line);border-radius:6px;
  box-shadow:0 8px 24px var(--va-shadow);padding:4px}
.va-speedmenu button{width:100%;display:flex;align-items:center;gap:6px;white-space:nowrap;height:auto;
  background:transparent;border:none;border-radius:6px;padding:5px 12px 5px 22px;
  font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-text);text-align:left;position:relative}
.va-speedmenu button:hover{background:var(--va-panel2)}
.va-speedmenu button[aria-selected="true"]{color:var(--va-accent)}
.va-speedcheck{position:absolute;left:6px}

/* margin-top opens a gap above the timeline for the floating zoom capsule
   (which sits over the ruler) and separates it from the transport row. */
.va-tlwrap{position:relative;display:flex;flex:none}
.va-tlwrap.multi{gap:8px}
/* Horizontal-scroll viewport for the (possibly widened) timeline canvas. The
   canvas grows to zoom*100% and overflows here; at 1× it's exactly 100% (no
   scrollbar). overflow-y:hidden is safe: the merge (X) affordance renders inside
   the active lane (see .va-merge), not above the ruler, so nothing overflows up. */
.va-tlscroll{flex:1;min-width:0;overflow-x:auto;overflow-y:hidden}
.va-tlscroll .va-timeline{min-width:100%}
.va-tlscroll::-webkit-scrollbar{height:8px}
.va-tlscroll::-webkit-scrollbar-thumb{background:color-mix(in srgb, var(--va-text) 18%, transparent);border-radius:4px}
.va-tlscroll::-webkit-scrollbar-track{background:transparent}
/* Timeline zoom capsule — a direct port of the viz episode-timeline ZoomBar.
   FLOATS at the top-center of the timeline (over the ruler), exactly like the
   reference (absolute, top:0, left:50%, translateX(-50%)). A pill with the
   two steppers around a draggable value (drag right = zoom in). */
/* Top edge sits at the TOP of the ruler zone (y:0), centered — the capsule
   hangs down over the labels rather than resting on the baseline. */
.va-zoomfloat{position:absolute;top:0;left:50%;transform:translateX(-50%);z-index:9;pointer-events:auto}
/* Zoom capsule — ported 1:1 from the design's raised-surface pill: fixed 92×24,
   no border (a 1px ink ring + soft shadow), mono, round muted ‹ / › steppers. */
.va-zoom{display:inline-flex;align-items:center;justify-content:space-between;gap:1px;
  width:92px;height:24px;padding:0 4px;border-radius:6px;
  background:var(--va-bg);
  box-shadow:0 1px 2px rgba(0,0,0,.05), 0 0 0 1px color-mix(in srgb, var(--va-text) 6%, transparent);
  font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-text);
  user-select:none;-webkit-user-select:none}
/* ‹ / › ghost steppers — round, muted, ink + tint on hover. 2-class selectors
   beat the base .va-root button rules. */
.va-zoom .va-zoombtn{width:16px;height:16px;min-width:16px;padding:0;
  display:inline-flex;align-items:center;justify-content:center;
  border:0;border-radius:999px;background:transparent;color:var(--va-muted);cursor:pointer;
  transition:background-color .12s ease, color .12s ease}
.va-zoom .va-zoombtn:hover{color:var(--va-text);background:color-mix(in srgb, var(--va-text) 6%, transparent)}
.va-zoom .va-zoombtn:active{transform:none}
.va-zoom .va-zoombtn:disabled{opacity:.35;cursor:default}
.va-zoom .va-zoombtn:disabled:hover{background:transparent;color:var(--va-muted)}
.va-zoom .va-zoombtn svg{flex:none}
/* Draggable value: 500-weight number + small muted ×. touch-action:none lets
   pointer capture own the gesture on touch. */
.va-zoomdrag{display:inline-flex;align-items:center;justify-content:center;gap:2px;line-height:1;
  height:18px;padding:0 4px;border-radius:5px;
  cursor:ew-resize;user-select:none;-webkit-user-select:none;touch-action:none;outline:none;
  transition:background-color .12s ease}
.va-zoomdrag:hover{background:color-mix(in srgb, var(--va-text) 6%, transparent)}
.va-zoomdrag.on{cursor:grabbing;background:color-mix(in srgb, var(--va-text) 6%, transparent)}
.va-zoomnum{font:11px var(--f-mono, ui-monospace, Menlo, monospace);font-weight:500;
  letter-spacing:-0.01em;font-variant-numeric:tabular-nums;color:var(--va-text)}
.va-zoomx{font-size:9px;font-weight:400;color:var(--va-muted)}
/* display:flow-root gives the timeline its own block formatting context so the
   .va-tracks margin-top:30px (which drops the lanes below the ruler) is
   CONTAINED instead of collapsing through — the timeline no longer gets the free
   BFC it had as a flex item before the scroll wrapper was added. Without this
   the lanes render at top:0 and overlap the ruler. */
.va-timeline{position:relative;display:flow-root;min-height:89px;background:transparent;cursor:pointer;user-select:none}
.va-timeline:not(:has(.va-seg))::before{content:"";position:absolute;top:41px;bottom:0;left:0;right:0;
  border-radius:6px;background:color-mix(in srgb, var(--va-text) 4%, transparent);box-shadow:inset 0 0 0 1px var(--va-line)}
/* Stacked track lanes below the ruler. Each row hosts its segments (and, for
   the active row, the drag handles); rows flow so the timeline grows with the
   track count. */
.va-tracks{margin-top:41px;display:flex;flex-direction:column;gap:3px}
.va-track{position:relative;height:48px}
/* Unselected lanes (multi-select): NO border at all, a subtle bg-only hover, and
   dimmed text — visually distinct from selected lanes (which get accent rings).
   "Selected vs not" is exactly this border/emphasis difference; the host acts on
   the selected set separately. */
.va-track.va-unsel .va-seg,
.va-track.va-unsel .va-seg.sel,
.va-track.va-unsel .va-seg.edited,
.va-track.va-unsel .va-seg.reseg{background:color-mix(in srgb, var(--va-text) 3%, var(--va-bg));box-shadow:none}
.va-track.va-unsel .va-seg:hover{background:color-mix(in srgb, var(--va-text) 6%, var(--va-bg));box-shadow:none}
.va-track.va-unsel .va-seg-n,.va-track.va-unsel .va-seglabel{color:var(--va-muted);opacity:.7}
/* An unselected lane still highlights its playhead (current) segment — but in a
   PALER accent than a selected lane (design: whether a lane is "selected" is only
   a visual difference in this component). */
.va-track.va-unsel .va-seg.cur{background:color-mix(in srgb, var(--va-accent) 7%, var(--va-bg));
  box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--va-accent) 40%, transparent)}
.va-track.va-unsel .va-seg.cur .va-seg-n,.va-track.va-unsel .va-seg.cur .va-seglabel{opacity:.9}
/* Lane-label gutter (design .lab-rowlabs / .lab-rowlab) — overlaid on the left,
   outside the horizontal scroll so it stays put; vertically aligned with lanes
   (top 41 = .va-tracks margin-top; 48px rows + 6 gap match the lanes). */
/* Opaque gutter background masks segments that scroll left under the labels
   (design .lab-rowlabs uses the same trick), so a lane never shows through the
   label column. Sits below the ruler (top 41), so negative ticks stay visible. */
.va-rowlabs{position:absolute;left:0;top:41px;z-index:5;display:flex;flex-direction:column;gap:3px;
  background:var(--va-bg)}
.va-rowlab{position:relative;height:48px;display:flex;align-items:center;background:var(--va-bg)}
.va-root .va-rowlab-btn{flex:1;min-width:0;height:100%;display:flex;align-items:center;padding:0 6px 0 2px;
  border:0;border-radius:0;background:none;text-align:left;cursor:pointer;overflow:hidden;
  font-family:var(--f-mono, ui-monospace, Menlo, monospace);font-size:8px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--va-muted);opacity:.5;transition:opacity 140ms ease, color 140ms ease}
.va-root .va-rowlab-btn:hover{opacity:1;color:var(--va-text);background:none}
.va-rowlab.on .va-rowlab-btn{opacity:1;color:var(--va-accent)}
.va-rowlab-txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* Remove-track entry — configurable, hover-revealed on the lane label. */
.va-root .va-rowlab-x{position:absolute;right:0;top:3px;width:14px;height:14px;padding:0;border:0;border-radius:4px;
  background:transparent;color:var(--va-muted);display:none;align-items:center;justify-content:center;cursor:pointer}
.va-rowlab:hover .va-rowlab-x{display:inline-flex}
.va-root .va-rowlab-x:hover{color:var(--va-text);background:color-mix(in srgb, var(--va-text) 8%, transparent)}
.va-rowlab-x svg{width:11px;height:11px}
/* Add-track affordance: a thin hover zone below the last lane. On hover a
   highlighted line fades in with a round "+" node at its left end, inviting a
   new lane — no permanent full-width button. */
.va-addrow{position:relative;height:12px;cursor:pointer}
.va-addrow-line{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%) scaleX(0);transform-origin:left center;
  height:2px;border-radius:1px;
  background:linear-gradient(90deg, var(--va-accent), color-mix(in srgb, var(--va-accent) 10%, transparent));
  opacity:0;transition:opacity .2s ease, transform .3s cubic-bezier(.22,.61,.36,1)}
.va-addrow-btn{position:absolute;left:0;top:50%;transform:translate(-50%,-50%) scale(.85);width:18px;height:18px;border-radius:50%;
  background:var(--va-panel2);color:var(--va-muted);border:1px solid var(--va-line);
  display:inline-flex;align-items:center;justify-content:center;opacity:.5;
  transition:opacity .18s ease, transform .22s cubic-bezier(.34,1.56,.64,1), background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease}
.va-addrow:hover .va-addrow-line{opacity:1;transform:translateY(-50%) scaleX(1)}
.va-addrow:hover .va-addrow-btn{opacity:1;transform:translate(-50%,-50%) scale(1);
  background:var(--va-accent);color:#fff;border-color:transparent;box-shadow:0 1px 5px var(--va-shadow)}
.va-addrow-btn svg{width:12px;height:12px}
/* Segment cells (design .lab-cell): rounded, soft ink-tint fill, a mono index
   above a 2-line f-ui caption. Hover = quiet accent ring; selected = accent tint
   + accent ring; edited = green ring (outranks selection); resegmented = purple
   ring. All color-mix / accent-tinted, so light + dark read from the same rules. */
.va-seg{position:absolute;top:0;bottom:0;border-radius:6px;padding:5px 6px;overflow:hidden;
  background:color-mix(in srgb, var(--va-text) 4%, var(--va-bg));box-shadow:none;
  display:flex;flex-direction:column;gap:2px;
  transition:background .12s ease, box-shadow .12s ease}
/* Adjacent segments tile edge-to-edge; a 1px pure-bg inset on every segment
   after the first fakes a hairline gap between them (design .lab-cell +
   .lab-cell). It's an inset shadow, not real spacing, so the hover/selected/
   edited rings below simply replace it and fill the gap with no layout shift. */
.va-seg + .va-seg{box-shadow:inset 1px 0 0 var(--va-bg)}
.va-seg:hover{background:color-mix(in srgb, var(--va-text) 8%, var(--va-bg));
  box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--va-accent) 45%, transparent)}
/* .sel = the active lane's selected segment; .cur = the segment under the
   playhead in any other SELECTED lane — same full accent. */
.va-seg.sel,.va-seg.cur{background:color-mix(in srgb, var(--va-accent) 14%, var(--va-bg));
  box-shadow:inset 0 0 0 1.5px var(--va-accent);z-index:3}
/* Edited / resegmented both get the green ring, which outranks hover + selection
   (the app's structural-edit "reseg" reads as an edit here, per design). */
.va-seg.edited,.va-seg.reseg,.va-seg.edited.sel,.va-seg.reseg.sel,.va-seg.edited.cur,.va-seg.reseg.cur{box-shadow:inset 0 0 0 1.5px var(--va-edit)}
.va-seg-line{display:flex;align-items:baseline;gap:4px;min-width:0}
.va-seg-n{flex:none;font-size:9px;line-height:1.25;opacity:.7;color:var(--va-muted);
  font-family:var(--f-mono, ui-monospace, Menlo, monospace)}
.va-seg.edited .va-seg-n,.va-seg.reseg .va-seg-n{color:var(--va-edit);opacity:1}
.va-seglabel{flex:1;min-width:0;font-size:10px;line-height:1.2;color:var(--va-text);opacity:.75;
  font-family:var(--f-ui, "Inter Tight", ui-sans-serif, system-ui, sans-serif);
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:break-word}
/* Segment hover tooltip (design .lab-tip--wide): a fixed chip (portaled to
   <body>, so no lane overflow clips it) — mono muted label, wrapped caption, and
   a struck-through "was:" line for edited cells. */
.va-celltip{position:fixed;transform:translateX(-50%);z-index:4000;max-width:420px;
  padding:4px 8px;border-radius:6px;background:var(--bg, #fffefb);color:var(--ink, #1a1a1a);
  box-shadow:0 3px 10px rgba(0,0,0,.10), 0 0 0 1px color-mix(in srgb, var(--ink, #1a1a1a) 10%, transparent);
  font:11px/1.3 var(--f-ui, "Inter Tight", ui-sans-serif, system-ui, sans-serif);
  white-space:normal;pointer-events:none;display:flex;flex-direction:column;gap:2px}
.va-celltip b{font-family:var(--f-mono, ui-monospace, Menlo, monospace);font-weight:500;
  color:var(--uikit-muted, #6b6b6b)}
.va-celltip-was{font-style:normal;color:var(--uikit-muted, #6b6b6b);opacity:.7;text-decoration:line-through}
.va-handle{position:absolute;top:0;bottom:0;width:9px;margin-left:-5px;cursor:ew-resize;z-index:5}
.va-handle::after{content:"";position:absolute;left:4px;top:0;bottom:0;width:1.5px;background:var(--va-accent);opacity:0}
.va-handle:hover::after{opacity:1}
.va-playhead{position:absolute;top:22px;bottom:0;width:1.5px;background:var(--va-accent);pointer-events:none;z-index:6}
.va-hoverline{position:absolute;top:22px;bottom:0;width:1.5px;
  background:color-mix(in srgb, var(--va-accent) 50%, transparent);pointer-events:none;z-index:5}
.va-hovertime{position:absolute;top:20px;transform:translateX(4px);
  background:var(--va-accent);color:#fff;
  padding:2px 6px;border-radius:4px;white-space:nowrap;pointer-events:none;z-index:7;
  font-family:var(--f-mono, ui-monospace, Menlo, monospace);font-size:11px;line-height:1.3;
  box-shadow:0 8px 24px var(--va-shadow)}
/* Portaled variant (rendered on <body>, outside .va-root) — the va-scoped vars
   don't resolve there, so use the global uikit tokens with hard fallbacks. */
.va-hovertime--fixed{
  background:var(--uikit-accent, #23aaff);color:#fff;z-index:1000;
  box-shadow:0 8px 24px rgba(0,0,0,.18)}
/* Timeline hover: a blue speech bubble sitting over an internal boundary (a cut
   between two phases) holding an X that merges those two phases. It renders
   INSIDE the active lane (vertical position set inline from the active track
   index) so the scroll viewport's overflow-y:hidden never clips it. Scoped
   under .va-timeline to beat the base .va-root button reset. */
@keyframes va-merge-in{from{opacity:0;transform:translateX(-50%) scale(.9)}
  to{opacity:1;transform:translateX(-50%) scale(1)}}
.va-timeline .va-merge{position:absolute;transform:translateX(-50%);z-index:8;
  width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;
  background:var(--va-accent);color:#fff;border:2px solid var(--va-bg);border-radius:999px;cursor:pointer;
  box-shadow:0 2px 8px var(--va-shadow);animation:va-merge-in .15s ease-out}
/* Keep the centring transform on press — the base button:active rule would
   otherwise replace it with translateY() alone and shove the button right. */
.va-timeline .va-merge:active{transform:translateX(-50%) translateY(1px)}
.va-timeline .va-merge:hover{background:color-mix(in srgb,#000 14%,var(--va-accent))}
.va-timeline .va-merge svg{width:13px;height:13px}
/* Three-tier ruler (major / minor / micro) — ported 1:1 from the shared
   episode-timeline DLDetailRuler. A faint strip with a bottom hairline; ticks
   grow UP from that baseline, tiered by height/width/ink-alpha; major + minor
   carry mono labels (bold ink / muted residual). */
.va-ticks{position:absolute;left:0;right:0;top:0;height:32px;pointer-events:none;z-index:4;overflow:hidden;
  background:color-mix(in oklab, var(--va-text) 2.5%, transparent);
  border-radius:4px;
  border-bottom:1px solid color-mix(in srgb, var(--va-text) 8%, transparent)}
.va-tick{position:absolute;top:0;height:32px;pointer-events:none}
.va-tickmark{position:absolute;left:0;bottom:0;transform:translateX(-50%);
  transition:height 200ms ease, width 200ms ease, background 200ms ease}
.va-tick--major .va-tickmark{width:1.5px;height:12px;background:color-mix(in srgb, var(--va-text) 55%, transparent)}
.va-tick--minor .va-tickmark{width:1px;height:7px;background:color-mix(in srgb, var(--va-text) 28%, transparent)}
.va-tick--micro .va-tickmark{width:1px;height:3px;background:color-mix(in srgb, var(--va-text) 14%, transparent)}
.va-ticklabel{position:absolute;left:0;transform:translateX(-50%);white-space:nowrap;line-height:1;
  font-family:var(--f-mono, ui-monospace, Menlo, monospace);font-variant-numeric:tabular-nums;
  transition:opacity 200ms ease}
.va-ticklabel--major{top:2px;padding:0 4px;font-size:10.5px;font-weight:700;letter-spacing:.01em;
  color:color-mix(in srgb, var(--va-text) 78%, transparent)}
.va-ticklabel--minor{top:4px;padding:0 2px;font-size:8.5px;font-weight:500;letter-spacing:.02em;
  color:color-mix(in srgb, var(--va-text) 42%, transparent)}
.va-tick.start .va-ticklabel{transform:translateX(0)}
.va-tick.end .va-ticklabel{transform:translateX(-100%)}

/* Description + meta framed as one card; the textarea is borderless inside it
   so there's a single frame, and the meta row sits in the same box (separated
   by whitespace, no divider). Focus lifts the whole frame's border. */
.va-desc{display:flex;flex-direction:column;gap:8px;flex:none;
  background:var(--va-field);border:1px solid var(--va-line);border-radius:var(--va-radius);padding:9px}
.va-desc:focus-within{border-color:var(--va-accent)}
.va-desc-box{width:100%;min-height:60px;resize:vertical;background:transparent;color:var(--va-text);
  border:0;padding:0;font:13px/1.45 inherit}
.va-desc-box:focus{outline:none}
.va-desc-meta{display:flex;gap:12px;color:var(--va-muted);
  font:11px var(--f-mono, ui-monospace, Menlo, monospace)}
.va-desc-meta > span:first-child{width:72px;flex:none}

.va-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--va-panel);
  border:1px solid var(--va-line);border-radius:var(--va-radius);padding:8px 14px;color:var(--va-text);
  box-shadow:0 8px 24px var(--va-shadow);z-index:50}
`;
