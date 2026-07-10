export { VideoAnnotator } from "./VideoAnnotator";
export type { Segment, VideoAnnotatorProps, VideoAnnotatorHandle } from "./types";
export {
  normalizeSegments,
  splitAt,
  mergeInto,
  moveBoundary,
  firstUnverified,
} from "./segments";
