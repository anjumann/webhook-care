import { describe, it, expect } from "vitest";
import { toAvatarPath } from "@/hooks/useUser";

describe("toAvatarPath", () => {
  it("prefixes a bare filename", () => {
    expect(toAvatarPath("zoro.jpg")).toBe("/avatar/zoro.jpg");
  });

  it("does not double-prefix an already-prefixed path (the original bug)", () => {
    expect(toAvatarPath("/avatar/zoro.jpg")).toBe("/avatar/zoro.jpg");
    expect(toAvatarPath("avatar/zoro.jpg")).toBe("/avatar/zoro.jpg");
  });

  it("falls back to the default avatar when undefined", () => {
    expect(toAvatarPath(undefined)).toBe("/avatar/zoro.jpg");
  });
});
