import { NextRequest } from "next/server";
import { z } from "zod";
import * as endpoints from "@/services/endpoints";
import { created, ok, badRequest, failFromError } from "@/lib/http";

const forwardingUrlSchema = z.object({
  url: z.string().url(),
  method: z.string().min(1),
});

const createSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().max(1000).optional(),
  forwardingUrls: z.array(forwardingUrlSchema).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const endpoint = await endpoints.createEndpoint(parsed.data);
    return created(endpoint);
  } catch (error) {
    return failFromError(error, "Error creating endpoint:");
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return badRequest("User ID is required");
    return ok(await endpoints.listEndpoints(userId));
  } catch (error) {
    return failFromError(error, "Error fetching endpoints:");
  }
}
