import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string; name: string }> }
) {
  return handleWebhook(request, await params);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string; name: string }> }
) {
  return handleWebhook(request, await params);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string; name: string }> }
) {
  return handleWebhook(request, await params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string; name: string }> }
) {
  return handleWebhook(request, await params);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string; name: string }> }
) {
  return handleWebhook(request, await params);
}

async function handleWebhook(
  request: Request,
  { userId, name }:   { userId: string; name: string }
) {
  const startTime = Date.now();

  try {
    // Find the endpoint
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        userId,
        name,
      },
      select: {
        id: true,
        forwardingUrls: {
          select: {
            url: true,
          },
        },
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
      forwardingUrls: endpoint.forwardingUrls.map(fw => fw.url),
    };

    // Calculate duration
    const duration = Date.now() - startTime;

    // Store the request
    prisma.$transaction([
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

    // Forward the request to all forwardingUrls asynchronously
    if (endpoint.forwardingUrls && endpoint.forwardingUrls.length > 0) {
      const forwardHeaders = { ...headers };
      // Remove headers that should not be forwarded
      delete forwardHeaders["host"];
      delete forwardHeaders["content-length"];
      // Optionally, remove any other headers you don't want to forward

      const forwardBody =
        method === "GET" || method === "HEAD" ? undefined :
        contentType?.includes("application/json") ? JSON.stringify(body) :
        contentType?.includes("application/x-www-form-urlencoded") && body ?
          new URLSearchParams(body).toString() : undefined;

      Promise.allSettled(
        endpoint.forwardingUrls.map((fw: { url: string }) =>
          fetch(fw.url, {
            method,
            headers: forwardHeaders,
            body: forwardBody,
          }).catch((err) => {
            console.error(`Error forwarding to ${fw.url}:`, err);
          })
        )
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Use parseError for consistent error handling
    const { message, code, meta } = (await import("@/lib/error")).parseError(error);
    console.error("Error processing webhook:", message, code, meta);
    return NextResponse.json(
      { error: message, code, meta },
      { status: 500 }
    );
  }
} 