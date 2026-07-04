import { describe, it, expect } from "vitest";
import { generateStarterName } from "./starter-name";

describe("generateStarterName", () => {
  it("produces a URL-safe adjective-animal pair that matches the endpoint name rule", () => {
    const name = generateStarterName(() => 0);
    expect(name).toMatch(/^[a-z]+-[a-z]+$/);
    // must satisfy the endpoint-name validation regex used across the app
    expect(name).toMatch(/^[a-zA-Z0-9_-]*$/);
  });

  it("selects the first words at r=0 and the last at r≈1 (index clamped)", () => {
    expect(generateStarterName(() => 0)).toBe("swift-otter");
    expect(generateStarterName(() => 0.9999)).toBe("zesty-yak");
  });

  it("is deterministic for a given RNG sequence", () => {
    const run = () => {
      const seq = [0.1, 0.5];
      let i = 0;
      return generateStarterName(() => seq[i++ % seq.length]);
    };
    expect(run()).toBe(run());
  });
});
