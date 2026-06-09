/**
 * Small response helpers for route handlers, so every API returns a consistent
 * JSON shape and errors flow through `parseError`. Keeps routes thin.
 */
import { NextResponse } from "next/server";
import { parseError } from "@/lib/error";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

/** A structured error payload `{ error, code?, meta? }` with a status code. */
export function fail(
  message: string,
  status = 400,
  extra?: { code?: string; meta?: unknown }
) {
  return NextResponse.json(
    { error: message, ...(extra ?? {}) },
    { status }
  );
}

/** Normalize any thrown value into a 500 JSON error via `parseError`. */
export function failFromError(error: unknown, context?: string) {
  const { message, code, meta } = parseError(error);
  if (context) console.error(context, message, code, meta);
  return NextResponse.json({ error: message, code, meta }, { status: 500 });
}

/** Common shapes. */
export const badRequest = (message = "Bad request") => fail(message, 400);
export const unauthorized = (message = "Unauthorized") => fail(message, 401);
export const forbidden = (message = "Forbidden") => fail(message, 403);
export const notFound = (message = "Not found") => fail(message, 404);
export const tooManyRequests = (message = "Rate limit exceeded") =>
  fail(message, 429);
