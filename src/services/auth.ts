/**
 * DB-backed sessions, magic links, and the route ownership guards.
 * Crypto primitives come from `@/lib/auth`.
 */
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_PREFIX,
  SESSION_MAX_AGE,
  MAGIC_LINK_TTL,
  signAnonToken,
  verifyAnonToken,
  sessionCookieOptions,
  sha256,
  randomToken,
} from "@/lib/auth";

export type SessionKind = "anon" | "verified";
export interface ResolvedSession {
  userId: string;
  kind: SessionKind;
}

export type AuthResult =
  | { ok: true; userId: string; kind: SessionKind }
  | { ok: false; status: number; message: string };

/** Read + validate the session cookie. Returns null when unauthenticated. */
export async function resolveSession(): Promise<ResolvedSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  if (token.startsWith(SESSION_PREFIX)) {
    const raw = token.slice(SESSION_PREFIX.length);
    const session = await prisma.session.findUnique({
      where: { tokenHash: sha256(raw) },
      select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) return null;
    return { userId: session.userId, kind: "verified" };
  }

  const anon = verifyAnonToken(token, Date.now());
  return anon ? { userId: anon.userId, kind: "anon" } : null;
}

/**
 * Assert the caller owns `targetUserId`.
 *  - no/invalid session → 401
 *  - session for a different user → 403
 *  - anonymous session for an email-claimed account → 401 (must log in)
 */
export async function requireOwner(targetUserId: string): Promise<AuthResult> {
  const session = await resolveSession();
  if (!session) return { ok: false, status: 401, message: "Not authenticated" };
  if (session.userId !== targetUserId) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  if (session.kind === "anon") {
    const user = await prisma.user.findUnique({
      where: { userId: targetUserId },
      select: { emailVerifiedAt: true },
    });
    if (user?.emailVerifiedAt) {
      return { ok: false, status: 401, message: "Please sign in to continue" };
    }
  }
  return { ok: true, userId: session.userId, kind: session.kind };
}

/** Resolve an endpoint's owner, then assert the caller owns it. */
export async function requireOwnerOfEndpoint(
  idOrName: string
): Promise<AuthResult & { endpointUserId?: string }> {
  const endpoint =
    (await prisma.endpoint.findFirst({
      where: { name: idOrName },
      select: { userId: true },
    })) ??
    (await prisma.endpoint.findUnique({
      where: { id: idOrName },
      select: { userId: true },
    }));
  if (!endpoint) return { ok: false, status: 404, message: "Endpoint not found" };
  const result = await requireOwner(endpoint.userId);
  return { ...result, endpointUserId: endpoint.userId };
}

/** Resolve a single request's owner (via its endpoint), then assert ownership. */
export async function requireOwnerOfRequest(
  requestId: string
): Promise<AuthResult> {
  const req = await prisma.request.findUnique({
    where: { id: requestId },
    select: { endpoint: { select: { userId: true } } },
  });
  if (!req) return { ok: false, status: 404, message: "Request not found" };
  return requireOwner(req.endpoint.userId);
}

/**
 * Issue an anonymous session for `userId` — but ONLY if the account hasn't been
 * email-claimed (claimed accounts require a verified magic-link login, so the
 * ULID in a URL can't silently grant access). No-op + false when claimed.
 */
export async function setAnonSession(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { emailVerifiedAt: true },
  });
  if (user?.emailVerifiedAt) return false;
  (await cookies()).set(
    SESSION_COOKIE,
    signAnonToken(userId, Date.now()),
    sessionCookieOptions()
  );
  return true;
}

/** Create a revocable verified session (after magic-link verification). */
export async function createVerifiedSession(
  userId: string,
  userAgent?: string
): Promise<void> {
  const raw = randomToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(raw),
      userAgent,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });
  (await cookies()).set(
    SESSION_COOKIE,
    `${SESSION_PREFIX}${raw}`,
    sessionCookieOptions()
  );
}

/** Revoke the current session (DB row if verified) and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token?.startsWith(SESSION_PREFIX)) {
    await prisma.session
      .deleteMany({ where: { tokenHash: sha256(token.slice(SESSION_PREFIX.length)) } })
      .catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Create a magic link for `email`, requested by browser `userId`. Stores only
 * the token hash. Returns the raw token so the caller can build + email the URL.
 */
export async function createMagicLink(
  email: string,
  userId: string
): Promise<string> {
  const raw = randomToken();
  await prisma.magicLink.create({
    data: {
      email: email.toLowerCase(),
      userId,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL * 1000),
    },
  });
  return raw;
}

/**
 * Consume a magic-link token (single-use, constant-time via hash equality, not
 * expired) and establish a verified session — merging the requesting browser's
 * endpoints into the canonical account when the email is already claimed.
 * Returns the effective userId, or null when the token is invalid.
 */
export async function verifyMagicLink(
  rawToken: string,
  userAgent?: string
): Promise<{ userId: string } | null> {
  const link = await prisma.magicLink.findUnique({
    where: { tokenHash: sha256(rawToken) },
  });
  if (!link || link.consumedAt || link.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await prisma.magicLink.update({
    where: { id: link.id },
    data: { consumedAt: new Date() },
  });

  const email = link.email.toLowerCase();
  // `email` is unique via a partial DB index, not Prisma `@unique` (see
  // schema), so use findFirst — findUnique isn't available without `@unique`.
  const canonical = await prisma.user.findFirst({ where: { email } });

  let targetUserId = link.userId;
  if (canonical && canonical.userId !== link.userId) {
    // Email already belongs to another account → merge this browser's endpoints
    // into it and log in as the canonical account.
    await prisma.endpoint.updateMany({
      where: { userId: link.userId },
      data: { userId: canonical.userId },
    });
    targetUserId = canonical.userId;
  } else {
    // First claim for this email — attach it to the requesting account.
    await prisma.user.update({
      where: { userId: link.userId },
      data: { email, emailVerifiedAt: new Date() },
    });
  }

  await createVerifiedSession(targetUserId, userAgent);
  return { userId: targetUserId };
}
