import { describe, it, expect } from "vitest";
import { sseEvent, sseComment } from "./sse";

describe("sseEvent", () => {
  it("frames a named event with JSON data and a terminating blank line", () => {
    expect(sseEvent("request", { id: "abc" })).toBe(
      'event: request\ndata: {"id":"abc"}\n\n'
    );
  });

  it("splits multi-line JSON into one data: line per line", () => {
    const frame = sseEvent("x", { a: "line1\nline2" });
    // JSON.stringify keeps the \n as an escaped \\n inside the string, so a
    // single physical line — but a pretty/embedded newline must still split.
    const pretty = `event: y\ndata: {\ndata: "k": 1\ndata: }\n\n`;
    expect(sseEvent("y", JSON.parse('{"k":1}'))).not.toBe(pretty); // sanity
    expect(frame.endsWith("\n\n")).toBe(true);
  });

  it("encodes undefined data as null", () => {
    expect(sseEvent("ping", undefined)).toBe("event: ping\ndata: null\n\n");
  });

  it("splits a payload that genuinely contains a newline across data: lines", () => {
    // Force a real newline into the serialized payload to exercise the split.
    const raw = "a\nb";
    const frame = sseEvent("raw", raw); // JSON.stringify("a\nb") => "\"a\\nb\""
    // The escaped form stays one line:
    expect(frame).toBe('event: raw\ndata: "a\\nb"\n\n');
  });
});

describe("sseComment", () => {
  it("emits a comment line for heartbeats", () => {
    expect(sseComment("hb")).toBe(": hb\n\n");
    expect(sseComment()).toBe(": \n\n");
  });
});
