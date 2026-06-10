"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bookmark,
  Clock,
  Inbox,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn, formatRelative } from "@/lib/utils";
import { Panel, PanelHead } from "@/components/console/panel";
import { useApiClientStore } from "@/components/console/api-client-db";
import type {
  HeaderPair,
  HistoryEntry,
  SavedRequest,
} from "@/components/console/api-client-store";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
type Method = (typeof METHODS)[number];
const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

// Shared column template so the method/URL/Send row and each header row line up.
const ROW_GRID = "grid grid-cols-[112px_minmax(0,1fr)_auto] gap-2";

interface ProxyResponse {
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  truncated: boolean;
  contentType: string | null;
  headers: Record<string, string>;
  body: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function prettyBody(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function statusTone(status: number): string {
  if (status >= 200 && status < 300) return "bg-ok-soft text-ok";
  if (status >= 300 && status < 400) return "bg-c2/15 text-c2";
  if (status >= 400 && status < 500) return "bg-warn/15 text-warn";
  return "bg-danger-soft text-danger";
}

function methodTone(method: string): string {
  switch (method) {
    case "GET":
      return "text-c2";
    case "POST":
      return "text-ok";
    case "PUT":
    case "PATCH":
      return "text-warn";
    case "DELETE":
      return "text-danger";
    default:
      return "text-dim";
  }
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url;
  }
}

export function ApiClient({ userId }: { userId: string }) {
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<HeaderPair[]>([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<ProxyResponse | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Save dialog
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const store = useApiClientStore(userId);
  const showBody = BODY_METHODS.has(method);

  function setHeader(idx: number, field: "key" | "value", value: string) {
    setHeaders((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h)));
  }
  const addHeader = () => setHeaders((h) => [...h, { key: "", value: "" }]);
  const removeHeader = (idx: number) =>
    setHeaders((h) => (h.length === 1 ? [{ key: "", value: "" }] : h.filter((_, i) => i !== idx)));

  function beautify() {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      toast.error("Body isn't valid JSON");
    }
  }

  // Load a saved request / history entry back into the form.
  function loadRequest(r: SavedRequest | HistoryEntry) {
    setMethod((METHODS as readonly string[]).includes(r.method) ? (r.method as Method) : "GET");
    setUrl(r.url);
    setHeaders(r.headers.length ? r.headers : [{ key: "", value: "" }]);
    setBody(r.body);
    setRes(null);
    setActiveId(r.id);
  }

  function openSave() {
    if (!url.trim()) {
      toast.error("Enter a URL before saving");
      return;
    }
    setSaveName(`${method} ${urlPath(url)}`);
    setSaveOpen(true);
  }

  function confirmSave() {
    if (!saveName.trim()) {
      toast.error("Name it something");
      return;
    }
    const saved = store.saveRequest({
      name: saveName.trim(),
      method,
      url: url.trim(),
      headers: headers.filter((h) => h.key.trim()),
      body: showBody ? body : "",
    });
    setActiveId(saved.id);
    setSaveOpen(false);
    toast.success("Request saved");
  }

  async function send() {
    if (!url.trim()) {
      toast.error("Enter a URL first");
      return;
    }
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/tools/http", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          method,
          url: url.trim(),
          headers: headers.filter((h) => h.key.trim()),
          body: showBody && body ? body : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Request failed");
        return;
      }
      setRes(data as ProxyResponse);
      store.pushHistory({
        method,
        url: url.trim(),
        headers: headers.filter((h) => h.key.trim()),
        body: showBody ? body : "",
        status: (data as ProxyResponse).status,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <CollectionsRail
        saved={store.saved}
        history={store.history}
        activeId={activeId}
        onLoad={loadRequest}
        onDelete={store.deleteSaved}
        onClearHistory={store.clearHistory}
      />

      <div className="space-y-6">
        <Panel>
          <PanelHead
            title="Request"
            right={
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={openSave}>
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            }
          />

          <div className="space-y-5 p-5">
            {/* Method + URL + Send */}
            <div className={ROW_GRID}>
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger className={cn("font-semibold", methodTone(method))}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m} className={cn("font-semibold", methodTone(m))}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="min-w-0 font-mono text-sm"
                placeholder="https://api.example.com/v1/resource"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <Button onClick={send} disabled={loading} className="gap-2">
                <Send className="h-4 w-4" />
                {loading ? "Sending…" : "Send"}
              </Button>
            </div>

            {/* Headers — same grid so columns line up with the row above */}
            <div className="space-y-2">
              <Label className="text-xs text-mid">Headers</Label>
              <div className="space-y-2">
                {headers.map((h, idx) => (
                  <div key={idx} className={cn(ROW_GRID, "items-center")}>
                    <Input
                      className="min-w-0 font-mono text-xs"
                      placeholder="Header"
                      value={h.key}
                      onChange={(e) => setHeader(idx, "key", e.target.value)}
                    />
                    <Input
                      className="min-w-0 font-mono text-xs"
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => setHeader(idx, "value", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="justify-self-end text-dim hover:text-danger"
                      onClick={() => removeHeader(idx)}
                      disabled={headers.length === 1 && !h.key && !h.value}
                      aria-label="Remove header"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="self-start text-mid" onClick={addHeader}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add header
                </Button>
              </div>
            </div>

            {/* Body */}
            {showBody && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-mid">Request body</Label>
                  <Button variant="ghost" size="sm" className="text-mid" onClick={beautify}>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Beautify JSON
                  </Button>
                </div>
                <Textarea
                  className="min-h-32 font-mono text-xs"
                  placeholder={'{\n  "key": "value"\n}'}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
            )}
          </div>
        </Panel>

        {/* Response */}
        {res && (
          <Panel>
            <PanelHead
              title="Response"
              right={
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", statusTone(res.status))}>
                    {res.status} {res.statusText}
                  </span>
                  <span className="text-xs text-dim tabular-nums">{res.durationMs} ms</span>
                  <span className="text-xs text-dim tabular-nums">{formatBytes(res.sizeBytes)}</span>
                  {res.contentType && (
                    <Badge variant="outline" className="text-[10px]">
                      {res.contentType.split(";")[0]}
                    </Badge>
                  )}
                  {res.truncated && (
                    <Badge variant="outline" className="text-[10px] text-warn">
                      truncated
                    </Badge>
                  )}
                </div>
              }
            />
            <div className="space-y-4 p-5">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-mid">
                  Response headers ({Object.keys(res.headers).length})
                </summary>
                <pre className="scroll-thin mt-2 overflow-x-auto rounded-md bg-inset p-3 text-xs font-mono leading-relaxed">
                  {Object.entries(res.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n")}
                </pre>
              </details>

              <div className="space-y-1.5">
                <Label className="text-xs text-mid">Body</Label>
                <pre className="scroll-thin max-h-[480px] overflow-auto rounded-md bg-inset p-3 text-xs font-mono leading-relaxed">
                  {prettyBody(res.body) || "(empty)"}
                </pre>
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save request</DialogTitle>
            <DialogDescription>
              Stored in this browser only — your headers never leave your device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="save-name">Name</Label>
            <Input
              id="save-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmSave();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectionsRail({
  saved,
  history,
  activeId,
  onLoad,
  onDelete,
  onClearHistory,
}: {
  saved: SavedRequest[];
  history: HistoryEntry[];
  activeId: string | null;
  onLoad: (r: SavedRequest | HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearHistory: () => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const matchedSaved = useMemo(
    () =>
      saved.filter(
        (r) =>
          !query ||
          r.name.toLowerCase().includes(query) ||
          r.url.toLowerCase().includes(query)
      ),
    [saved, query]
  );
  const matchedHistory = useMemo(
    () => history.filter((h) => !query || h.url.toLowerCase().includes(query)),
    [history, query]
  );

  const empty = saved.length === 0 && history.length === 0;

  return (
    <Panel className="self-start lg:sticky lg:top-6">
      <PanelHead title="Collections" count={saved.length || undefined} />
      <div className="space-y-3 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search saved & recent…"
            aria-label="Search saved and recent requests"
            className="h-8 w-full rounded-md border border-border bg-inset pl-8 pr-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent-line focus:bg-card"
          />
        </div>

        {empty ? (
          <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
            <div className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-primary">
              <Inbox className="size-4" strokeWidth={1.7} />
            </div>
            <p className="text-xs text-dim">
              Saved requests and your recent sends will show up here.
            </p>
          </div>
        ) : (
          <div className="scroll-thin max-h-[560px] space-y-3 overflow-y-auto">
            {saved.length > 0 && (
              <section className="space-y-1">
                <p className="flex items-center gap-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
                  <Bookmark className="size-3" /> Saved
                </p>
                {matchedSaved.length === 0 ? (
                  <p className="px-1 py-1 text-[11px] text-dim">No matches.</p>
                ) : (
                  matchedSaved.map((r) => (
                    <RailItem
                      key={r.id}
                      method={r.method}
                      title={r.name}
                      subtitle={urlPath(r.url)}
                      active={r.id === activeId}
                      onLoad={() => onLoad(r)}
                      onDelete={() => onDelete(r.id)}
                    />
                  ))
                )}
              </section>
            )}

            {history.length > 0 && (
              <section className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
                    <Clock className="size-3" /> Recent
                  </p>
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="text-[10px] text-dim transition-colors hover:text-danger"
                  >
                    Clear
                  </button>
                </div>
                {matchedHistory.length === 0 ? (
                  <p className="px-1 py-1 text-[11px] text-dim">No matches.</p>
                ) : (
                  matchedHistory.map((h) => (
                    <RailItem
                      key={h.id}
                      method={h.method}
                      title={urlPath(h.url)}
                      subtitle={`${h.status ?? "—"} · ${formatRelative(new Date(h.at))}`}
                      active={h.id === activeId}
                      onLoad={() => onLoad(h)}
                    />
                  ))
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function RailItem({
  method,
  title,
  subtitle,
  active,
  onLoad,
  onDelete,
}: {
  method: string;
  title: string;
  subtitle: string;
  active?: boolean;
  onLoad: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
        active
          ? "border-accent-line bg-accent-soft"
          : "border-transparent hover:border-border hover:bg-elev2"
      )}
    >
      <button type="button" onClick={onLoad} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className={cn("w-10 flex-none font-mono text-[10px] font-bold uppercase", methodTone(method))}>
          {method}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-medium leading-tight">{title}</span>
          <span className="block truncate font-mono text-[10.5px] text-dim">{subtitle}</span>
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete saved request"
          className="flex-none rounded p-1 text-dim opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export default ApiClient;
