import { describe, it, expect } from "vitest";
import {
  buildClaimIdentity,
  buildExportProps,
  normalizeRestRoute,
  sanitizeEventProps,
} from "./analytics-core";

describe("buildClaimIdentity", () => {
  it("attaches email only when the claim is verified", () => {
    const verified = buildClaimIdentity({
      userId: "u_canonical",
      email: "a@b.com",
      verified: true,
    });
    expect(verified.personProps).toEqual({ is_claimed: true, email: "a@b.com" });

    const unverified = buildClaimIdentity({
      userId: "u_canonical",
      email: "a@b.com",
      verified: false,
    });
    expect(unverified.personProps).toEqual({ is_claimed: true });
    expect(unverified.personProps.email).toBeUndefined();
  });

  it("always marks is_claimed and identifies as the canonical id", () => {
    const id = buildClaimIdentity({ userId: "u_canonical", verified: true });
    expect(id.distinctId).toBe("u_canonical");
    expect(id.personProps.is_claimed).toBe(true);
  });

  it("aliases the previous anon id only when it actually differs (merge case)", () => {
    const merged = buildClaimIdentity({
      userId: "u_canonical",
      previousUserId: "u_anon",
      verified: true,
    });
    expect(merged.alias).toBe("u_anon");

    const same = buildClaimIdentity({
      userId: "u_canonical",
      previousUserId: "u_canonical",
      verified: true,
    });
    expect(same.alias).toBeUndefined();

    const none = buildClaimIdentity({ userId: "u_canonical", verified: true });
    expect(none.alias).toBeUndefined();
  });

  it("carries endpoint_count when provided and never leaks payload keys", () => {
    const id = buildClaimIdentity({
      userId: "u1",
      verified: true,
      email: "a@b.com",
      endpointCount: 3,
    });
    // person props are an allowlist — only these keys can ever appear
    expect(Object.keys(id.personProps).sort()).toEqual([
      "email",
      "endpoint_count",
      "is_claimed",
    ]);
  });
});

describe("buildExportProps", () => {
  it("uses the selected count in multi-select mode", () => {
    expect(
      buildExportProps({
        multiSelect: true,
        scope: "all",
        selectedCount: 2,
        totalCount: 5,
        redacted: true,
        format: "json",
      }),
    ).toEqual({ count: 2, redacted: true, format: "json" });
  });

  it("counts a single endpoint for scope 'this'", () => {
    expect(
      buildExportProps({
        multiSelect: false,
        scope: "this",
        selectedCount: 0,
        totalCount: 9,
        redacted: false,
        format: "csv",
      }),
    ).toEqual({ count: 1, redacted: false, format: "csv" });
  });

  it("omits count in single 'all' mode when the total is unknown (sanitized away)", () => {
    const props = buildExportProps({
      multiSelect: false,
      scope: "all",
      selectedCount: 0,
      totalCount: 0,
      redacted: true,
      format: "ndjson",
    });
    expect(props.count).toBeUndefined();
    // undefined count is dropped by the event sanitizer
    expect(sanitizeEventProps(props)).toEqual({ redacted: true, format: "ndjson" });
  });
});

describe("normalizeRestRoute", () => {
  it("masks resource ids and keeps collection templates stable", () => {
    expect(normalizeRestRoute("/api/v1/endpoints")).toBe("/api/v1/endpoints");
    expect(normalizeRestRoute("/api/v1/relay")).toBe("/api/v1/relay");
    expect(normalizeRestRoute("/api/v1/requests/507f1f77bcf86cd799439011")).toBe(
      "/api/v1/requests/:id",
    );
    expect(
      normalizeRestRoute("/api/v1/endpoints/507f1f77bcf86cd799439011/requests"),
    ).toBe("/api/v1/endpoints/:id/requests");
  });

  it("does not leak an endpoint name passed in the id position", () => {
    expect(normalizeRestRoute("/api/v1/endpoints/my-secret-name/requests")).toBe(
      "/api/v1/endpoints/:id/requests",
    );
  });
});
