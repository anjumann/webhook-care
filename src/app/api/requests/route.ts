import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpointId = searchParams.get("endpointId");

  if (!endpointId) {
    return NextResponse.json({ error: "endpointId required" }, { status: 400 });
  }

  await prisma.request.deleteMany({
    where: { endpointId },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
