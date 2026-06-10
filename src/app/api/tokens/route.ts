/**
 * Token management (session-guarded — the dashboard owner, not a PAT).
 *   GET  /api/tokens?userId=…   list the owner's tokens (no secrets)
 *   POST /api/tokens            create a token; raw value returned ONCE
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import * as tokens from "@/services/tokens";
import { requireOwner } from "@/services/auth";
import { DEFAULT_SCOPES, SCOPE_ENDPOINTS_READ, SCOPE_REQUESTS_READ } from "@/lib/api-token";
import { ok, created, badRequest, fail, failFromError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return badRequest("userId is required");
    const auth = await requireOwner(userId);
    if (!auth.ok) return fail(auth.message, auth.status);
    return ok(await tokens.listTokens(userId));
  } catch (error) {
    return failFromError(error, "Error listing tokens:");
  }
}

const createSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(60),
  scopes: z
    .array(z.enum([SCOPE_ENDPOINTS_READ, SCOPE_REQUESTS_READ]))
    .optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return badRequest(parsed.error?.issues[0]?.message ?? "Invalid token request");
    }
    const auth = await requireOwner(parsed.data.userId);
    if (!auth.ok) return fail(auth.message, auth.status);

    const { token, raw } = await tokens.createToken({
      userId: parsed.data.userId,
      name: parsed.data.name,
      scopes: parsed.data.scopes ?? DEFAULT_SCOPES,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    });
    // `raw` is returned exactly once — never stored, never shown again.
    return created({ ...token, token: raw });
  } catch (error) {
    return failFromError(error, "Error creating token:");
  }
}
