import { Droplet } from "lucide-react";

/** A zero-height overlay: refresh activity alone never displays a pull affordance. */
export function PullRefreshDroplet({
  distance,
  refreshing,
}: {
  distance: number;
  refreshing: boolean;
}) {
  const progress = Math.min(1, Math.max(0, distance / 64));
  return (
    <div className="uikit-pull-refresh" data-pull-refresh>
      <span role="status" className="uikit-pull-refresh-status">
        {refreshing
          ? "Refreshing…"
          : distance >= 64
            ? "Release to refresh"
            : distance > 0
              ? "Pull to refresh"
              : ""}
      </span>
      <span
        className="uikit-pull-refresh-drop"
        data-pulling={distance > 0 || undefined}
        data-armed={distance >= 64 || undefined}
        aria-hidden="true"
        style={{
          opacity: progress,
          transform: `translate(-50%, ${-10 + progress * 26}px) scale(${0.65 + progress * 0.35}, ${0.6 + progress * 0.5})`,
        }}
      >
        <Droplet size={26} strokeWidth={1.7} />
      </span>
      <style>{`
        .uikit-pull-refresh{position:sticky;top:0;height:0;z-index:20;pointer-events:none}
        .uikit-pull-refresh-drop{position:absolute;left:50%;top:0;display:inline-flex;color:var(--uikit-accent,currentColor);transform-origin:center top;transition:transform 420ms cubic-bezier(.22,1.45,.36,1),opacity 220ms ease-out;will-change:transform,opacity}
        .uikit-pull-refresh-drop[data-pulling]{transition:transform 80ms ease-out,opacity 80ms linear}
        .uikit-pull-refresh-drop svg{fill:color-mix(in srgb,currentColor 12%,transparent)}
        .uikit-pull-refresh-drop[data-armed] svg{fill:color-mix(in srgb,currentColor 24%,transparent)}
        .uikit-pull-refresh-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        @media(prefers-reduced-motion:reduce){.uikit-pull-refresh-drop,.uikit-pull-refresh-drop[data-pulling]{transition:none;will-change:auto}}
      `}</style>
    </div>
  );
}
