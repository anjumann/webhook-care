import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
  
    const requests = await prisma.request    .delete({
      where: { id },
    });
  
    return NextResponse.json(requests, { status: 200 });
  }   