import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createEndpointSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-_]+$/),
  ulid: z.string().length(26),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ulid } = createEndpointSchema.parse(body);

    const endpoint = await prisma.endpoint.create({
      data: {
        name,
        ulid,
        status: "active",
      },
    });

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ulid = searchParams.get("ulid");

    if (!ulid) {
      return NextResponse.json(
        { error: "ULID is required" },
        { status: 400 }
      );
    }

    const endpoints = await prisma.endpoint.findMany({
      where: {
        ulid,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(endpoints);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 