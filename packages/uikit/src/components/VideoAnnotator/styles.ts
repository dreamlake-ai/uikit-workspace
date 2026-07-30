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
  --va-danger: var(--tone-red, #c8513b);
  --va-idle: var(--tone-warm-gray, #9c907a);
  --va-selected: var(--selected-bg, #f5f3ee);
  --va-radius: var(--radius, 10px);
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
  padding:6px 0;text-align:left;flex:none;width:162px;white-space:nowrap}
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
  background:var(--va-panel);border:1px solid var(--va-line);border-radius:10px;
  box-shadow:0 8px 24px var(--va-shadow);padding:4px}
.va-speedmenu button{width:100%;display:flex;align-items:center;gap:6px;white-space:nowrap;height:auto;
  background:transparent;border:none;border-radius:6px;padding:5px 12px 5px 22px;
  font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-text);text-align:left;position:relative}
.va-speedmenu button:hover{background:var(--va-panel2)}
.va-speedmenu button[aria-selected="true"]{color:var(--va-accent)}
.va-speedcheck{position:absolute;left:6px}

.va-tlwrap{display:flex;flex:none;margin-top:-2px}
.va-tlwrap.multi{gap:8px}
.va-tlwrap .va-timeline{flex:1;min-width:0}
.va-timeline{position:relative;min-height:62px;background:transparent;cursor:pointer;user-select:none}
.va-timeline:not(:has(.va-seg))::before{content:"";position:absolute;top:30px;bottom:0;left:0;right:0;
  border-radius:6px;background:color-mix(in srgb, var(--va-text) 4%, transparent);box-shadow:inset 0 0 0 1px var(--va-line)}
/* Stacked track lanes below the ruler. Each row hosts its segments (and, for
   the active row, the drag handles); rows flow so the timeline grows with the
   track count. */
.va-tracks{margin-top:30px;display:flex;flex-direction:column;gap:6px}
.va-track{position:relative;height:32px}
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
.va-seg{position:absolute;top:0;bottom:0;border-radius:6px;display:flex;align-items:center;
  padding:0 9px;overflow:hidden;background:var(--va-panel2);box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg:hover{background:#edf6fc;box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg.sel{background:#edf6fc;box-shadow:inset 0 0 0 1.5px #23a9ff;z-index:3}
.va-seg.sel .va-seglabel{color:#1a1a1a}
/* Dark mode swaps the blue selection/hover accent for yellow. The fill is a
   translucent amber tint so the dark surface reads through it; the label
   flips to light ink to stay legible over that dark-tinted fill. */
html[data-theme="dark"] .va-seg:hover{background:rgba(243,230,204,.14)}
html[data-theme="dark"] .va-seg.sel{background:rgba(243,230,204,.2);box-shadow:inset 0 0 0 1.5px var(--va-warn)}
html[data-theme="dark"] .va-seg:hover .va-seglabel,
html[data-theme="dark"] .va-seg.sel .va-seglabel{color:var(--va-text)}
.va-seglabel{font-size:11px;color:var(--va-muted);font-weight:400;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.va-seg:hover .va-seglabel{color:#1a1a1a}
.va-handle{position:absolute;top:0;bottom:0;width:9px;margin-left:-5px;cursor:ew-resize;z-index:5}
.va-handle::after{content:"";position:absolute;left:4px;top:0;bottom:0;width:1.5px;background:var(--va-accent);opacity:0}
.va-handle:hover::after{opacity:1}
.va-playhead{position:absolute;top:14px;bottom:0;width:1.5px;background:var(--va-accent);pointer-events:none;z-index:6}
.va-hoverline{position:absolute;top:14px;bottom:0;width:1.5px;
  background:color-mix(in srgb, var(--va-accent) 50%, transparent);pointer-events:none;z-index:5}
.va-hovertime{position:absolute;top:12px;transform:translateX(4px);
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
   between two phases) holding an X that merges those two phases. It's a child of
   the timeline and its tail bridges down into the boundary, so moving the cursor
   up to click never trips the timeline's mouseleave. Scoped under .va-timeline
   to beat the base .va-root button reset. */
@keyframes va-merge-in{from{opacity:0;transform:translateX(-50%) translateY(4px) scale(.92)}
  to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.va-timeline .va-merge{position:absolute;bottom:100%;transform:translateX(-50%);z-index:8;
  width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;padding:0;
  background:var(--va-accent);color:#fff;border:0;border-radius:999px;cursor:pointer;
  box-shadow:0 4px 12px var(--va-shadow);animation:va-merge-in .18s ease-out}
.va-timeline .va-merge::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);
  width:0;height:0;border:5px solid transparent;border-top-color:var(--va-accent)}
/* Keep the centring transform on press — the base button:active rule would
   otherwise replace it with translateY() alone and shove the button right. */
.va-timeline .va-merge:active{transform:translateX(-50%) translateY(1px)}
.va-timeline .va-merge:hover{background:color-mix(in srgb,#000 14%,var(--va-accent))}
.va-timeline .va-merge:hover::after{border-top-color:color-mix(in srgb,#000 14%,var(--va-accent))}
.va-timeline .va-merge svg{width:14px;height:14px}
.va-ticks{position:absolute;left:0;right:0;top:0;height:24px;pointer-events:none;z-index:4}
.va-ticks::before{content:"";position:absolute;left:0;right:0;top:22px;height:1px;background:var(--va-line)}
.va-tick{position:absolute;top:0;height:24px;pointer-events:none}
.va-tick::before{content:"";position:absolute;top:17px;left:0;width:1px;height:5px;background:var(--va-line)}
.va-tick.major::before{top:14px;height:8px;background:var(--va-muted)}
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
