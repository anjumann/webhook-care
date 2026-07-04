"use client"

import { RequestList } from "@/endpoints/request-list";
import { CopyButton } from "@/components/copy-button";
import { useEffect, useState, useMemo, useRef } from "react";
import { useGetEndpoint, deleteAllRequests, fetchRequestPage } from "@/endpoints/api/endpoints";
import type { RequestRecord } from "@/endpoints/types";
import { formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import CustomBreadcrumb from "@/components/custom-breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Copy,
  Pencil,
  Play,
  Download,
  Trash2,
  RefreshCcw,
  Search,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { useRequestStream } from "@/hooks/useRequestStream";
import WebhookTestSection from "@/endpoints/webhook-test-section";
import { ExportDialog } from "@/endpoints/export-dialog";
import { toast } from "@/lib/toast";
import { track } from "@/lib/analytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Panel, PanelHead } from "@/components/console/panel";
import { CodeBlock } from "@/components/console/code-block";
import { MethodPill } from "@/components/console/method-pill";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface EndpointDetailsPageProps {
  params: Promise<{
    userId: string;
    id: string;
  }>;
}

export default function EndpointDetailsPage({ params }: EndpointDetailsPageProps) {
  const searchParams = useSearchParams();
  const isNew = searchParams?.get("isNew") === "true" || false;
  const router = useRouter();

  const [param, setParam] = useState<{ userId: string; id: string } | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const { userId, id } = await params;
      setParam({ userId, id });
    };
    getParams();
  }, [params]);

  const [integrationOpen, setIntegrationOpen] = useState(false);
  const [forwardingOpen, setForwardingOpen] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  // Debounce the search box, then fetch server-side (never filter a loaded page).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch) track("request_search");
  }, [debouncedSearch]);

  const { endpoints, isLoading, mutate } = useGetEndpoint(param?.id ?? "", debouncedSearch);

  // Cursor pagination: the base SWR fetch is page 1; "Load more" appends pages.
  // Reset the appended pages whenever the base result changes (new search, or a
  // mutate() after pin/delete) and seed the cursor from that page.
  const [appended, setAppended] = useState<RequestRecord[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Live inspector: rows streamed via SSE, newest-first, prepended to the list.
  const [liveOn, setLiveOn] = useState(true);
  const [liveRows, setLiveRows] = useState<RequestRecord[]>([]);

  useEffect(() => {
    // A new base page (search change / mutate / refetch) supersedes the appended
    // and live buffers — the refetched page 1 already includes the newest rows,
    // so clearing here prevents unbounded growth and stale duplicates.
    setAppended([]);
    setCursor(endpoints?.nextCursor ?? null);
    setLiveRows([]);
  }, [endpoints]);

  // Stream is on by default (the "watch it land live" north-star), paused during
  // a search (the stream doesn't apply the filter) or when toggled off.
  const streamEnabled = liveOn && !debouncedSearch && Boolean(endpoints?.id);
  const { status: liveStatus } = useRequestStream(endpoints?.id, {
    enabled: streamEnabled,
    onRequest: (row) =>
      setLiveRows((prev) => [row, ...prev.filter((r) => r.id !== row.id)]),
  });

  // Compose the visible list: live (newest) → page 1 → loaded-more, deduped by id.
  const displayRequests = useMemo(() => {
    const seen = new Set<string>();
    const out: RequestRecord[] = [];
    for (const r of [...liveRows, ...(endpoints?.requests ?? []), ...appended]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  }, [liveRows, endpoints?.requests, appended]);

  async function loadMore() {
    if (!param?.id || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchRequestPage(param.id, {
        cursor,
        search: debouncedSearch,
        limit: 50,
      });
      setAppended((prev) => [...prev, ...page.requests]);
      setCursor(page.nextCursor);
      track("pagination_load_more");
    } catch {
      toast.error("Couldn't load more requests");
    } finally {
      setLoadingMore(false);
    }
  }

  // Integration is the onboarding aid: open it only while there are no requests
  // yet; once traffic is flowing, collapse it so the request log dominates.
  // Runs once per load; never overrides a later manual toggle.
  const didInitIntegration = useRef(false);
  useEffect(() => {
    if (!endpoints || didInitIntegration.current) return;
    didInitIntegration.current = true;
    setIntegrationOpen((endpoints.requests?.length ?? 0) === 0);
  }, [endpoints]);

  // Activation signal: the moment an endpoint first has a captured request.
  // Fired at most once per endpoint per browser (localStorage-gated) with the
  // time from endpoint creation to its oldest request — the <60s core-loop
  // measure (spec §6). Uses the oldest request so it's accurate even if the user
  // only opens the detail page later.
  const fwrFired = useRef(false);
  useEffect(() => {
    // Skip while a search is active — the loaded page is a filtered subset, so
    // its oldest row isn't the endpoint's true first request.
    if (fwrFired.current || !endpoints || debouncedSearch) return;
    const reqs = endpoints.requests ?? [];
    if (reqs.length === 0) return;
    fwrFired.current = true;
    try {
      const gateKey = `wcat_fwr_${endpoints.id}`;
      if (localStorage.getItem(gateKey)) return;
      const created = new Date(endpoints.createdAt).getTime();
      const oldest = Math.min(...reqs.map((r) => new Date(r.createdAt).getTime()));
      const seconds = Math.max(0, Math.round((oldest - created) / 1000));
      track("first_webhook_received", { seconds_since_create: seconds });
      localStorage.setItem(gateKey, "1");
    } catch {
      /* localStorage may be unavailable (private mode) — best-effort */
    }
  }, [endpoints, debouncedSearch]);

  const webhookUrl = `/api/webhook/${param?.userId}/${endpoints?.name}`;
  const [fullWebhookUrl, setFullWebhookUrl] = useState("");

  useEffect(() => {
    if (param?.userId && endpoints?.name) {
      setFullWebhookUrl(window.location.origin + webhookUrl);
    }
  }, [webhookUrl, param?.userId, endpoints?.name]);

  // First-run: open the testing playground when arriving fresh from create.
  useEffect(() => {
    if (isNew) setIsTesting(true);
  }, [isNew]);

  // Metrics over the loaded request set (last 24h window where relevant).
  const last24 = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

  const successRate = () => {
    const reqs = endpoints?.requests ?? [];
    const recent = reqs.filter((r) => new Date(r.createdAt) > last24());
    if (!recent.length) return "—";
    const ok = recent.filter((r) => r.statusCode >= 200 && r.statusCode < 300).length;
    return `${Math.round((ok / recent.length) * 100)}%`;
  };

  const avgResponseTime = () => {
    const reqs = endpoints?.requests ?? [];
    const recent = reqs.filter((r) => new Date(r.createdAt) > last24());
    if (!recent.length) return "—";
    const avg = recent.reduce((a, r) => a + r.duration, 0) / recent.length;
    return `${Math.round(avg)}ms`;
  };

  const lastActivity = () =>
    endpoints?.lastActivity ? formatRelative(new Date(endpoints.lastActivity)) : "Never";

  const routeList = [
    { label: "Webhook Care", href: `/` },
    { label: "Dashboard", href: `/dashboard/${param?.userId}` },
    {
      label: endpoints?.name || param?.id || "",
      href: `/dashboard/${param?.userId}/${param?.id}`,
    },
  ];

  const samplePayload = {
    type: "user.created",
    data: {
      id: "usr_123456789",
      email: "john.doe@example.com",
      name: "John Doe",
      created_at: "2024-01-20T08:30:00Z",
      metadata: { source: "web_signup", plan: "starter" },
    },
  };

  const curlCommand = `curl -X POST ${fullWebhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(samplePayload)}'`;

  const handleClearAll = async () => {
    if (!param?.id) return;
    try {
      await deleteAllRequests(param.id);
      mutate();
      toast.success("All requests deleted");
    } catch {
      toast.error("Failed to delete requests");
    }
  };

  const copyUrl = () => {
    if (!fullWebhookUrl) return;
    navigator.clipboard.writeText(fullWebhookUrl);
    toast.success("Webhook URL copied");
  };

  // "Does this endpoint have any requests at all" — from the total counter, so
  // it stays true even when an active search returns an empty page.
  const hasAnyRequests = (endpoints?.requestCount ?? 0) > 0;
  const isSearching = debouncedSearch.length > 0;

  return (
    <main className="mx-auto max-w-[1180px] space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        ) : (
          <CustomBreadcrumb
            header={endpoints?.name || param?.id}
            description="Monitor and manage your webhook endpoint"
            routeList={routeList}
          />
        )}

        <div className="flex flex-shrink-0 items-center gap-2.5">
          <LiveToggle
            on={liveOn}
            status={liveStatus}
            searching={!!debouncedSearch}
            onToggle={() => setLiveOn((v) => !v)}
          />
          <Button
            variant={isTesting ? "default" : "outline"}
            className="gap-2"
            onClick={() => setIsTesting((v) => !v)}
          >
            <Play className="size-4" />
            Testing Playground
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
            <Download className="size-4" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/${param?.userId}/${param?.id}/edit`)}>
                <Pencil className="size-4" /> Edit endpoint
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyUrl}>
                <Copy className="size-4" /> Copy webhook URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!hasAnyRequests}
                onClick={() => setClearOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" /> Clear all requests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quiet summary strip — replaces the 4 hero KPI cards */}
      {!isLoading && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-dim">
          <Stat value={(endpoints?.requestCount ?? 0).toLocaleString()} unit="requests" />
          <span className="text-faint">·</span>
          <Stat value={successRate()} unit="2xx · 24h" />
          <span className="text-faint">·</span>
          <Stat value={avgResponseTime()} unit="avg · 24h" />
          <span className="text-faint">·</span>
          <span>last {lastActivity()}</span>
        </div>
      )}

      {isTesting && (
        <WebhookTestSection
          initialPayload={JSON.stringify(samplePayload)}
          url={fullWebhookUrl}
          isTesting={isTesting}
          onSent={() => mutate()}
        />
      )}

      {/* Integration */}
      <Panel>
        <SectionToggle
          title="Integration"
          open={integrationOpen}
          onToggle={() => setIntegrationOpen((v) => !v)}
        />
        {integrationOpen && (
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-mid">Webhook URL</p>
              <CodeBlock code={fullWebhookUrl || "…"} label="Webhook URL" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-mid">Sample cURL</p>
              <CodeBlock code={curlCommand} label="cURL command" />
            </div>
          </div>
        )}
      </Panel>

      {/* Forwarding */}
      {endpoints?.forwardingUrls && endpoints.forwardingUrls.length > 0 && (
        <Panel>
          <SectionToggle
            title="Forwarding"
            count={endpoints.forwardingUrls.length}
            open={forwardingOpen}
            onToggle={() => setForwardingOpen((v) => !v)}
          />
          {forwardingOpen && (
            <div className="space-y-2 p-5">
              {endpoints.forwardingUrls.map((fw) => (
                <div key={fw.id} className="flex items-center gap-2">
                  <MethodPill method={fw.method} />
                  <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-inset px-3 py-2 font-mono text-[12.5px] text-mid">
                    {fw.url}
                  </code>
                  <CopyButton text={fw.url} variant="outline" isIcon />
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Request History */}
      <Panel>
        <PanelHead
          title="Request history"
          count={isLoading ? undefined : displayRequests.length}
          right={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-dim"
              title="Refresh"
              onClick={() => mutate()}
            >
              <RefreshCcw className="size-4" />
            </Button>
          }
        />

        <div className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              placeholder="Search requests (body, method, status, content-type…)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-inset pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent-line focus:bg-card"
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-dim">Loading requests…</div>
          ) : displayRequests.length === 0 && isSearching ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Search className="size-8 text-faint" />
              <p className="text-sm font-semibold">No matching requests</p>
              <p className="text-[13px] text-dim">No requests match &quot;{debouncedSearch}&quot;.</p>
            </div>
          ) : displayRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-primary">
                <Activity className="size-5" strokeWidth={1.7} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">No requests yet</p>
                <p className="mx-auto max-w-sm text-[13px] text-dim">
                  Send your first webhook to this endpoint — use the Integration URL above or open
                  the Testing Playground.
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsTesting(true)}>
                <Play className="size-4" /> Open Testing Playground
              </Button>
            </div>
          ) : (
            <>
              <RequestList mutate={mutate} requests={displayRequests} webhookUrl={fullWebhookUrl} />
              {cursor && (
                <div className="flex justify-center pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                    {!loadingMore && <ChevronDown className="size-4" />}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Panel>

      {/* Overflow-menu actions (controlled) */}
      <ExportDialog
        userId={String(param?.userId ?? "")}
        endpointId={String(param?.id ?? "")}
        endpointName={endpoints?.name}
        open={exportOpen}
        onOpenChange={setExportOpen}
        hideTrigger
      />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all requests?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every captured request for{" "}
              <strong>{endpoints?.name || "this endpoint"}</strong>. Pinned requests are deleted
              too. This cannot be undone — export first if you want a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

/** Live-stream toggle + status pill for the inspector header. */
function LiveToggle({
  on,
  status,
  searching,
  onToggle,
}: {
  on: boolean;
  status: "closed" | "connecting" | "open";
  searching: boolean;
  onToggle: () => void;
}) {
  const live = on && !searching;
  const dot = !live
    ? "bg-faint"
    : status === "open"
      ? "bg-primary animate-pulse"
      : "bg-c2 animate-pulse";
  const label = searching
    ? "Live paused"
    : !on
      ? "Paused"
      : status === "open"
        ? "Live"
        : "Connecting…";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={searching}
      aria-pressed={live}
      title={
        searching
          ? "Live pauses while searching"
          : on
            ? "Pause the live stream"
            : "Resume the live stream"
      }
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
        live
          ? "border-accent-line bg-accent-soft text-primary"
          : "border-border text-dim hover:bg-elev2",
        searching && "cursor-not-allowed opacity-60"
      )}
    >
      <span className={cn("size-2 rounded-full", dot)} />
      {label}
    </button>
  );
}

/** Compact inline metric: bold value + dim unit. */
function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>{" "}
      <span className="text-dim">{unit}</span>
    </span>
  );
}

/** Collapsible section header used by Integration / Forwarding panels. */
function SectionToggle({
  title,
  count,
  open,
  onToggle,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 px-[18px] py-[13px] text-left transition-colors hover:bg-elev2",
        open && "border-b border-border"
      )}
    >
      <span className="text-sm font-semibold">{title}</span>
      {count != null && (
        <span className="rounded-full border border-border px-[7px] py-px font-mono text-[11px] text-dim tabular-nums">
          {count}
        </span>
      )}
      <ChevronDown
        className={cn("ml-auto size-4 flex-none text-dim transition-transform", open && "rotate-180")}
      />
    </button>
  );
}
