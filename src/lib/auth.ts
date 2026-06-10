/**
 * Auth crypto + session-cookie primitives. Pure and dependency-light so it can
 * be unit-tested without a DB. DB-backed session/magic-link logic and the route
 * guards live in `src/services/auth.ts`.
 *
 * Two session kinds share one cookie (`wcat_session`):
 *  - `a:<signed>`  anonymous — stateless HMAC-signed `{userId, exp}`. The ULID is
 *                  the bearer credential (unchanged trust model, just HttpOnly).
 *  - `s:<token>`   verified  — opaque random token; the row lives in `Session`
 *                  so it can be revoked (magic-link login).
 */
import { createHmac, randomBytes, timingSafeEqual, createHash } from "crypto";

export const SESSION_COOKIE = "wcat_session";
export const ANON_PREFIX = "a:";
export const SESSION_PREFIX = "s:";

/** 30-day sessions (seconds). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
/** Magic links are short-lived (15 minutes, seconds). */
export const MAGIC_LINK_TTL = 60 * 15;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function hmac(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(payload).digest());
}

/** SHA-256 hex digest — used to store only hashes of opaque tokens. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** A URL-safe random opaque token (for magic links and verified sessions). */
export function randomToken(bytes = 32): string {
  return b64url(randomBytes(bytes));
}

/** Constant-time string compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Create a stateless, signed anonymous-session token.
 * @param nowMs current time in ms (injectable for tests)
 */
export function signAnonToken(
  userId: string,
  nowMs: number,
  ttlSeconds = SESSION_MAX_AGE
): string {
  const exp = Math.floor(nowMs / 1000) + ttlSeconds;
  const payload = `${b64url(userId)}.${exp}`;
  return `${ANON_PREFIX}${payload}.${hmac(payload)}`;
}

/**
 * Verify an anonymous-session token. Returns the userId, or null if the
 * signature is invalid, malformed, or expired.
 */
export function verifyAnonToken(
  token: string,
  nowMs: number
): { userId: string } | null {
  if (!token.startsWith(ANON_PREFIX)) return null;
  const body = token.slice(ANON_PREFIX.length);
  const parts = body.split(".");
  if (parts.length !== 3) return null;
  const [encUser, expStr, sig] = parts;
  const payload = `${encUser}.${expStr}`;
  if (!safeEqual(sig, hmac(payload))) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < nowMs) return null;
  try {
    const userId = Buffer.from(
      encUser.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    return userId ? { userId } : null;
  } catch {
    return null;
  }
}

/** Standard attributes for the session cookie. */
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
