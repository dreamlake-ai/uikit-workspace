import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Scissors,
  ArrowLeftToLine,
  Hand,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  TipButton,
  PlaySharp,
  PauseSharp,
  SkipBackSharp,
  SkipForwardSharp,
} from "./icons";
import { SpeedMenu } from "./SpeedMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../DropdownMenu/DropdownMenu";

/**
 * The control bar under the video: time readout + speed on the left, the
 * centered playback cluster (prev/next segment / frame step / play), and edit
 * controls on the right (split, merge, hand-pose toggle).
 *
 * It is always ONE row. As the player narrows it gives things up in order,
 * instead of wrapping (a second row pushed the timeline down and split the
 * controls from each other):
 *   1. the time readout hides once it would push the playback cluster off
 *      the centre under the video (the "⋯" menu repeats it later, and the
 *      timeline's playhead still says where you are);
 *   2. speed, merge and the hand-pose toggle fold into one "⋯" menu, which
 *      also repeats the readout at its top;
 *   3. frame step joins them (← / → still step);
 *   4. segment prev / next join them too (, / . still jump).
 * Play / pause, split and "⋯" never fold. The level is chosen from the bar's
 * OWN width (ResizeObserver), not the viewport's: a labeling view beside an
 * episode list is narrow on a wide screen.
 */
type Level = 0 | 1 | 2 | 3 | 4;
const GROUP_GAP = 10; // .va-transport column-gap
const ITEM_GAP = 8; // gap inside each group
const ICON = 30; // .va-icon
const PLAY = 36; // .va-icon.va-play

/** Width the bar needs at `level`, from measured item widths. */
function needed(
  level: Level,
  w: Record<string, number>,
  hasHandpose: boolean,
): number {
  const sum = (items: number[]) =>
    items.length
      ? items.reduce((a, b) => a + b, 0) + ITEM_GAP * (items.length - 1)
      : 0;
  const left: number[] = [];
  if (level < 1) left.push(w.readout ?? 176);
  if (level < 2) left.push(w.speed ?? 40);
  const center: number[] = [];
  if (level < 4) center.push(ICON);
  if (level < 3) center.push(ICON);
  center.push(PLAY);
  if (level < 3) center.push(ICON);
  if (level < 4) center.push(ICON);
  const right: number[] = [ICON]; // split
  if (level < 2) {
    right.push(ICON); // merge
    if (hasHandpose) right.push(ICON);
  }
  if (w.extra) right.push(w.extra);
  if (level >= 2) right.push(ICON); // ⋯
  const [l, c, r] = [sum(left), sum(center), sum(right)];
  // With the readout showing, the cluster must sit on the true centre (under
  // the centered video): both sides take the wider side's width. Past that the
  // readout is what goes; once it has, a few px off-centre is fine.
  if (level === 0) return 2 * Math.max(l, r) + c + 2 * GROUP_GAP;
  const groups = [l, c, r].filter((g) => g > 0);
  return groups.reduce((a, b) => a + b, 0) + GROUP_GAP * (groups.length - 1);
}

function useTransportLevel(hasHandpose: boolean) {
  const root = useRef<HTMLDivElement>(null);
  const widths = useRef<Record<string, number>>({});
  const [level, setLevel] = useState<Level>(0);
  const pick = () => {
    const el = root.current;
    // Until the annotator's stylesheet applies, nothing has its real size
    // (an unstyled speed menu measured the whole row): wait for it.
    if (!el || getComputedStyle(el).display !== "flex") return;
    // Remember what is on screen now; hidden items keep their last width.
    for (const item of el.querySelectorAll<HTMLElement>("[data-va-measure]")) {
      const r = item.getBoundingClientRect();
      if (r.width > 0) widths.current[item.dataset.vaMeasure!] = r.width;
    }
    if (!el.querySelector('[data-va-measure="extra"]'))
      delete widths.current.extra;
    const avail = el.clientWidth;
    let next: Level = 4;
    for (const l of [0, 1, 2, 3] as Level[])
      if (needed(l, widths.current, hasHandpose) <= avail + 0.5) {
        next = l;
        break;
      }
    setLevel((prev) => (prev === next ? prev : next));
  };
  useLayoutEffect(pick);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => pick());
    ro.observe(el);
    return () => ro.disconnect();
  }); // re-bound each render so `pick` sees current props
  return { root, level };
}

export function Transport({
  readout,
  rate,
  speeds,
  onSpeed,
  playing,
  togglePlay,
  stepFrame,
  goSeg,
  sel,
  segCount,
  doSplit,
  doMerge,
  hasHandpose,
  showHands,
  handsLoading,
  onToggleHands,
  transportExtra,
}: {
  readout: string;
  rate: number;
  speeds: number[];
  onSpeed: (v: number) => void;
  playing: boolean;
  togglePlay: () => void;
  stepFrame: (dir: number, big?: boolean) => void;
  goSeg: (index: number) => void;
  sel: number;
  segCount: number;
  doSplit: () => void;
  doMerge: (index: number) => void;
  hasHandpose: boolean;
  showHands: boolean;
  handsLoading?: boolean;
  onToggleHands: () => void;
  transportExtra?: ReactNode;
}) {
  const { root, level } = useTransportLevel(hasHandpose);
  const folded = level >= 2;
  return (
    <div className="va-transport" ref={root} data-level={level}>
      <div className="va-tp-left">
        {level < 1 && (
          <span className="va-readout" data-va-measure="readout">
            {readout}
          </span>
        )}
        {level < 2 && (
          <SpeedMenu rate={rate} speeds={speeds} onPick={onSpeed} />
        )}
      </div>

      <div className="va-tp-center">
        {level < 4 && (
          <TipButton
            className="va-icon"
            label="Prev segment (,)"
            onClick={() => goSeg(sel - 1)}
            disabled={sel <= 0}
          >
            <SkipBackSharp size={15} />
          </TipButton>
        )}
        {level < 3 && (
          <TipButton
            className="va-icon"
            label="Prev frame (←)"
            onClick={() => stepFrame(-1, false)}
          >
            <ChevronLeft size={15} strokeWidth={1.8} />
          </TipButton>
        )}
        <TipButton
          className="va-icon va-play"
          label="Play/Pause (Space)"
          onClick={togglePlay}
        >
          {playing ? <PauseSharp size={18} /> : <PlaySharp size={18} />}
        </TipButton>
        {level < 3 && (
          <TipButton
            className="va-icon"
            label="Next frame (→)"
            onClick={() => stepFrame(1, false)}
          >
            <ChevronRight size={15} strokeWidth={1.8} />
          </TipButton>
        )}
        {level < 4 && (
          <TipButton
            className="va-icon"
            label="Next segment (.)"
            onClick={() => goSeg(sel + 1)}
            disabled={sel >= segCount - 1}
          >
            <SkipForwardSharp size={15} />
          </TipButton>
        )}
      </div>

      <div className="va-tp-right">
        <TipButton
          className="va-icon"
          label="Split at playhead (S)"
          onClick={doSplit}
        >
          <Scissors size={15} strokeWidth={1.8} />
        </TipButton>
        {!folded && (
          <TipButton
            className="va-icon"
            label="Merge into previous (Backspace)"
            onClick={() => doMerge(sel)}
            disabled={sel <= 0}
          >
            <ArrowLeftToLine size={15} strokeWidth={1.8} />
          </TipButton>
        )}
        {!folded && hasHandpose && (
          // While the pose blob is still loading, show the Hand in its active
          // (on) state but disabled — no spinner icon.
          <TipButton
            className={cn("va-icon va-hands", showHands && "on")}
            label={
              handsLoading
                ? "Loading hand pose…"
                : showHands
                  ? "Hide hand pose"
                  : "Show hand pose"
            }
            onClick={onToggleHands}
            disabled={handsLoading}
          >
            <Hand size={15} strokeWidth={1.8} />
          </TipButton>
        )}
        {transportExtra != null && (
          <span className="va-extrawrap" data-va-measure="extra">
            {transportExtra}
          </span>
        )}
        {folded && (
          <DropdownMenu side="top" align="end">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="va-icon va-more"
                aria-label="More controls"
              >
                <MoreHorizontal size={15} strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="va-moremenu">
              <DropdownMenuLabel className="va-moremenu-readout">
                {readout}
              </DropdownMenuLabel>
              {level >= 4 && (
                <>
                  <DropdownMenuItem
                    disabled={sel <= 0}
                    onSelect={() => goSeg(sel - 1)}
                  >
                    <SkipBackSharp size={13} /> Prev segment
                    <span className="va-moremenu-key">,</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={sel >= segCount - 1}
                    onSelect={() => goSeg(sel + 1)}
                  >
                    <SkipForwardSharp size={13} /> Next segment
                    <span className="va-moremenu-key">.</span>
                  </DropdownMenuItem>
                </>
              )}
              {level >= 3 && (
                <>
                  <DropdownMenuItem onSelect={() => stepFrame(-1, false)}>
                    <ChevronLeft size={13} strokeWidth={1.8} /> Prev frame
                    <span className="va-moremenu-key">←</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => stepFrame(1, false)}>
                    <ChevronRight size={13} strokeWidth={1.8} /> Next frame
                    <span className="va-moremenu-key">→</span>
                  </DropdownMenuItem>
                </>
              )}
              {level >= 3 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                disabled={sel <= 0}
                onSelect={() => doMerge(sel)}
              >
                <ArrowLeftToLine size={13} strokeWidth={1.8} /> Merge into
                previous
                <span className="va-moremenu-key">⌫</span>
              </DropdownMenuItem>
              {hasHandpose && (
                <DropdownMenuItem
                  disabled={handsLoading}
                  onSelect={onToggleHands}
                >
                  <Hand size={13} strokeWidth={1.8} />
                  {handsLoading
                    ? "Loading hand pose…"
                    : showHands
                      ? "Hide hand pose"
                      : "Show hand pose"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Speed</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={String(rate)}
                onValueChange={(v) => onSpeed(Number(v))}
              >
                {speeds.map((v) => (
                  <DropdownMenuRadioItem key={v} value={String(v)}>
                    {v}×
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
