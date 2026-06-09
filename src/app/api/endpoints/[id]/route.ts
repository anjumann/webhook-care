import { NextRequest } from "next/server";
import { z } from "zod";
import * as endpoints from "@/services/endpoints";
import { ok, notFound, badRequest, failFromError } from "@/lib/http";
import { MAX_PAGE_SIZE } from "@/services/requests";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sp = new URL(request.url).searchParams;

    const limit = sp.get("limit") ? Number(sp.get("limit")) : 50;
    const since = sp.get("since") ? new Date(sp.get("since")!) : undefined;
    const status = sp.get("status") ? Number(sp.get("status")) : undefined;

    const endpoint = await endpoints.findEndpointWithRequests(id, {
      limit: Math.min(limit, MAX_PAGE_SIZE),
      cursor: sp.get("cursor"),
      method: sp.get("method") ?? undefined,
      status,
      since,
    });

    if (!endpoint) return notFound("Endpoint not found");
    return ok(endpoint);
  } catch (error) {
    return failFromError(error, "Error fetching endpoint:");
  }
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(1000).nullable().optional(),
  retentionDays: z.number().int().positive().max(365).optional(),
  forwardingUrls: z
    .array(z.object({ url: z.string().url(), method: z.string().min(1) }))
    .optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const endpoint = await endpoints.updateEndpoint(id, {
      ...parsed.data,
      description: parsed.data.description ?? undefined,
    });
    return ok(endpoint);
  } catch (error) {
    return failFromError(error, "Error updating endpoint:");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return ok(await endpoints.deleteEndpoint(id));
  } catch (error) {
    return failFromError(error, "Error deleting endpoint:");
  }
}
