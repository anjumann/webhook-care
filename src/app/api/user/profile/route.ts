import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const { userId, userName, userImage } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        userId: userId,
      },
      data: {
        userName,
        userImage,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    const { message, code, meta } = (await import("@/lib/error")).parseError(error);
    console.error("Error updating user profile:", message, code, meta);
    return NextResponse.json(
      {
        error: message,
        code,
        meta,
      },
      { status: 500 }
    );
  }
}

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });  
    }

    const user = await prisma.user.findUnique({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    const { message, code, meta } = (await import("@/lib/error")).parseError(error);
    console.error("Error fetching user profile:", message, code, meta);
    return NextResponse.json(
      { error: message, code, meta },
      { status: 500 }
    );
  }
}
