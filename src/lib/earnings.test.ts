import { describe, it, expect } from "vitest";
import { summarize } from "./earnings";

describe("summarize earnings", () => {
  it("computes net and net-per-hour", () => {
    const s = summarize([
      { id: "1", date: "", platform: "Swiggy", earned: 1200, expenses: 200, hours: 8 },
      { id: "2", date: "", platform: "Uber", earned: 800, expenses: 300, hours: 2 },
    ]);
    expect(s.net).toBe(1500);
    expect(s.perHour).toBe(150);
  });
  it("returns 0 per hour with no hours", () => {
    expect(summarize([]).perHour).toBe(0);
  });
});
