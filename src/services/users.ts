/**
 * User service — all Prisma access for the `User` model lives here.
 * `userId` is the public ULID identity (not the Mongo `_id`).
 */
import { prisma } from "@/lib/prisma";

const userWithCounts = {
  _count: { select: { endpoints: { where: { status: "active" } } } },
  endpoints: { select: { id: true } },
} as const;

export async function getOrCreateUser(input: {
  userId: string;
  userName?: string;
  userImage?: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { userId: input.userId },
    include: userWithCounts,
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      userId: input.userId,
      userName: input.userName,
      userImage: input.userImage,
    },
    include: userWithCounts,
  });
}

export function getUser(userId: string) {
  return prisma.user.findUnique({ where: { userId } });
}

export function updateProfile(input: {
  userId: string;
  userName?: string;
  userImage?: string;
}) {
  return prisma.user.update({
    where: { userId: input.userId },
    data: { userName: input.userName, userImage: input.userImage },
  });
}
