import { describe, it, expect } from "vitest";
import {
  ok,
  created,
  fail,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
} from "@/lib/http";

describe("http helpers", () => {
  it("ok/created set the right status and echo the body", async () => {
    const okRes = ok({ a: 1 });
    expect(okRes.status).toBe(200);
    expect(await okRes.json()).toEqual({ a: 1 });

    const createdRes = created({ id: "x" });
    expect(createdRes.status).toBe(201);
  });

  it("fail emits { error, ...extra } with the given status", async () => {
    const res = fail("nope", 422, { code: "E_VALIDATION" });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "nope", code: "E_VALIDATION" });
  });

  it("named error helpers map to conventional status codes", () => {
    expect(badRequest().status).toBe(400);
    expect(unauthorized().status).toBe(401);
    expect(forbidden().status).toBe(403);
    expect(notFound().status).toBe(404);
    expect(tooManyRequests().status).toBe(429);
  });
});
