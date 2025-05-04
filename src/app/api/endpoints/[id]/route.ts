import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const endpoint = await prisma.endpoint.delete({
    where: { id },
  });

  return NextResponse.json(endpoint, { status: 200 });
}   

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    let endpoint = await prisma.endpoint.findFirst({
      where: { 
        name: id,
      },
      include: {
        requests: true,
      },  
    });
    
   
    if (!endpoint) {
      endpoint = await prisma.endpoint.findUnique({
        where: { id },
        include: {
          requests: true,
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
    console.error("Error fetching endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch endpoint" },
      { status: 500 }
    );
  }
}
  