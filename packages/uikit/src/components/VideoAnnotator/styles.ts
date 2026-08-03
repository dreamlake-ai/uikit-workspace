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
  /* Popover/tooltip drop shadow. Aliases the kit's theme-aware shadow token
     so it stays dark in dark mode — not a white glow off the light ink. */
  --va-shadow: var(--shadow-tint-2, rgba(0,0,0,.1));
  --va-hover: color-mix(in srgb, var(--va-text) 5%, var(--va-panel));
  /* Own stacking context so the timeline/tooltip/menu z-indexes (up to 60) stay
     contained and can't paint over a host's sticky header when scrolled. */
  isolation:isolate;
  display:flex; flex-direction:column; gap:12px; min-width:0; min-height:0; height:100%;
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
/* Buffering spinner overlay — centered over the video, never intercepts clicks
   (so click-to-play still works underneath). */
.va-buffering{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:3}
/* Hand-pose overlay canvas: absolutely positioned by JS to sit exactly over the
   letterboxed video content. Never intercepts pointer events. */
.va-overlay{position:absolute;left:0;top:0;pointer-events:none;z-index:2}

/* 3-column grid with equal side tracks keeps the playback cluster on the true
   horizontal center — aligned with the centered video above — regardless of
   how wide the readout/speed (left) vs split/extract (right) groups are. */
.va-transport{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);
  align-items:center;gap:20px;flex:none;margin-top:-2px}
.va-tp-left,.va-tp-right{display:flex;align-items:center;gap:6px;min-width:0}
.va-tp-right{justify-content:flex-end}
.va-tp-center{display:flex;align-items:center;gap:6px;flex:none}
.va-transport button{height:28px}
/* Transport controls read as real buttons: resting panel fill + hairline,
   not bare icons. Scoped under .va-transport so they beat the base
   .va-root button transparent-background rule. */
.va-transport .va-icon{width:28px;height:28px;padding:0;justify-content:center;border-radius:999px;
  background:transparent;border:1px solid var(--va-line);
  color:color-mix(in srgb, var(--va-text) 75%, var(--va-muted))}
/* Neutral outline + glyph at rest; both turn accent-blue on hover. */
.va-transport .va-icon:hover{background:transparent;border-color:var(--va-accent);color:var(--va-accent)}
/* Hand-pose toggle: reads as a checkbox — filled accent when ON, neutral OFF. */
.va-transport .va-hands.on{border-color:var(--va-accent);color:var(--va-accent);
  background:color-mix(in srgb, var(--va-accent) 14%, transparent)}
.va-transport .va-hands.on:hover{background:color-mix(in srgb, var(--va-accent) 20%, transparent)}
.va-icon svg{flex:none}
.va-root svg{stroke-linejoin:round;stroke-linecap:round}

.va-readout{font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-muted);
  padding:6px 0;text-align:left;flex:none;width:176px;white-space:nowrap}
.va-speedsel{position:relative;display:inline-flex}
.va-speedsel .va-speedbtn{display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 6px 0 9px;
  background:var(--va-panel);color:var(--va-text);border:1px solid transparent;border-radius:var(--va-radius);cursor:pointer;
  font:11px var(--f-mono, ui-monospace, Menlo, monospace)}
.va-speedbtn .va-caret{color:var(--va-muted)}
.va-speedbtn:hover{background:var(--va-panel2)}
/* No press-shift on the speed button — the base button:active translate reads
   as jitter here next to the readout. */
.va-speedsel .va-speedbtn:active{transform:none}
.va-speedsel.open .va-speedbtn{border-color:var(--va-accent)}
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
.va-tlwrap{position:relative;display:flex;flex:none;margin-top:13.5px}
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
.va-zoom{display:inline-flex;align-items:center;gap:0;padding:2px 3px;border-radius:6px;
  background:var(--va-panel);border:1px solid color-mix(in srgb, var(--va-text) 12%, transparent);
  box-shadow:0 3px 10px var(--va-shadow), 0 1px 2px var(--va-shadow);
  font:11px var(--f-mono, ui-monospace, Menlo, monospace);user-select:none;-webkit-user-select:none}
/* ‹ / › ghost steppers. 2-class selectors beat the base .va-root button rules. */
.va-zoom .va-zoombtn{width:20px;height:20px;min-width:20px;padding:0;
  display:inline-flex;align-items:center;justify-content:center;
  border:0;border-radius:5px;background:transparent;color:var(--va-text);cursor:pointer;
  transition:background-color .12s ease}
.va-zoom .va-zoombtn:hover{background:color-mix(in srgb, var(--va-text) 8%, transparent)}
.va-zoom .va-zoombtn:active{transform:none}
.va-zoom .va-zoombtn:disabled{opacity:.35;cursor:default}
.va-zoom .va-zoombtn:disabled:hover{background:transparent}
.va-zoom .va-zoombtn svg{flex:none}
/* Draggable value: bold number + small muted ×. Fixed min-width keeps the ‹ / ›
   from shifting as the value's width changes; touch-action:none lets pointer
   capture own the gesture on touch. */
.va-zoomdrag{display:inline-flex;align-items:center;justify-content:center;gap:2px;line-height:1;
  height:20px;min-width:56px;padding:0 6px;border-radius:5px;
  cursor:ew-resize;user-select:none;-webkit-user-select:none;touch-action:none;outline:none;
  transition:background-color .12s ease}
.va-zoomdrag:hover{background:color-mix(in srgb, var(--va-text) 5%, transparent)}
.va-zoomdrag.on{cursor:grabbing;background:color-mix(in srgb, var(--va-text) 8%, transparent)}
.va-zoomnum{font:11px var(--f-mono, ui-monospace, Menlo, monospace);font-weight:700;
  letter-spacing:-0.01em;font-variant-numeric:tabular-nums;color:var(--va-text)}
.va-zoomx{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;
  color:color-mix(in srgb, var(--va-text) 55%, transparent)}
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
.va-tracks{margin-top:41px;display:flex;flex-direction:column;gap:6px}
.va-track{position:relative;height:48px}
.va-track.inactive{opacity:.55}
.va-track.inactive .va-seg:hover{background:var(--va-panel2);box-shadow:inset 0 0 0 1px var(--va-line)}
html[data-theme="dark"] .va-track.inactive .va-seg:hover{background:var(--va-panel2)}
.va-track.inactive .va-seg:hover .va-seglabel{color:var(--va-muted)}
/* Left gutter of track headers (multi-track only). A 30px spacer aligns the
   first header with the first lane (below the ruler). */
.va-track-heads{flex:none;width:104px;display:flex;flex-direction:column;gap:6px}
.va-th-spacer{height:24px;flex:none}
.va-th{height:32px;display:flex;align-items:center;gap:4px;padding:0 8px;border-radius:6px;cursor:pointer;
  color:var(--va-muted);font:11px var(--f-ui, "Inter Tight", ui-sans-serif, system-ui, sans-serif);overflow:hidden}
.va-th:hover{background:var(--va-panel2)}
.va-th.active{color:var(--va-text);background:var(--va-panel2)}
.va-th-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.va-root .va-th-input{flex:1;min-width:0;height:20px;padding:0 5px;border-radius:4px;
  border:1px solid var(--va-accent);background:var(--va-bg);color:var(--va-text);
  font:11px var(--f-ui, "Inter Tight", ui-sans-serif, system-ui, sans-serif);outline:none}
.va-root .va-th-x{width:18px;height:18px;padding:0;border:0;background:transparent;color:var(--va-muted);
  display:none;align-items:center;justify-content:center;border-radius:4px;cursor:pointer;flex:none}
.va-th:hover .va-th-x{display:inline-flex}
.va-root .va-th-x:hover{color:var(--va-text);background:transparent}
.va-th-x svg{width:12px;height:12px}
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
.va-seg{position:absolute;top:0;bottom:0;border-radius:0;
  padding:4px 3px;overflow:hidden;background:var(--va-panel2);box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg:hover{background:#edf6fc;box-shadow:inset 0 0 0 1px var(--va-line)}
/* Edited segments get an amber border (host sets Segment.edited on a caption or
   structural change). Higher specificity than :hover so hover keeps it; the .sel
   rule below is declared after, so a selected segment's accent border wins. */
.va-seg.edited{box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--va-warn) 40%, transparent)}
/* Resegmented (split / merge / retime) — a purple border, distinct from both the
   amber "edited" border and the blue selection border. Declared before .sel so a
   selected chip's accent border still wins. */
.va-seg.reseg{box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--va-reseg) 55%, transparent)}
.va-seg.sel{background:#edf6fc;box-shadow:inset 0 0 0 1.5px #23a9ff;z-index:3}
.va-seg.sel .va-seglabel{color:#1a1a1a}
/* Dark mode uses the same blue accent as light for hover/selection (a
   translucent accent tint so the dark surface reads through); the label flips to
   light ink to stay legible over the tinted fill. */
html[data-theme="dark"] .va-seg:hover{background:color-mix(in srgb, var(--va-accent) 14%, transparent)}
html[data-theme="dark"] .va-seg.sel{background:color-mix(in srgb, var(--va-accent) 20%, transparent);box-shadow:inset 0 0 0 1.5px var(--va-accent)}
html[data-theme="dark"] .va-seg:hover .va-seglabel,
html[data-theme="dark"] .va-seg.sel .va-seglabel{color:var(--va-text)}
.va-seglabel{font-size:9px;line-height:1.3;color:var(--va-muted);font-weight:400;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:break-word}
.va-seg:hover .va-seglabel{color:#1a1a1a}
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
.va-ticks{position:absolute;left:0;right:0;top:0;height:34px;pointer-events:none;z-index:4}
.va-ticks::before{content:"";position:absolute;left:0;right:0;top:32px;height:1px;background:var(--va-line)}
.va-tick{position:absolute;top:0;height:34px;pointer-events:none}
.va-tick::before{content:"";position:absolute;top:26px;left:0;width:1px;height:6px;background:var(--va-line)}
.va-tick.major::before{top:22px;height:10px;background:var(--va-muted)}
.va-ticklabel{position:absolute;top:1px;left:0;transform:translateX(-50%);white-space:nowrap;
  font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-muted);line-height:1}
.va-tick.major .va-ticklabel{font-weight:600;color:color-mix(in srgb, var(--va-text) 55%, var(--va-muted))}
.va-tick.start .va-ticklabel{transform:translateX(0)}
.va-tick.end .va-ticklabel{left:auto;right:0;transform:translateX(0)}

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
