/** Shared document-tab presentation; each existing component retains its controller.
 * --uikit-document-surface is the panel body colour, defaulting to the chat's --bg.
 * Strip/inactive/hover/action colours can be overridden on a containing element.
 * Native selection scrolling reserves the same gutter as the curved feet.
 * Sticky end controls belong to their original tab (no cloned close target).
 * Inactive fills are inset inside the same tab box so labels and controls do
 * not move vertically when selection changes. Hosts may tune the inset
 * without changing the shared hit targets.
 */
export const documentTabStyles = `
.uikit-document-tab-strip{background:var(--uikit-document-strip-surface,var(--uikit-workspace-bg));padding-inline:8px;scroll-padding-inline:8px;border:0;box-shadow:none}
.uikit-document-tab{--uikit-tab-fill:var(--uikit-document-inactive-bg,var(--uikit-document-strip-surface,var(--uikit-workspace-bg)));--uikit-tab-line:var(--faint);position:relative;z-index:1;box-sizing:border-box;min-height:26px;overflow:visible;border:1px solid transparent;border-bottom:0;border-radius:6px;background:transparent;color:var(--uikit-muted);transition:color 120ms ease}
.uikit-document-tab[data-active]{--uikit-tab-fill:var(--uikit-document-surface,var(--bg));z-index:3;border-radius:8px 8px 0 0;background:linear-gradient(var(--uikit-tab-fill),var(--uikit-tab-fill)) padding-box,linear-gradient(to bottom,var(--uikit-tab-line) calc(100% - 8px),var(--uikit-tab-fill) 0) border-box;color:var(--ink)}
.uikit-document-tab:not([data-active]):hover{--uikit-tab-fill:var(--uikit-document-hover-bg,color-mix(in srgb,var(--ink) 4%,var(--uikit-document-strip-surface,var(--uikit-workspace-bg))))}
.uikit-document-tab:not([data-active])::before{content:"";position:absolute;inset:calc(var(--uikit-document-inactive-inset,2px) - 1px) 0 var(--uikit-document-inactive-inset,2px);z-index:-1;border-radius:6px;background:var(--uikit-tab-fill);pointer-events:none}
.uikit-document-tab[data-active]::before,.uikit-document-tab[data-active]::after{content:"";position:absolute;bottom:0;width:8px;height:8px;pointer-events:none;background:radial-gradient(circle at var(--uikit-tab-curve-origin) 0,transparent 7.25px,var(--uikit-tab-line) 7.5px,var(--uikit-tab-line) 8px,var(--uikit-tab-fill) 8.25px)}
.uikit-document-tab[data-active]::before{right:100%;--uikit-tab-curve-origin:0%}
.uikit-document-tab[data-active]::after{left:100%;--uikit-tab-curve-origin:100%}
.uikit-document-tab:not([data-active]):not(:last-child):not(:hover):not(:has(+ .uikit-document-tab:is([data-active],:hover)))::after{content:"";position:absolute;right:-2px;top:50%;width:1px;height:12px;transform:translateY(-50%);background:var(--faint);pointer-events:none}
.uikit-document-tab-label{font-family:var(--font-uikit-mono,monospace);font-size:11px;line-height:14px;font-weight:500;letter-spacing:-.005em;padding:4px 4px 4px 8px}
.uikit-document-tab:not(:has(> .uikit-document-tab-end:not(:empty))) > .uikit-document-tab-label{padding-right:8px}
.uikit-document-tab[data-active] .uikit-document-tab-label{font-weight:600}
.uikit-document-tab-end{position:sticky;right:0;z-index:2;display:inline-flex;align-items:center;flex:0 0 auto;gap:4px;align-self:stretch;background:var(--uikit-tab-fill);border-radius:0 7px 0 0;padding:2px 4px 2px 2px}
.uikit-document-tab:not([data-active]) .uikit-document-tab-end{border-radius:0 6px 6px 0;background:transparent}
.uikit-document-tab:not([data-active]) .uikit-document-tab-end::before{content:"";position:absolute;inset:calc(var(--uikit-document-inactive-inset,2px) - 1px) 0 var(--uikit-document-inactive-inset,2px);z-index:-1;border-radius:inherit;background:var(--uikit-tab-fill);pointer-events:none}
.uikit-document-tab-action{background:var(--uikit-document-action-bg,color-mix(in srgb,var(--ink) 3%,var(--uikit-document-strip-surface,var(--uikit-workspace-bg))));box-shadow:none;align-self:flex-start;margin-top:0}
.uikit-document-tab-action:hover{background:var(--uikit-document-action-hover-bg,color-mix(in srgb,var(--ink) 8%,var(--uikit-document-strip-surface,var(--uikit-workspace-bg))))}
.uikit-document-tab-end:empty{display:none}
.uikit-document-tab-close{display:inline-flex;align-self:center;align-items:center;justify-content:center;flex:0 0 16px;width:16px;height:16px;box-sizing:border-box;border:0;border-radius:4px;padding:0;background:transparent;color:var(--uikit-muted);opacity:.65;cursor:pointer}
.uikit-document-tab-close:hover{opacity:1;color:oklch(59% .18 25);background:color-mix(in srgb,var(--ink) 5%,transparent)}
.uikit-document-tab:focus-visible,.uikit-document-tab-label:focus-visible,.uikit-document-tab-close:focus-visible{outline:2px solid var(--uikit-accent);outline-offset:-2px}
@media(prefers-reduced-motion:reduce){.uikit-document-tab{transition:none}}
`;
