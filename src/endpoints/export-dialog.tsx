"use client";

import { useEffect, useMemo, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/lib/toast";
import { useEndpoints } from "./api/endpoints";

type Scope = "this" | "all";
type Format = "ndjson" | "json" | "csv";

interface ExportDialogProps {
  userId: string;
  /** Single-endpoint mode (endpoint detail page): export this endpoint or all. */
  endpointId?: string;
  endpointName?: string;
  /** Multi-select mode (dashboard): pick which endpoints to include. */
  multiSelect?: boolean;
  /** Trigger button label (defaults to "Export"). */
  triggerLabel?: string;
  /** Controlled-open mode (e.g. opened from an overflow menu). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in trigger button (when opened externally). */
  hideTrigger?: boolean;
}

/**
 * Export dialog — gathers scope / date range / include / format and POSTs to
 * `/api/export`, then streams the returned ZIP to a browser download.
 *
 * Two modes:
 *  - single  (detail page): radio "This endpoint" (default) vs "All endpoints"
 *  - multi   (dashboard):   checkbox list of endpoints, all selected by default
 */
export function ExportDialog({
  userId,
  endpointId,
  endpointName,
  multiSelect = false,
  triggerLabel = "Export",
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: ExportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setInternalOpen(next));
  const [busy, setBusy] = useState(false);

  const [scope, setScope] = useState<Scope>(endpointId ? "this" : "all");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeBody, setIncludeBody] = useState(true);
  const [hideSensitive, setHideSensitive] = useState(true);
  const [format, setFormat] = useState<Format>("json");

  // `endpointId` arrives asynchronously on the detail page, so re-assert the
  // "this endpoint" default once it's known.
  useEffect(() => {
    if (endpointId) setScope("this");
  }, [endpointId]);

  // Multi-select mode: load the user's endpoints and select them all by default.
  const { endpoints } = useEndpoints(multiSelect ? userId : "");
  const allIds = useMemo(() => (endpoints ?? []).map((e) => e.id), [endpoints]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Default to all endpoints whenever the dialog opens with a fresh list.
    if (multiSelect && open && allIds.length) setSelected(new Set(allIds));
  }, [multiSelect, open, allIds]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExport() {
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        userId,
        redact: hideSensitive,
        includeHeaders,
        includeBody,
        format,
      };

      if (multiSelect) {
        if (selected.size === 0) {
          toast.error("Select at least one endpoint");
          setBusy(false);
          return;
        }
        // All selected → omit (export everything); otherwise send the subset.
        if (selected.size < allIds.length) body.endpointIds = [...selected];
      } else if (scope === "this" && endpointId) {
        body.endpointIds = [endpointId];
      }

      if (since) body.since = new Date(since).toISOString();
      if (until) body.until = new Date(until).toISOString();

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "webhook-catcher-export.zip";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Export downloaded");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" /> {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export webhooks</DialogTitle>
          <DialogDescription>
            Download a ZIP archive of your endpoints and captured requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Scope — multi-select list (dashboard) or radio (detail) */}
          {multiSelect ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Endpoints</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() =>
                    setSelected(
                      selected.size === allIds.length ? new Set() : new Set(allIds)
                    )
                  }
                >
                  {selected.size === allIds.length ? "Clear all" : "Select all"}
                </button>
              </div>
              <ScrollArea className="h-40 rounded-md border">
                <div className="p-2 space-y-1">
                  {(endpoints ?? []).map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selected.has(e.id)}
                        onCheckedChange={() => toggle(e.id)}
                      />
                      <span className="truncate">{e.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {e.requestCount}
                      </span>
                    </label>
                  ))}
                  {!endpoints?.length && (
                    <p className="px-2 py-3 text-sm text-muted-foreground">
                      No endpoints to export.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            endpointId && (
              <div className="space-y-2">
                <Label>Scope</Label>
                <RadioGroup
                  value={scope}
                  onValueChange={(v) => setScope(v as Scope)}
                  className="flex flex-col gap-2"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="this" id="scope-this" />
                    This endpoint{endpointName ? ` (${endpointName})` : ""}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="all" id="scope-all" />
                    All endpoints
                  </label>
                </RadioGroup>
              </div>
            )
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="since" className="text-xs">From (optional)</Label>
              <input
                id="since"
                type="date"
                value={since}
                onChange={(e) => setSince(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="until" className="text-xs">To (optional)</Label>
              <input
                id="until"
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="headers" className="font-normal">Include headers</Label>
              <Switch id="headers" checked={includeHeaders} onCheckedChange={setIncludeHeaders} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="body" className="font-normal">Include body</Label>
              <Switch id="body" checked={includeBody} onCheckedChange={setIncludeBody} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor="hide" className="font-normal">Hide sensitive data</Label>
                <p className="text-xs text-muted-foreground">
                  Masks tokens, signatures and raw payloads.
                </p>
              </div>
              <Switch id="hide" checked={hideSensitive} onCheckedChange={setHideSensitive} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">Pretty JSON</SelectItem>
                <SelectItem value="ndjson">NDJSON (one request per line)</SelectItem>
                <SelectItem value="csv">CSV summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={busy}>
            {busy ? "Preparing…" : "Download ZIP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
