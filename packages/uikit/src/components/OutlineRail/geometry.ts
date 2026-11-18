/** Map a document coordinate between headings to a fractional outline index.
 * The final boundary is the end of the document, after its last section. */
export function outlinePosition(
  boundaries: number[],
  coordinate: number,
): number {
  if (!boundaries.length || coordinate <= boundaries[0]) return 0;
  let lo = 1,
    hi = boundaries.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (coordinate < boundaries[mid]) hi = mid;
    else lo = mid + 1;
  }
  if (lo === boundaries.length) return boundaries.length - 1;
  return (
    lo -
    1 +
    (coordinate - boundaries[lo - 1]) / (boundaries[lo] - boundaries[lo - 1])
  );
}

type Point = { x: number; y: number; index: number };

/** Cache short pieces of the outline rail instead of walking the whole SVG path
 * for every animation frame. The rendered path and native curve geometry stay
 * unchanged; only distance lookup is indexed by heading. */
export function createOutlineRailGeometry(paths: string[], points: Point[]) {
  let total = 0;
  const lengths = new Map<number, number>();
  if (points[0]) lengths.set(points[0].index, 0);
  const segments = paths.map((d, index) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    const start = total;
    total += path.getTotalLength();
    lengths.set(points[index + 1].index, total);
    return { path, start, end: total };
  });
  return {
    total,
    lengthAt(index: number) {
      return lengths.get(index) ?? 0;
    },
    positionAt(index: number) {
      if (!points.length || index <= points[0].index) return 0;
      for (let i = 1; i < points.length; i++) {
        if (index <= points[i].index) {
          const previous = points[i - 1];
          const start = lengths.get(previous.index) ?? 0;
          const end = lengths.get(points[i].index) ?? start;
          return (
            start +
            ((index - previous.index) / (points[i].index - previous.index)) *
              (end - start)
          );
        }
      }
      return total;
    },
    pointAt(distance: number) {
      if (!segments.length) return points[0] ?? { x: 0, y: 0 };
      const length = Math.max(0, Math.min(total, distance));
      let lo = 0,
        hi = segments.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (segments[mid].end < length) lo = mid + 1;
        else hi = mid;
      }
      const segment = segments[lo];
      return segment.path.getPointAtLength(length - segment.start);
    },
  };
}
