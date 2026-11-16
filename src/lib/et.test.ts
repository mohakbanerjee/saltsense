/** Tests for FAO-56 ET math. */
import { describe, expect, it } from "vitest";
import { computeETc, mmToLiters } from "./et";

describe("computeETc", () => {
  it("ETc = ET0 × Kc for date palm mid", () => {
    expect(computeETc(5, "date_palm")).toBeCloseTo(5 * 0.95, 5);
  });

  it("ETc for tomato mid", () => {
    expect(computeETc(4, "tomato")).toBeCloseTo(4 * 1.15, 5);
  });

  it("rejects negative ET0", () => {
    expect(() => computeETc(-1, "lettuce")).toThrow();
  });
});

describe("mmToLiters", () => {
  it("1 mm over 1 m² is 1 L", () => {
    expect(mmToLiters(1, 1)).toBe(1);
  });
});
