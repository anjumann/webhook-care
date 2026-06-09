"use server";

import { getOrCreateUser } from "@/services/users";
import { parseError } from "@/lib/error";

interface UserData {
  id?: string;
  userName?: string | null;
  userImage?: string | null;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    endpoints: number;
  };
  endpoints: { id: string }[];
}

type UserResponse = UserData | { success: false; error: string; code?: string; meta?: any };

/**
 * Creates a user if it doesn't exist, otherwise returns the existing user
 */
export async function createOrGetUser({
  userId,
  userName,
  userImage,
}: {
  userId: string;
  userName?: string;
  userImage?: string;
}): Promise<UserResponse> {
  try {
    return await getOrCreateUser({ userId, userName, userImage });
  } catch (error) {
    const { message, code, meta } = parseError(error);
    console.error("Error in createOrGetUser:", message, code, meta);
    return { success: false, error: message, code, meta };
  }
}
