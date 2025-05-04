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