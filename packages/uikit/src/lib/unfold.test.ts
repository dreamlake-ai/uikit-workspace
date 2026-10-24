import { describe, expect, it } from "vitest";
import { unfoldFrom } from "./unfold";

describe("unfoldFrom", () => {
  it.each([
    ["bottom-start", "tl"],
    ["bottom-end", "tr"],
    ["bottom", "t"],
    ["top-start", "bl"],
    ["top-end", "br"],
    ["top", "b"],
    ["right-start", "tl"],
    ["right-end", "bl"],
    ["right", "l"],
    ["left-start", "tr"],
    ["left-end", "br"],
    ["left", "r"],
  ])("%s unfolds from %s", (placement, corner) => {
    expect(unfoldFrom(placement)).toBe(corner);
  });
});
