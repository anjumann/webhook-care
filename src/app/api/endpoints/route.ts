import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Transform endpoint name for consistency
    const transformedName = name
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .trim();

    const endpoint = await prisma.endpoint.create({
      data: {
        name: transformedName,
        description,
        user: {
          connect: {
            userId,
          },
        },
      },
    });

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error("Error creating endpoint:", error);
    return NextResponse.json(
      { error: "Failed to create endpoint" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const endpoints = await prisma.endpoint.findMany({
      where: {
        userId, 
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(endpoints);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
