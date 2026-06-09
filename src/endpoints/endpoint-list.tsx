"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Zap,
  Inbox,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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

  const copyEndpointUrl = async (endpointName: string) => {
    const fullUrl = `${window.location.origin}/api/webhook/${userId}/${endpointName}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success("Endpoint URL copied to clipboard");
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

  const filtered = list.filter((e) =>
    filter === "all"
      ? true
      : filter === "active"
        ? e.status === "active"
        : e.status !== "active"
  );

  return (
    <div className="space-y-5">
      {/* KPI row — real data only */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {/* Endpoints panel */}
      <Panel>
        <PanelHead
          title="All endpoints"
          count={isLoading ? undefined : filtered.length}
          right={
            <Segments<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { label: "All", value: "all" },
                { label: "Active", value: "active" },
                { label: "Paused", value: "paused" },
              ]}
            />
          }
        />

        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState userId={userId} hasAny={total > 0} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Endpoint", "Status", "Requests", "Last activity", "Created"].map(
                    (h) => (
                      <th
                        key={h}
                        className="border-b border-border px-[18px] py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-faint"
                      >
                        {h}
                      </th>
                    )
                  )}
                  <th className="border-b border-border px-[18px] py-[11px] text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((endpoint) => {
                  const active = endpoint.status === "active";
                  return (
                    <tr
                      key={endpoint.id}
                      className="group cursor-pointer transition-colors hover:bg-elev2"
                      onClick={() =>
                        router.push(`/dashboard/${userId}/${endpoint.id}`)
                      }
                    >
                      <td className="px-[18px] py-[13px] align-middle">
                        <div className="flex items-center gap-[11px]">
                          <ServiceLogo name={endpoint.name} />
                          <span className="min-w-0">
                            <Link
                              href={`/dashboard/${userId}/${endpoint.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="block truncate text-[13.5px] font-semibold hover:text-primary"
                            >
                              {endpoint.name}
                            </Link>
                            <span className="mt-0.5 block truncate font-mono text-[11.5px] text-dim">
                              /api/webhook/{userId.slice(0, 6)}…/{endpoint.name}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-[18px] py-[13px] align-middle">
                        <StatusBadge active={active} />
                      </td>
                      <td className="px-[18px] py-[13px] align-middle text-[13.5px] font-semibold tabular-nums">
                        {endpoint.requestCount.toLocaleString()}
                      </td>
                      <td className="px-[18px] py-[13px] align-middle text-[13.5px] text-mid">
                        {formatDate(new Date(endpoint.lastActivity))}
                      </td>
                      <td className="px-[18px] py-[13px] align-middle text-[13.5px] text-dim">
                        {formatDate(new Date(endpoint.createdAt))}
                      </td>
                      <td className="px-[18px] py-[13px] align-middle">
                        <div
                          className="flex justify-end gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowAction
                            title="Copy URL"
                            onClick={() => copyEndpointUrl(endpoint.name)}
                          >
                            <Copy className="size-3.5" strokeWidth={1.7} />
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
        "flex size-7 items-center justify-center rounded-md border border-transparent text-dim transition-colors hover:border-border hover:bg-elev hover:text-foreground " +
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
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-[11px] px-[18px] py-[15px]"
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

function EmptyState({ userId, hasAny }: { userId: string; hasAny: boolean }) {
  if (hasAny) {
    return (
      <div className="px-[18px] py-12 text-center text-[13.5px] text-dim">
        No endpoints match this filter.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 px-[18px] py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-primary">
        <Inbox className="size-5" strokeWidth={1.7} />
      </div>
      <div>
        <p className="text-sm font-semibold">No endpoints yet</p>
        <p className="mt-1 text-[13px] text-dim">
          Create your first endpoint to start capturing webhooks.
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
