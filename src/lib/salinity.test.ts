/** Tests for FAO-29 LR and yield curve. */
import { describe, expect, it } from "vitest";
import {
  expectedYieldPercent,
  leachingRequirement,
  leachingRequirementForCrop,
} from "./salinity";

describe("leachingRequirement", () => {
  it("matches FAO-29 example shape: LR = ECw / (5×ECe − ECw)", () => {
    const ecw = 2;
    const ece = 4;
    expect(leachingRequirement(ecw, ece)).toBeCloseTo(2 / (5 * 4 - 2), 5);
  });

  it("caps at 0.5 when water is too salty", () => {
    expect(leachingRequirement(10, 1.3)).toBe(0.5);
  });

  it("date palm with 2.5 dS/m water", () => {
    expect(leachingRequirementForCrop(2.5, "date_palm")).toBeCloseTo(
      2.5 / (5 * 4 - 2.5),
      5,
    );
  });
});

describe("expectedYieldPercent", () => {
  it("100% at or below threshold", () => {
    expect(expectedYieldPercent(4.0, "date_palm")).toBe(100);
    expect(expectedYieldPercent(2.0, "date_palm")).toBe(100);
  });

  it("applies slope above threshold for tomato", () => {
    // threshold 2.5, slope 9.9 → at 3.5: loss 9.9%
    expect(expectedYieldPercent(3.5, "tomato")).toBeCloseTo(100 - 9.9, 5);
  });

  it("floors at 0", () => {
    expect(expectedYieldPercent(50, "lettuce")).toBe(0);
  });
});
