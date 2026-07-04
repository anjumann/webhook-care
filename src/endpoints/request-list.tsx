"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  Pin,
  PinOff,
  TerminalSquare,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { useState } from "react";
import { deleteRequest, setRequestPinned } from "./api/endpoints";
import { toast } from "@/lib/toast";
import { track } from "@/lib/analytics";
import { buildCurl } from "@/lib/curl";
import { MethodPill } from "@/components/console/method-pill";
import { StatusPill } from "@/components/console/status-pill";
import { unwantedHeaders } from "@/constant";
import type { RequestRecord } from "@/endpoints/types";

interface RequestListProps {
  requests: RequestRecord[];
  mutate: () => void;
  /** The endpoint's full webhook URL — used to build "Copy as cURL". */
  webhookUrl?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// "Expires in N days" / "Kept" chip from a request's retention state.
function expiryChip(
  request: Pick<RequestRecord, "pinned" | "expiresAt">
): { text: string; tone: string } | null {
  if (request.pinned) return { text: "Kept", tone: "bg-accent-soft text-primary" };
  if (!request.expiresAt) return null;
  const ms = new Date(request.expiresAt).getTime() - Date.now();
  if (ms <= 0) return { text: "Expiring", tone: "bg-danger-soft text-danger" };
  const days = Math.ceil(ms / DAY_MS);
  return {
    text: days <= 1 ? "Expires <1d" : `Expires ${days}d`,
    tone: "border border-border bg-elev2 text-dim",
  };
}

// JSON viewer with copy + show-more.
function JsonDisplay({
  data,
  title,
  onCopy,
}: {
  data: unknown;
  title: string;
  onCopy: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const jsonString = JSON.stringify(data, null, 2);
  const isLong = jsonString.length > 500;
  const displayText = isExpanded ? jsonString : jsonString.slice(0, 500) + (isLong ? "…" : "");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-faint">{title}</h4>
        <div className="flex gap-1.5">
          {isLong && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-mid" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Show less" : "Show more"}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs text-mid" onClick={onCopy}>
            Copy <Copy className="ml-1 size-3" />
          </Button>
        </div>
      </div>
      <pre className="scroll-thin max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-inset p-3 font-mono text-xs leading-relaxed">
        {displayText}
      </pre>
    </div>
  );
}

const filterHeaders = (headers: Record<string, string>): Record<string, string> => {
  const filtered: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (!unwantedHeaders.includes(key.toLowerCase())) filtered[key] = value;
  });
  return filtered;
};

function RowAction({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-md border border-transparent text-dim transition-colors hover:border-border hover:bg-elev hover:text-foreground",
        danger && "hover:border-danger-soft hover:bg-danger-soft hover:text-danger"
      )}
    >
      {children}
    </button>
  );
}

export function RequestList({ requests, mutate, webhookUrl }: RequestListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const willExpand = !expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Fire only on expand — opening a row is the "inspected" signal. Kept out of
    // the state updater so it doesn't double-fire under StrictMode.
    if (willExpand) track("request_inspected");
  };

  if (requests.length === 0) {
    return <div className="py-6 text-center text-sm text-dim">No requests received yet</div>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-9 border-b border-border px-3 py-2.5" />
            {["Method", "Status", "Duration", "Time", "Expires"].map((h) => (
              <th
                key={h}
                className="border-b border-border px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-faint"
              >
                {h}
              </th>
            ))}
            <th className="border-b border-border px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-faint">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const isOpen = expanded.has(request.id);
            const chip = expiryChip(request);
            return (
              <RequestRow
                key={request.id}
                request={request}
                isOpen={isOpen}
                chip={chip}
                onToggle={() => toggle(request.id)}
                mutate={mutate}
                webhookUrl={webhookUrl}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RequestRow({
  request,
  isOpen,
  chip,
  onToggle,
  mutate,
  webhookUrl,
}: {
  request: RequestRecord;
  isOpen: boolean;
  chip: { text: string; tone: string } | null;
  onToggle: () => void;
  mutate: () => void;
  webhookUrl?: string;
}) {
  return (
    <>
      <tr className="group cursor-pointer border-t border-border transition-colors hover:bg-elev2" onClick={onToggle}>
        <td className="px-3 py-3 align-middle text-dim">
          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </td>
        <td className="px-3 py-3 align-middle">
          <MethodPill method={request.method} />
        </td>
        <td className="px-3 py-3 align-middle">
          <StatusPill code={request.statusCode} />
        </td>
        <td className="px-3 py-3 align-middle text-[13px] tabular-nums text-mid">{request.duration}ms</td>
        <td className="px-3 py-3 align-middle text-[13px] text-mid">
          {formatRelative(new Date(request.createdAt))}
        </td>
        <td className="px-3 py-3 align-middle">
          {chip ? (
            <span className={cn("inline-flex items-center rounded-full px-2 py-[3px] text-[11px] font-semibold", chip.tone)}>
              {chip.text}
            </span>
          ) : (
            <span className="text-xs text-dim">—</span>
          )}
        </td>
        <td className="px-3 py-3 align-middle">
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <RowAction
              title={request.pinned ? "Unpin (allow expiry)" : "Pin (keep forever)"}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await setRequestPinned(request.id, !request.pinned);
                  // Fire only when pinning — the retention-feature-use signal.
                  if (!request.pinned) track("request_pinned");
                  mutate();
                  toast.success(request.pinned ? "Request unpinned" : "Request pinned");
                } catch {
                  toast.error("Failed to update pin");
                }
              }}
            >
              {request.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </RowAction>
            <RowAction
              title="Copy as cURL"
              onClick={(e) => {
                e.stopPropagation();
                const command = buildCurl({
                  url: webhookUrl ?? "",
                  method: request.method,
                  headers: request.headers,
                  body: request.body,
                  query: request.query,
                });
                navigator.clipboard.writeText(command);
                track("copy_curl_clicked");
                toast.success("Copied as cURL");
              }}
            >
              <TerminalSquare className="size-3.5" strokeWidth={1.7} />
            </RowAction>
            <RowAction
              title="Copy payload"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(JSON.stringify(request.body, null, 2));
                toast.success("Payload copied to clipboard");
              }}
            >
              <Copy className="size-3.5" strokeWidth={1.7} />
            </RowAction>
            <RowAction
              title="Delete request"
              danger
              onClick={async (e) => {
                e.stopPropagation();
                await deleteRequest(request.id);
                mutate();
              }}
            >
              <Trash2 className="size-3.5" strokeWidth={1.7} />
            </RowAction>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t border-border bg-inset/40">
          <td colSpan={7} className="p-0">
            <div className="space-y-4 p-4">
              <JsonDisplay
                data={filterHeaders(request.headers)}
                title="Headers"
                onCopy={() => {
                  navigator.clipboard.writeText(JSON.stringify(filterHeaders(request.headers), null, 2));
                  toast.success("Headers copied to clipboard");
                }}
              />
              <JsonDisplay
                data={request.body}
                title="Body"
                onCopy={() => {
                  navigator.clipboard.writeText(JSON.stringify(request.body, null, 2));
                  toast.success("Body copied to clipboard");
                }}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
