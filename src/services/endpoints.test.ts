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
  findEndpointIdForOwner,
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

describe("findEndpointIdForOwner", () => {
  it("always scopes by userId and resolves a plain name (never casts it to an id)", async () => {
    prismaMock.endpoint.findFirst.mockResolvedValue({ id: "e1" });
    await expect(findEndpointIdForOwner("u1", "my-endpoint")).resolves.toBe("e1");

    // A non-ObjectId string must NOT be queried against the ObjectId `id` field
    // (MongoDB throws "Malformed ObjectID"); only the name branch is used.
    expect(prismaMock.endpoint.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1", OR: [{ name: "my-endpoint" }] },
      })
    );
  });

  it("matches by id too when the input is a 24-hex ObjectId", async () => {
    prismaMock.endpoint.findFirst.mockResolvedValue({ id: "507f1f77bcf86cd799439011" });
    await findEndpointIdForOwner("u1", "507f1f77bcf86cd799439011");
    expect(prismaMock.endpoint.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "u1",
          OR: [{ name: "507f1f77bcf86cd799439011" }, { id: "507f1f77bcf86cd799439011" }],
        },
      })
    );
  });

  it("returns null when nothing matches", async () => {
    prismaMock.endpoint.findFirst.mockResolvedValue(null);
    await expect(findEndpointIdForOwner("u1", "missing")).resolves.toBeNull();
  });
});
