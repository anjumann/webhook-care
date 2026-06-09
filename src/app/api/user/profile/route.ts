import { NextRequest } from "next/server";
import { z } from "zod";
import * as users from "@/services/users";
import { ok, badRequest, failFromError } from "@/lib/http";

const updateSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().max(60).optional(),
  userImage: z.string().max(200).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    return ok(await users.updateProfile(parsed.data));
  } catch (error) {
    return failFromError(error, "Error updating user profile:");
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return badRequest("User ID is required");
    return ok(await users.getUser(userId));
  } catch (error) {
    return failFromError(error, "Error fetching user profile:");
  }
}
