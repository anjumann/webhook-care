import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { userId: string; name: string } }
) {
  return handleWebhook(request, params);
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string; name: string } }
) {
  return handleWebhook(request, params);
}

export async function PUT(
  request: Request,
  { params }: { params: { userId: string; name: string } }
) {
  return handleWebhook(request, params);
}

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string; name: string } }
) {
  return handleWebhook(request, params);
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string; name: string } }
) {
  return handleWebhook(request, params);
}

async function handleWebhook(
  request: Request,
  { userId, name }: { userId: string; name: string }
) {
  const startTime = Date.now();

  try {
    // Find the endpoint
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        userId,
        name,
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    // Parse request details
    const headers = Object.fromEntries(request.headers.entries());
    const method = request.method;
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    
    let body = null;
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        body = null;
      }
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      try {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } catch {
        body = null;
      }
    }

    // Create response
    const response = {
      message: "Webhook received successfully",
      timestamp: new Date().toISOString(),
    };

    // Calculate duration
    const duration = Date.now() - startTime;

    // Store the request
    await prisma.$transaction([
      prisma.request.create({
        data: {
          endpointId: endpoint.id,
          method,
          headers,
          query,
          body,
          response,
          statusCode: 200,
          duration,
        },
      }),
      prisma.endpoint.update({
        where: { id: endpoint.id },
        data: {
          lastActivity: new Date(),
          requestCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 