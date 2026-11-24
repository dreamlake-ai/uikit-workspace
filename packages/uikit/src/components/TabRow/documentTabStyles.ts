/** Shared document-tab presentation; each existing component retains its controller.
 * --uikit-document-surface is the panel body colour, defaulting to the chat's --bg.
 * Strip/inactive/hover/action colours can be overridden on a containing element.
 * Borderless faces, 8px shoulders and balanced close controls are shared by
 * list headings, standalone rows and docked groups on every host page.
 * Native selection scrolling preserves the established strip gutter.
 * The strip owns the 8px gutter; a sticky left inset would apply it twice.
 * Inactive tabs stack in document order; the active tab and its controls stay above them.
 * Rounded opaque faces cover earlier labels without a square backing.
 * Sticky end controls belong to their original tab (no cloned close target).
 * Inactive fills are inset inside the same tab box so labels and controls do
 * not move vertically when selection changes. Hosts may tune the inset
 * without changing the shared hit targets.
 */
export const documentTabStyles = `
.uikit-document-tab-strip{background:var(--uikit-document-strip-surface,var(--uikit-workspace-bg));padding-inline:8px;scroll-padding-inline:8px;scrollbar-width:none;scrollbar-gutter:auto;border:0;box-shadow:none}
[data-document-tab-edge="flush"] .uikit-document-tab-strip{padding-left:0;scroll-padding-left:0}
[data-document-tab-edge="flush"] .uikit-document-tab:first-child[data-active]{border-top-left-radius:8px;border-bottom-left-radius:0}
[data-document-tab-edge="flush"] .uikit-document-tab:first-child[data-active]::before{display:none}
.uikit-document-tab-strip::-webkit-scrollbar{display:none;width:0;height:0}
.uikit-document-tab{--uikit-document-subtle-gradient:linear-gradient(to bottom,color-mix(in srgb,var(--ink) 8%,var(--uikit-tab-fill)),var(--uikit-tab-fill));--uikit-tab-fill:var(--uikit-document-inactive-bg,var(--uikit-document-strip-surface,var(--uikit-workspace-bg)));--uikit-tab-line:transparent;position:sticky;left:0;z-index:1;box-sizing:border-box;min-height:var(--uikit-document-tab-height,26px);overflow:visible;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--uikit-muted);transition:color 120ms ease}
.uikit-document-tab[data-active]{--uikit-tab-fill:var(--uikit-document-surface,var(--bg));z-index:3;border-radius:8px 8px 0 0;border-bottom-width:0;padding-bottom:1px;background:var(--uikit-tab-fill);background-image:var(--uikit-document-active-gradient,none);color:var(--ink)}
.uikit-document-tab:not([data-active]):hover{--uikit-tab-fill:var(--uikit-document-hover-bg,color-mix(in srgb,var(--ink) 4%,var(--uikit-document-strip-surface,var(--uikit-workspace-bg))))}
.uikit-document-tab:not([data-active])::before{content:"";position:absolute;inset:calc(var(--uikit-document-inactive-inset,2px) - 1px) 0;z-index:-1;border-radius:6px;background:linear-gradient(var(--uikit-tab-fill),var(--uikit-tab-fill)),var(--uikit-document-stack-surface,var(--uikit-document-strip-surface,var(--uikit-workspace-bg)));pointer-events:none}
.uikit-document-tab[data-active]::before,.uikit-document-tab[data-active]::after{content:"";position:absolute;bottom:-1px;width:8px;height:8px;pointer-events:none;background:radial-gradient(circle at var(--uikit-tab-curve-origin) 0,transparent 7.25px,var(--uikit-tab-line) 7.5px,var(--uikit-tab-line) 8px,var(--uikit-tab-fill) 8.25px)}
.uikit-document-tab[data-active]::before{right:100%;--uikit-tab-curve-origin:0%}
.uikit-document-tab[data-active]::after{left:100%;--uikit-tab-curve-origin:100%}
.uikit-document-tab:not([data-active]):has(+ .uikit-document-tab:not([data-active]))::after{content:"";position:absolute;right:-2px;top:50%;width:1px;height:12px;transform:translateY(-50%);background:var(--faint);pointer-events:none}
.uikit-document-tab-label{font-family:var(--font-uikit-mono,monospace);font-size:11px;line-height:14px;font-weight:500;letter-spacing:-.005em;padding:4px 4px 4px 8px}
.uikit-document-tab-label:not(:has(.uikit-tab-row-item-icon,svg:not(button svg),img)){padding-left:12px}
.uikit-document-tab > span.uikit-document-tab-label{align-self:stretch;padding-block:0}
.uikit-document-tab:not(:has(> .uikit-document-tab-end:not(:empty))) > .uikit-document-tab-label{padding-right:8px}
.uikit-document-tab[data-active] .uikit-document-tab-label{font-weight:600}
.uikit-document-tab-end{position:sticky;right:0;z-index:2;display:inline-flex;align-items:center;flex:0 0 auto;gap:4px;align-self:stretch;background:var(--uikit-tab-fill);border-radius:0 7px 0 0;padding:0 calc((var(--uikit-document-tab-height,26px) - 16px) / 2 - 1px) 0 2px}
.uikit-document-tab[data-active] .uikit-document-tab-end{background-image:var(--uikit-document-active-gradient,none)}
.uikit-document-tab:not([data-active]) .uikit-document-tab-end{border-radius:0 6px 6px 0;background:transparent}
.uikit-document-tab:not([data-active]) .uikit-document-tab-end::before{content:"";position:absolute;inset:calc(var(--uikit-document-inactive-inset,2px) - 1px) 0;z-index:-1;border-radius:inherit;background:linear-gradient(var(--uikit-tab-fill),var(--uikit-tab-fill)),var(--uikit-document-stack-surface,var(--uikit-document-strip-surface,var(--uikit-workspace-bg)));pointer-events:none}
.uikit-document-tab-action{background:var(--uikit-document-action-bg,transparent);box-shadow:none;box-sizing:border-box;height:var(--uikit-document-control-height,22px);min-height:0;min-width:0;width:var(--uikit-document-control-height,22px);padding:0;border:0;border-radius:6px;align-self:center;margin:0}
.uikit-document-tab-action:is(:hover,:focus-visible){background:var(--uikit-document-action-hover-bg,color-mix(in srgb,var(--ink) 8%,var(--uikit-document-strip-surface,var(--uikit-workspace-bg))))}
.uikit-document-tab-end:empty{display:none}
.uikit-document-tab-close{display:inline-flex;align-self:center;align-items:center;justify-content:center;flex:0 0 16px;width:16px;height:16px;box-sizing:border-box;border:0;border-radius:4px;padding:0;background:transparent;color:var(--uikit-muted);opacity:.65;cursor:pointer}
.uikit-document-tab-close:hover{opacity:1;color:oklch(59% .18 25);background:color-mix(in srgb,var(--ink) 5%,transparent)}
.uikit-document-tab:focus-visible,.uikit-document-tab-label:focus-visible,.uikit-document-tab-close:focus-visible{outline:2px solid var(--uikit-accent);outline-offset:-2px}
@media(prefers-reduced-motion:reduce){.uikit-document-tab{transition:none}}
`;
