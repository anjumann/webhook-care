import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const endpoint = await prisma.endpoint.delete({
    where: { id },
  });

  return NextResponse.json(endpoint, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let endpoint = await prisma.endpoint.findFirst({
      where: {
        name: id,
      },
      include: {
        requests: {
          orderBy: {
            createdAt: "desc",
          },
        },
        forwardingUrls: true,
      },
    });

    if (!endpoint) {
      endpoint = await prisma.endpoint.findUnique({
        where: { id },
        include: {
          requests: {
            orderBy: {
              createdAt: "desc",
            },
          },
          forwardingUrls: true,
        },
      });
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(endpoint, { status: 200 });
  } catch (error) {
    const { message, code, meta } = (await import("@/lib/error")).parseError(
      error
    );
    console.error("Error fetching endpoint:", message, code, meta);
    return NextResponse.json({ error: message, code, meta }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, description, forwardingUrls } = await request.json();

  // Delete all existing forwardingUrls for this endpoint
  await prisma.forwardingUrl.deleteMany({
    where: { endpointId: id },
  });

  // Update the endpoint and create new forwardingUrls
  const endpoint = await prisma.endpoint.update({
    where: { id },
    data: {
      name,
      description,
      forwardingUrls: {
        create: forwardingUrls,
      },
    },
    include: {
      forwardingUrls: true,
    },
  });

  return NextResponse.json(endpoint, { status: 200 });
}
