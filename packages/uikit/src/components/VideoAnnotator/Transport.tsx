import {
  ChevronLeft,
  ChevronRight,
  Scissors,
  ArrowLeftToLine,
  Hand,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Spinner } from "../Spinner";
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
  zoom,
  onStepZoom,
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
  zoom: number;
  onStepZoom: (dir: number) => void;
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
          <SkipBackSharp size={14} />
        </TipButton>
        <TipButton className="va-icon" label="Prev frame (←)" onClick={() => stepFrame(-1, false)}>
          <ChevronLeft size={14} />
        </TipButton>
        <TipButton className="va-icon va-play" label="Play/Pause (Space)" onClick={togglePlay}>
          {playing ? <PauseSharp size={14} /> : <PlaySharp size={14} />}
        </TipButton>
        <TipButton className="va-icon" label="Next frame (→)" onClick={() => stepFrame(1, false)}>
          <ChevronRight size={14} />
        </TipButton>
        <TipButton
          className="va-icon"
          label="Next segment (.)"
          onClick={() => goSeg(sel + 1)}
          disabled={sel >= segCount - 1}
        >
          <SkipForwardSharp size={14} />
        </TipButton>
      </div>

      <div className="va-tp-right">
        <TipButton className="va-icon" label="Split at playhead (S)" onClick={doSplit}>
          <Scissors size={14} />
        </TipButton>
        <TipButton
          className="va-icon"
          label="Merge into previous (Backspace)"
          onClick={() => doMerge(sel)}
          disabled={sel <= 0}
        >
          <ArrowLeftToLine size={14} />
        </TipButton>
        {hasHandpose && (
          <TipButton
            className={cn("va-icon va-hands", showHands && "on")}
            label={handsLoading ? "Loading hand pose…" : showHands ? "Hide hand pose" : "Show hand pose"}
            onClick={onToggleHands}
          >
            {handsLoading ? <Spinner size={14} style={{ color: "currentColor" }} /> : <Hand size={14} />}
          </TipButton>
        )}
        {/* Timeline zoom: −/N×/+, de-crowds a dense timeline (1→16×). */}
        <span className="va-zoom">
          <TipButton className="va-icon va-zoombtn" label="Zoom out" onClick={() => onStepZoom(-1)} disabled={zoom <= 1}>
            <Minus size={13} />
          </TipButton>
          <span className="va-zoomval">{zoom}×</span>
          <TipButton className="va-icon va-zoombtn" label="Zoom in" onClick={() => onStepZoom(1)} disabled={zoom >= 16}>
            <Plus size={13} />
          </TipButton>
        </span>
      </div>
    </div>
  );
}
