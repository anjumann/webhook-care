import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelative, isRecent } from "./utils";

// Anchor "now" so relative math is deterministic.
const NOW = new Date("2026-06-11T12:00:00.000Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const ago = (ms: number) => new Date(NOW - ms);
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelative", () => {
  it("returns 'just now' for very recent or future timestamps", () => {
    expect(formatRelative(ago(0))).toBe("just now");
    expect(formatRelative(ago(20 * SEC))).toBe("just now");
    expect(formatRelative(new Date(NOW + 5 * MIN))).toBe("just now");
  });

  it("formats minutes, hours and days", () => {
    expect(formatRelative(ago(5 * MIN))).toBe("5m ago");
    expect(formatRelative(ago(3 * HOUR))).toBe("3h ago");
    expect(formatRelative(ago(2 * DAY))).toBe("2d ago");
  });

  it("falls back to an absolute date past ~30 days", () => {
    const out = formatRelative(ago(40 * DAY));
    expect(out).not.toMatch(/ago|just now/);
    expect(out.length).toBeGreaterThan(0);
  });

  it("returns '—' for an invalid date", () => {
    expect(formatRelative(new Date("not-a-date"))).toBe("—");
  });
});

describe("isRecent", () => {
  it("is true within the window and false outside it", () => {
    expect(isRecent(ago(1 * MIN))).toBe(true);
    expect(isRecent(ago(4 * MIN))).toBe(true);
    expect(isRecent(ago(10 * MIN))).toBe(false);
  });

  it("respects a custom window and rejects invalid dates", () => {
    expect(isRecent(ago(30 * SEC), 10 * SEC)).toBe(false);
    expect(isRecent(ago(5 * SEC), 10 * SEC)).toBe(true);
    expect(isRecent(new Date("nope"))).toBe(false);
  });
});
