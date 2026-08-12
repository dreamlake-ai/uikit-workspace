import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Scissors,
  ArrowLeftToLine,
  Hand,
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

/**
 * The control bar under the video: time readout + speed on the left, the
 * centered playback cluster (prev/next segment / frame step / play), and edit
 * controls on the right (split, merge, hand-pose toggle).
 */
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
  return (
    <div className="va-transport">
      <div className="va-tp-left">
        <span className="va-readout">{readout}</span>
        <SpeedMenu rate={rate} speeds={speeds} onPick={onSpeed} />
      </div>

      <div className="va-tp-center">
        <TipButton
          className="va-icon"
          label="Prev segment (,)"
          onClick={() => goSeg(sel - 1)}
          disabled={sel <= 0}
        >
          <SkipBackSharp size={15} />
        </TipButton>
        <TipButton className="va-icon" label="Prev frame (←)" onClick={() => stepFrame(-1, false)}>
          <ChevronLeft size={15} strokeWidth={1.8} />
        </TipButton>
        <TipButton className="va-icon va-play" label="Play/Pause (Space)" onClick={togglePlay}>
          {playing ? <PauseSharp size={18} /> : <PlaySharp size={18} />}
        </TipButton>
        <TipButton className="va-icon" label="Next frame (→)" onClick={() => stepFrame(1, false)}>
          <ChevronRight size={15} strokeWidth={1.8} />
        </TipButton>
        <TipButton
          className="va-icon"
          label="Next segment (.)"
          onClick={() => goSeg(sel + 1)}
          disabled={sel >= segCount - 1}
        >
          <SkipForwardSharp size={15} />
        </TipButton>
      </div>

      <div className="va-tp-right">
        <TipButton className="va-icon" label="Split at playhead (S)" onClick={doSplit}>
          <Scissors size={15} strokeWidth={1.8} />
        </TipButton>
        <TipButton
          className="va-icon"
          label="Merge into previous (Backspace)"
          onClick={() => doMerge(sel)}
          disabled={sel <= 0}
        >
          <ArrowLeftToLine size={15} strokeWidth={1.8} />
        </TipButton>
        {hasHandpose && (
          // While the pose blob is still loading, show the Hand in its active
          // (on) state but disabled — no spinner icon.
          <TipButton
            className={cn("va-icon va-hands", showHands && "on")}
            label={handsLoading ? "Loading hand pose…" : showHands ? "Hide hand pose" : "Show hand pose"}
            onClick={onToggleHands}
            disabled={handsLoading}
          >
            <Hand size={15} strokeWidth={1.8} />
          </TipButton>
        )}
        {transportExtra}
      </div>
    </div>
  );
}
