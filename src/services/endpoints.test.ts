import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  endpoint: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  forwardingUrl: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  sanitizeName,
  updateEndpoint,
  isEndpointOwnedBy,
} from "@/services/endpoints";

beforeEach(() => vi.clearAllMocks());

describe("sanitizeName", () => {
  it("converts whitespace runs to single dashes", () => {
    expect(sanitizeName("my   cool endpoint")).toBe("my-cool-endpoint");
  });
  it("strips characters outside [a-zA-Z0-9_-]", () => {
    expect(sanitizeName("hello/world!@#")).toBe("helloworld");
    expect(sanitizeName("keep_these-123")).toBe("keep_these-123");
  });
  it("trims surrounding whitespace", () => {
    expect(sanitizeName("  spaced  ")).toBe("spaced");
  });
});

describe("updateEndpoint", () => {
  it("replaces forwarding URLs inside a single transaction (deleteMany + update)", async () => {
    prismaMock.forwardingUrl.deleteMany.mockReturnValue("del-op");
    prismaMock.endpoint.update.mockReturnValue("upd-op");
    prismaMock.$transaction.mockResolvedValue(["deleted", { id: "e1" }]);

    const result = await updateEndpoint("e1", {
      name: "New Name",
      forwardingUrls: [{ url: "https://x.test", method: "POST" }],
    });

    // both ops batched atomically, in order
    expect(prismaMock.$transaction).toHaveBeenCalledWith(["del-op", "upd-op"]);
    // returns the LAST op's result (the updated endpoint)
    expect(result).toEqual({ id: "e1" });
    // name is sanitized before persisting
    expect(prismaMock.endpoint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "New-Name" }),
      })
    );
  });

  it("does not touch forwarding URLs when none are provided", async () => {
    prismaMock.endpoint.update.mockReturnValue("upd-op");
    prismaMock.$transaction.mockResolvedValue([{ id: "e1" }]);

    await updateEndpoint("e1", { description: "just a desc" });

    expect(prismaMock.forwardingUrl.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).toHaveBeenCalledWith(["upd-op"]);
  });
});

describe("isEndpointOwnedBy", () => {
  it("is true only when an endpoint matches both id and userId", async () => {
    prismaMock.endpoint.findFirst.mockResolvedValue({ id: "e1" });
    await expect(isEndpointOwnedBy("e1", "u1")).resolves.toBe(true);
    expect(prismaMock.endpoint.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "e1", userId: "u1" } })
    );

    prismaMock.endpoint.findFirst.mockResolvedValue(null);
    await expect(isEndpointOwnedBy("e1", "intruder")).resolves.toBe(false);
  });
});
