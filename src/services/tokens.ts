/**
 * API-token service — CRUD for Personal Access Tokens. All Prisma access for
 * tokens lives here; routes call these. Raw tokens are never stored or returned
 * except once, at creation, by `createToken`.
 */
import { prisma } from "@/lib/prisma";
import { generateToken, DEFAULT_SCOPES } from "@/lib/api-token";

/** Public fields safe to show in the UI (never the hash). */
const PUBLIC_SELECT = {
  id: true,
  name: true,
  prefix: true,
  scopes: true,
  lastUsedAt: true,
  expiresAt: true,
  createdAt: true,
} as const;

export function listTokens(userId: string) {
  return prisma.apiToken.findMany({
    where: { userId },
    select: PUBLIC_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create a token. Returns the public row plus the raw `wcat_…` value, which the
 * caller must surface to the user exactly once (it is unrecoverable after).
 */
export async function createToken(input: {
  userId: string;
  name: string;
  scopes?: string[];
  expiresAt?: Date | null;
}) {
  const { raw, hash, prefix } = generateToken();
  const token = await prisma.apiToken.create({
    data: {
      userId: input.userId,
      name: input.name,
      tokenHash: hash,
      prefix,
      scopes: input.scopes?.length ? input.scopes : DEFAULT_SCOPES,
      expiresAt: input.expiresAt ?? null,
    },
    select: PUBLIC_SELECT,
  });
  return { token, raw };
}

/** The owner of a token, for ownership guards. */
export async function getTokenOwner(id: string): Promise<string | null> {
  const token = await prisma.apiToken.findUnique({
    where: { id },
    select: { userId: true },
  });
  return token?.userId ?? null;
}

export function deleteToken(id: string) {
  return prisma.apiToken.delete({ where: { id } });
}
