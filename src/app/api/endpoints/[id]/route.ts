import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const endpoint = await prisma.endpoint.delete({
    where: { id }
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
    const { message, code, meta } = (await import("@/lib/error")).parseError(error);
    console.error("Error fetching endpoint:", message, code, meta);
    return NextResponse.json(
      { error: message, code, meta },
      { status: 500 }
    );
  }
}
  