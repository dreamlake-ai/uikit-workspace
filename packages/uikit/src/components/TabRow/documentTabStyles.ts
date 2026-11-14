/** Shared document-tab presentation; each existing component retains its controller.
 * --uikit-document-surface is the panel body colour, defaulting to the chat's --bg.
 * Sticky end controls belong to their original tab (no cloned close target).
 */
export const documentTabStyles = `
.uikit-document-tab-strip{background:var(--panel-bg,var(--bg));padding-inline:8px}
.uikit-document-tab{--uikit-tab-fill:color-mix(in srgb,var(--ink) 6%,var(--uikit-document-surface,var(--bg)));--uikit-tab-line:var(--faint);position:relative;z-index:1;overflow:visible;border:1px solid transparent;border-bottom:0;border-radius:8px 8px 0 0;background:linear-gradient(var(--uikit-tab-fill),var(--uikit-tab-fill)) padding-box,linear-gradient(to bottom,var(--uikit-tab-line) calc(100% - 8px),var(--uikit-tab-fill) 0) border-box;color:var(--uikit-muted);transition:color 120ms ease}
.uikit-document-tab[data-active]{--uikit-tab-fill:var(--uikit-document-surface,var(--bg));z-index:3;color:var(--ink)}
.uikit-document-tab:not([data-active]):hover{--uikit-tab-fill:color-mix(in srgb,var(--ink) 9%,var(--uikit-document-surface,var(--bg)))}
.uikit-document-tab::before,.uikit-document-tab::after{content:"";position:absolute;bottom:0;width:8px;height:8px;pointer-events:none;background:radial-gradient(circle at var(--uikit-tab-curve-origin) 0,transparent 7.25px,var(--uikit-tab-line) 7.5px,var(--uikit-tab-line) 8px,var(--uikit-tab-fill) 8.25px)}
.uikit-document-tab::before{right:100%;--uikit-tab-curve-origin:0%}
.uikit-document-tab::after{left:100%;--uikit-tab-curve-origin:100%}
.uikit-document-tab-label{font-family:var(--font-uikit-mono,monospace);font-size:11px;line-height:14px;font-weight:500;letter-spacing:-.005em}
.uikit-document-tab[data-active] .uikit-document-tab-label{font-weight:600}
.uikit-document-tab-end{position:sticky;right:0;z-index:2;display:inline-flex;align-items:center;flex:0 0 auto;gap:4px;align-self:stretch;background:var(--uikit-tab-fill);border-radius:0 7px 0 0;padding-inline:4px}
.uikit-document-tab-end:empty{display:none}
.uikit-document-tab-close{display:inline-flex;align-self:center;align-items:center;justify-content:center;flex:0 0 16px;width:16px;height:16px;box-sizing:border-box;border:0;border-radius:4px;padding:0;background:transparent;color:var(--uikit-muted);opacity:.65;cursor:pointer}
.uikit-document-tab-close:hover{opacity:1;color:oklch(59% .18 25);background:color-mix(in srgb,var(--ink) 5%,transparent)}
.uikit-document-tab:focus-visible,.uikit-document-tab-label:focus-visible,.uikit-document-tab-close:focus-visible{outline:2px solid var(--uikit-accent);outline-offset:-2px}
@media(prefers-reduced-motion:reduce){.uikit-document-tab{transition:none}}
`;
