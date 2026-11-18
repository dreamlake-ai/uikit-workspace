import { describe, expect, it } from "vitest";
import { outlinePosition } from "./geometry";

describe("viewport positions between document headings", () => {
  it("uses both edges inside a long section, including the final section", () => {
    const boundaries = [100, 300, 1300, 2300];
    expect(outlinePosition(boundaries, 500)).toBe(1.2);
    expect(outlinePosition(boundaries, 1000)).toBe(1.7);
    expect(outlinePosition(boundaries, 1800)).toBe(2.5);
  });
  it("clamps document edges and skips zero-height sections without NaN", () => {
    expect(outlinePosition([100, 100, 300], 200)).toBe(1.5);
    expect(outlinePosition([100, 300], 0)).toBe(0);
    expect(outlinePosition([100, 300], 400)).toBe(1);
    expect(outlinePosition([], 20)).toBe(0);
  });
});
