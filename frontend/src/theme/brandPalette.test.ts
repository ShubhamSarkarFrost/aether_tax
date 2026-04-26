import { describe, it, expect } from "vitest";

/** Documents the Aether / Accenture-style palette used in inline styles and Tailwind accents. */
const BRAND_PALETTE = [
  "#dc6900",
  "#eb8c00",
  "#e0301e",
  "#a32020",
  "#602320",
] as const;

describe("brand palette (design contract)", () => {
  it("keeps the five core hex tokens", () => {
    expect(BRAND_PALETTE).toHaveLength(5);
  });
});
