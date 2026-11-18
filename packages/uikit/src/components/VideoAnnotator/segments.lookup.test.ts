import { describe, expect, it } from "vitest";
import { normalizeSegments, segmentIndexAtTime } from "./segments";

describe("segment lookup", () => {
  it("preserves boundary tolerance, duplicates, out-of-range and empty behavior", () => {
    const segs = normalizeSegments(
      [0, 1, 1, 3, 9].map((start) => ({ start, end: start + 1, description: "", verified: false })),
      10
    );
    for (const t of [-1, 0, 1 - 2e-6, 1 - 1e-7, 1, 2, 3, 9, 10, 100, NaN]) {
      let expected = 0;
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].start <= t + 1e-6) expected = i;
        else break;
      }
      expect(segmentIndexAtTime(segs, t)).toBe(expected);
    }
    expect(segmentIndexAtTime([], 5)).toBe(0);
  });

  it("reads logarithmically many starts in a large normalized lane", () => {
    let reads = 0;
    const segs = Array.from({ length: 100000 }, (_, i) => ({
      get start() {
        reads++;
        return i;
      },
      end: i + 1,
      description: "",
      verified: false,
    }));
    expect(segmentIndexAtTime(segs, 98765.5)).toBe(98765);
    expect(reads).toBeLessThan(20);
  });
});
