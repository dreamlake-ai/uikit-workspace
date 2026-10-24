/**
 * The corner (or edge) a dropdown-like panel unfolds from: the one nearest its
 * trigger, read off the RESOLVED placement so a flipped panel unfolds from the
 * side it actually opened on. `bottom-start` (under the trigger, left edges
 * aligned) unrolls top-left → bottom-right; `top-end` bottom-right → top-left;
 * a centred placement grows from that edge's middle.
 *
 * Feeds `data-unfold` on a `.uikit-panel-in` panel; styles.css maps each value
 * to the clip-path the reveal starts from and the matching transform-origin.
 */
export type UnfoldFrom = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";

export function unfoldFrom(placement: string): UnfoldFrom {
  const [side, align] = placement.split("-") as [string, string | undefined];
  switch (side) {
    case "bottom":
      return align === "start" ? "tl" : align === "end" ? "tr" : "t";
    case "top":
      return align === "start" ? "bl" : align === "end" ? "br" : "b";
    case "right":
      return align === "start" ? "tl" : align === "end" ? "bl" : "l";
    case "left":
      return align === "start" ? "tr" : align === "end" ? "br" : "r";
    default:
      return "t";
  }
}
