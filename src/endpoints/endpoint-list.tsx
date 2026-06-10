"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Zap,
  Inbox,
  Forward,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  Search,
  TerminalSquare,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { deleteEndpoint, useEndpoints } from "./api/endpoints";
import { toast } from "@/lib/toast";
import { KpiCard } from "@/components/console/kpi-card";
import { Panel, PanelHead } from "@/components/console/panel";
import { Segments } from "@/components/console/segments";
import { StatusBadge } from "@/components/console/status-badge";
import { ServiceLogo } from "@/components/console/service-logo";

export interface ForwardingUrl {
  id: string;
  url: string;
  method: string;
}

export interface Endpoint {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  requestCount: number;
  userId: string;
  forwardingUrls: ForwardingUrl[];
}

interface EndpointListProps {
  userId: string;
}

type Filter = "all" | "active" | "paused";

export function EndpointList({ userId }: EndpointListProps) {
  const router = useRouter();
  const { endpoints, isLoading, mutate } = useEndpoints(userId);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  // Actions are visible on every row by default; once the cursor enters the
  // table we switch to per-row reveal so only the hovered row shows its actions.
  const [tableHovered, setTableHovered] = React.useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://your-app";

  const webhookUrl = (name: string) =>
    `${origin}/api/webhook/${userId}/${name}`;

  const copyEndpointUrl = async (name: string) => {
    await navigator.clipboard.writeText(webhookUrl(name));
    toast.success("Endpoint URL copied");
  };

  // DX: a ready-to-run curl that fires a sample event at this endpoint.
  const copyTestCurl = async (name: string) => {
    const curl = `curl -X POST "${webhookUrl(name)}" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"test.ping","hello":"world"}'`;
    await navigator.clipboard.writeText(curl);
    toast.success("Test curl copied — paste & run");
  };

  const handleDeleteEndpoint = async (endpointId: string) => {
    try {
      await deleteEndpoint(endpointId);
      mutate();
      toast.success("Endpoint deleted");
    } catch (error) {
      console.error("Failed to delete endpoint:", error);
      toast.error("Failed to delete endpoint. Please try again.");
    }
  };

  const list = (endpoints ?? []) as Endpoint[];
  const total = list.length;
  const activeCount = list.filter((e) => e.status === "active").length;
  const totalRequests = list.reduce((sum, e) => sum + (e.requestCount ?? 0), 0);
  const forwardingCount = list.filter(
    (e) => (e.forwardingUrls?.length ?? 0) > 0
  ).length;

  const q = query.trim().toLowerCase();
  const filtered = list
    .filter((e) =>
      filter === "all"
        ? true
        : filter === "active"
          ? e.status === "active"
          : e.status !== "active"
    )
    .filter((e) => (q ? e.name.toLowerCase().includes(q) : true));

  return (
    <div className="space-y-7">
      {/* KPI row — real data only */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          feature
          tone="c1"
          icon={Activity}
          label="Total endpoints"
          value={isLoading ? "—" : total}
        />
        <KpiCard
          tone="c2"
          icon={Zap}
          label="Active now"
          value={isLoading ? "—" : activeCount}
          delta={
            !isLoading && total > 0 ? `${total - activeCount} paused` : undefined
          }
        />
        <KpiCard
          tone="c3"
          icon={Inbox}
          label="Total requests"
          value={isLoading ? "—" : totalRequests.toLocaleString()}
        />
        <KpiCard
          tone="c4"
          icon={Forward}
          label="Forwarding"
          value={isLoading ? "—" : forwardingCount}
          delta={
            !isLoading && forwardingCount > 0 ? "fan-out enabled" : undefined
          }
        />
      </div>

      {/* Endpoints panel */}
      <Panel>
        <PanelHead
          title="All endpoints"
          count={isLoading ? undefined : filtered.length}
          right={
            <div className="flex items-center gap-2.5">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter endpoints…"
                  aria-label="Filter endpoints by name"
                  className="h-8 w-44 rounded-md border border-border bg-inset pl-8 pr-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent-line focus:bg-card"
                />
              </div>
              <Segments<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Paused", value: "paused" },
                ]}
              />
            </div>
          }
        />

        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState userId={userId} hasAny={total > 0} filtering={!!q} />
        ) : (
          <div
            className="overflow-x-auto"
            onMouseEnter={() => setTableHovered(true)}
            onMouseLeave={() => setTableHovered(false)}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th className="text-left">Endpoint</Th>
                  <Th className="text-left">Status</Th>
                  <Th className="text-right">Requests</Th>
                  <Th className="text-left">Last activity</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((endpoint) => {
                  const active = endpoint.status === "active";
                  const lastDate = new Date(endpoint.lastActivity);
                  const fwd = endpoint.forwardingUrls?.length ?? 0;
                  return (
                    <tr
                      key={endpoint.id}
                      className="group cursor-pointer border-t border-border transition-colors hover:bg-elev2"
                      onClick={() =>
                        router.push(`/dashboard/${userId}/${endpoint.id}`)
                      }
                    >
                      {/* Endpoint */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          <ServiceLogo name={endpoint.name} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/${userId}/${endpoint.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-[13.5px] font-semibold hover:text-primary"
                              >
                                {endpoint.name}
                              </Link>
                              {fwd > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-c4/15 px-1.5 py-px text-[10.5px] font-semibold text-c4">
                                  <Forward className="size-2.5" strokeWidth={2} />
                                  {fwd}
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              title="Copy webhook URL"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyEndpointUrl(endpoint.name);
                              }}
                              className="mt-1 flex items-center gap-1.5 font-mono text-[11.5px] text-dim transition-colors hover:text-primary"
                            >
                              <span className="truncate">
                                /api/webhook/{userId.slice(0, 6)}…/{endpoint.name}
                              </span>
                              <Copy
                                className="size-3 flex-none opacity-0 transition-opacity group-hover:opacity-100"
                                strokeWidth={1.7}
                              />
                            </button>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 align-middle">
                        <StatusBadge active={active} />
                      </td>

                      {/* Requests */}
                      <td className="px-6 py-4 text-right align-middle text-[13.5px] font-semibold tabular-nums">
                        {endpoint.requestCount.toLocaleString()}
                      </td>

                      {/* Last activity */}
                      <td className="px-6 py-4 align-middle text-[13.5px] text-mid">
                        {endpoint.requestCount > 0
                          ? formatRelative(lastDate)
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 align-middle">
                        <div
                          className={cn(
                            "flex justify-end gap-1.5 transition-opacity focus-within:opacity-100",
                            tableHovered
                              ? "opacity-0 group-hover:opacity-100"
                              : "opacity-100"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowAction
                            title="Copy test curl"
                            onClick={() => copyTestCurl(endpoint.name)}
                          >
                            <TerminalSquare className="size-3.5" strokeWidth={1.7} />
                          </RowAction>
                          <RowAction
                            title="Open"
                            onClick={() =>
                              router.push(`/dashboard/${userId}/${endpoint.id}`)
                            }
                          >
                            <ExternalLink className="size-3.5" strokeWidth={1.7} />
                          </RowAction>
                          <RowAction
                            title="Edit"
                            onClick={() =>
                              router.push(
                                `/dashboard/${userId}/${endpoint.id}/edit`
                              )
                            }
                          >
                            <Pencil className="size-3.5" strokeWidth={1.7} />
                          </RowAction>
                          <RowAction
                            title="Delete"
                            danger
                            onClick={() => handleDeleteEndpoint(endpoint.id)}
                          >
                            <Trash2 className="size-3.5" strokeWidth={1.7} />
                          </RowAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function RowAction({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={
        "flex size-8 items-center justify-center rounded-md border border-transparent text-dim transition-colors hover:border-border hover:bg-elev hover:text-foreground " +
        (danger
          ? "hover:border-danger-soft hover:bg-danger-soft hover:text-danger"
          : "")
      }
    >
      {children}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 border-t border-border px-6 py-5 first:border-t-0"
        >
          <div className="size-[34px] flex-none animate-pulse rounded-[9px] bg-elev2" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-elev2" />
            <div className="h-2.5 w-56 animate-pulse rounded bg-inset" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-elev2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  userId,
  hasAny,
  filtering,
}: {
  userId: string;
  hasAny: boolean;
  filtering: boolean;
}) {
  if (hasAny) {
    return (
      <div className="px-6 py-16 text-center text-[13.5px] text-dim">
        {filtering
          ? "No endpoints match your search."
          : "No endpoints match this filter."}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-primary">
        <Inbox className="size-6" strokeWidth={1.7} />
      </div>
      <div className="space-y-1.5">
        <p className="text-[15px] font-semibold">No endpoints yet</p>
        <p className="max-w-xs text-[13px] text-dim">
          Create your first endpoint to get a unique URL and start capturing
          webhooks in seconds.
        </p>
      </div>
      <Link
        href={`/dashboard/${userId}/endpoint/create`}
        className="mt-1 inline-flex h-[34px] items-center gap-[7px] rounded-sm bg-gradient-to-br from-primary to-accent2 px-3.5 text-[13px] font-semibold text-accentfg shadow-[0_5px_16px_var(--accent-soft)]"
      >
        <Plus className="size-4" strokeWidth={2} />
        Create endpoint
      </Link>
    </div>
  );
}
