"use server";

import { prisma } from "@/lib/prisma";

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
    const existingUser = await prisma.user.findFirst({
      where: {
        userId: userId,
      },
      include: {
        _count: {
          select: {
            endpoints: {
              where: {
                status: "active"
              }
            }
          }
        },
        endpoints: {
          select: {
            id: true
          }
        }
      },
    });

    if (existingUser) {
      return existingUser;
    }

    const newUser = await prisma.user.create({
      data: {
        userId,
        userName,
        userImage,
      },
      include: {
        _count: {
          select: {
            endpoints: {
              where: {
                status: "active"
              }
            }
          }
        },
        endpoints: {
          select: {
            id: true
          }
        }
      },
    });

    return newUser;
  } catch (error) {
    const { message, code, meta } = (await import("@/lib/error")).parseError(error);
    console.error("Error in createOrGetUser:", message, code, meta);
    return { success: false, error: message, code, meta };
  }
}
