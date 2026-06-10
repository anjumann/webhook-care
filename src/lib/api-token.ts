/**
 * Personal Access Token (PAT) primitives for the read-only Agent REST API and
 * the (planned) MCP server. Tokens look like `wcat_<random>`; only the sha256
 * hash is ever stored, and the raw value is shown once at creation.
 *
 * One resolver here = one auth source of truth for REST + MCP, mirroring how the
 * session guards live in `@/services/auth`.
 */
import { prisma } from "@/lib/prisma";
import { sha256, randomToken } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export const TOKEN_PREFIX = "wcat_";

/** Read-only scopes. Writes (delete/replay) are intentionally excluded. */
export const SCOPE_ENDPOINTS_READ = "endpoints:read";
export const SCOPE_REQUESTS_READ = "requests:read";
export const DEFAULT_SCOPES = [SCOPE_ENDPOINTS_READ, SCOPE_REQUESTS_READ];

export interface GeneratedToken {
  raw: string; // shown to the user exactly once
  hash: string; // stored
  prefix: string; // stored for UI display, e.g. "wcat_AbC1"
}

/** Mint a new token: raw (shown once), its hash, and a display prefix. */
export function generateToken(): GeneratedToken {
  const raw = `${TOKEN_PREFIX}${randomToken(24)}`;
  return { raw, hash: sha256(raw), prefix: raw.slice(0, 9) };
}

export interface ResolvedToken {
  id: string;
  userId: string;
  scopes: string[];
}

/** Strip a `Bearer ` prefix and trim. */
export function extractBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const raw = header.replace(/^Bearer\s+/i, "").trim();
  return raw.length ? raw : null;
}

/**
 * Resolve a raw bearer token to its owner + scopes. Returns null when the token
 * is malformed, unknown, or expired — never throws.
 */
export async function resolveToken(
  bearer: string | null | undefined
): Promise<ResolvedToken | null> {
  const raw = extractBearer(bearer);
  if (!raw || !raw.startsWith(TOKEN_PREFIX)) return null;

  const token = await prisma.apiToken.findUnique({
    where: { tokenHash: sha256(raw) },
    select: { id: true, userId: true, scopes: true, expiresAt: true },
  });
  if (!token) return null;
  if (token.expiresAt && token.expiresAt.getTime() < Date.now()) return null;

  return { id: token.id, userId: token.userId, scopes: token.scopes };
}

/** Fire-and-forget audit of the last time a token was used. */
export function touchToken(id: string): void {
  void prisma.apiToken
    .update({ where: { id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
}

export type TokenAuth =
  | { ok: true; userId: string; tokenId: string }
  | { ok: false; status: number; message: string };

/**
 * Guard a versioned REST route: require a valid bearer PAT carrying `scope`,
 * then rate-limit per token. Updates `lastUsedAt` (non-blocking) on success.
 */
export async function requireToken(
  request: Request,
  scope: string
): Promise<TokenAuth> {
  const token = await resolveToken(request.headers.get("authorization"));
  if (!token) {
    return { ok: false, status: 401, message: "Invalid or missing API token" };
  }
  if (!token.scopes.includes(scope)) {
    return { ok: false, status: 403, message: `Token missing required scope: ${scope}` };
  }
  const gate = await rateLimit("token", token.id);
  if (!gate.success) {
    return { ok: false, status: 429, message: "Rate limit exceeded for this token" };
  }
  touchToken(token.id);
  return { ok: true, userId: token.userId, tokenId: token.id };
}
