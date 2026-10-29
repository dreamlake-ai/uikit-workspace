import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../DropdownMenu/DropdownMenu";

/** Playback-speed dropdown, on the kit DropdownMenu: the kit menu surface and
 *  elevation (right in both themes), the trigger-facing wedge, the fold open and
 *  closed, one travelling hover, arrow-key navigation and Escape / outside-click
 *  closing. The current rate carries a check. */
export function SpeedMenu({
  rate,
  speeds,
  onPick,
}: {
  rate: number;
  speeds: number[];
  onPick: (v: number) => void;
}) {
  return (
    <div className="va-speedsel" data-va-measure="speed">
      <DropdownMenu side="top" align="start">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="va-speedbtn"
            aria-label="Playback speed"
          >
            <span>{rate}×</span>
            <ChevronDown size={12} className="va-caret" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="va-speedmenu"
          aria-label="Playback speed"
        >
          {speeds.map((v) => (
            <DropdownMenuItem
              key={v}
              role="menuitemradio"
              aria-checked={v === rate}
              data-selected={v === rate || undefined}
              onSelect={() => onPick(v)}
            >
              <span className="va-speedcheck" aria-hidden>
                {v === rate && <Check size={12} />}
              </span>
              {v}×
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
