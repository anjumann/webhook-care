/**
 * Single source of truth for the endpoint/request shapes used across the client
 * data layer and UI. Server code should prefer Prisma's generated types; these
 * mirror what the API serializes to JSON (dates as ISO strings).
 */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface ForwardingUrl {
  id: string;
  url: string;
  method: string;
}

export interface RequestRecord {
  id: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  rawBody?: string | null;
  contentType?: string | null;
  query: Record<string, unknown> | null;
  statusCode: number;
  response: unknown;
  duration: number;
  pinned?: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Endpoint {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  requestCount: number;
  retentionDays?: number;
  userId: string;
  forwardingUrls: ForwardingUrl[];
}

/** An endpoint loaded with a (paginated) page of its requests. */
export interface EndpointWithRequests extends Endpoint {
  requests: RequestRecord[];
  /** Cursor for the next page of `requests`, or null when fully loaded. */
  nextCursor?: string | null;
}

/** Standard shape for cursor-paginated list responses. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
