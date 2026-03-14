import { describe, expect, it } from "vitest";
import { parseReadinessThresholdSeconds } from "@/lib/server/readiness-threshold";

describe("parseReadinessThresholdSeconds", () => {
  it("uses default for invalid values", () => {
    expect(parseReadinessThresholdSeconds(undefined)).toBe(5);
    expect(parseReadinessThresholdSeconds("")).toBe(5);
    expect(parseReadinessThresholdSeconds("   ")).toBe(5);
    expect(parseReadinessThresholdSeconds("NaN")).toBe(5);
    expect(parseReadinessThresholdSeconds("Infinity")).toBe(5);
    expect(parseReadinessThresholdSeconds("-Infinity")).toBe(5);
    expect(parseReadinessThresholdSeconds("-1")).toBe(5);
  });

  it("uses default for non-integer values", () => {
    expect(parseReadinessThresholdSeconds("0.5")).toBe(5);
    expect(parseReadinessThresholdSeconds("5.1")).toBe(5);
  });

  it("accepts non-negative integer values", () => {
    expect(parseReadinessThresholdSeconds("0")).toBe(0);
    expect(parseReadinessThresholdSeconds("5")).toBe(5);
    expect(parseReadinessThresholdSeconds("30")).toBe(30);
  });
});
