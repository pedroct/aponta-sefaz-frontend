import { describe, it, expect } from "vitest";
import {
  formatIterationDateRange,
  groupIterationsByTimeFrame,
  type Iteration,
} from "./iteration-types";

const makeIteration = (overrides: Partial<Iteration>): Iteration => ({
  id: "id",
  name: "Sprint",
  path: null,
  url: null,
  attributes: {
    start_date: null,
    finish_date: null,
    time_frame: null,
  },
  ...overrides,
});

describe("iteration-types", () => {
  it("formats date range when dates exist", () => {
    const range = formatIterationDateRange(
      "2025-01-02T12:00:00Z",
      "2025-01-15T12:00:00Z"
    );
    expect(range).toBe("(02/01 - 15/01)");
  });

  it("returns empty string when dates are missing", () => {
    expect(formatIterationDateRange(null, "2025-01-15")).toBe("");
    expect(formatIterationDateRange("2025-01-02", null)).toBe("");
  });

  it("groups iterations by time frame and sorts correctly", () => {
    const iterations: Iteration[] = [
      makeIteration({
        id: "past-1",
        attributes: { time_frame: "past", start_date: "2025-01-01", finish_date: null },
      }),
      makeIteration({
        id: "past-2",
        attributes: { time_frame: "past", start_date: "2025-02-01", finish_date: null },
      }),
      makeIteration({
        id: "future-1",
        attributes: { time_frame: "future", start_date: "2025-04-01", finish_date: null },
      }),
      makeIteration({
        id: "future-2",
        attributes: { time_frame: "future", start_date: "2025-03-01", finish_date: null },
      }),
      makeIteration({
        id: "current",
        attributes: { time_frame: "current", start_date: "2025-02-15", finish_date: null },
      }),
    ];

    const grouped = groupIterationsByTimeFrame(iterations);

    expect(grouped.current?.id).toBe("current");
    expect(grouped.future.map((it) => it.id)).toEqual(["future-2", "future-1"]);
    expect(grouped.past.map((it) => it.id)).toEqual(["past-2", "past-1"]);
  });
});
