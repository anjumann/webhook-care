import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, forwardingUrls } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Transform endpoint name for consistency
    const transformedName = name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .trim();

    // Create the endpoint
    const endpoint = await prisma.endpoint.create({
      data: {
        name: transformedName,
        description,
        forwardingUrls: {
          create: forwardingUrls.map((rule: { url: string; method: string }) => ({
            url: rule.url,
            method: rule.method,
          })),
        },
        user: {
          connect: {
            userId,
          },
        },
        
      },
    });


    // If forwardingRules are provided, create them

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    const { message, code, meta } = (await import("@/lib/error")).parseError(error);
    console.error("Error creating endpoint:", message, code, meta);
    return NextResponse.json(
      { error: message, code, meta },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
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
    const { message, code, meta } = (await import("@/lib/error")).parseError(error);
    console.error("Error fetching endpoints:", message, code, meta);
    return NextResponse.json(
      { error: message, code, meta },
      { status: 500 }
    );
  }
}
