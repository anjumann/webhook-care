"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

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

/** Pretty-print a JSON body; fall back to the raw text for anything else. */
function prettyBody(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function statusTone(status: number): string {
  if (status >= 200 && status < 300) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (status >= 300 && status < 400) return "bg-sky-500/15 text-sky-600 dark:text-sky-400";
  if (status >= 400 && status < 500) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-red-500/15 text-red-600 dark:text-red-400";
}

export function ApiClient({ userId }: { userId: string }) {
  const [method, setMethod] = useState<(typeof METHODS)[number]>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<ProxyResponse | null>(null);

  const showBody = BODY_METHODS.has(method);

  function setHeader(idx: number, field: "key" | "value", value: string) {
    setHeaders((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h)));
  }
  const addHeader = () => setHeaders((h) => [...h, { key: "", value: "" }]);
  const removeHeader = (idx: number) => setHeaders((h) => h.filter((_, i) => i !== idx));

  function beautify() {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      toast.error("Body isn't valid JSON");
    }
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5">
          {/* Method + URL */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={method} onValueChange={(v) => setMethod(v as (typeof METHODS)[number])}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1 font-mono text-sm"
              placeholder="https://api.example.com/v1/resource"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <Button onClick={send} disabled={loading} className="sm:w-auto">
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Sending…" : "Send"}
            </Button>
          </div>

          {/* Headers */}
          <div className="space-y-2">
            <Label>Headers</Label>
            <div className="flex flex-col gap-2">
              {headers.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    className="w-44 font-mono text-xs"
                    placeholder="Header"
                    value={h.key}
                    onChange={(e) => setHeader(idx, "key", e.target.value)}
                  />
                  <Input
                    className="flex-1 font-mono text-xs"
                    placeholder="Value"
                    value={h.value}
                    onChange={(e) => setHeader(idx, "value", e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(idx)}
                    disabled={headers.length === 1}
                    aria-label="Remove header"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="self-start" onClick={addHeader}>
                <Plus className="mr-1.5 h-4 w-4" /> Add header
              </Button>
            </div>
          </div>

          {/* Body */}
          {showBody && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Request body</Label>
                <Button variant="ghost" size="sm" onClick={beautify}>
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
        </CardContent>
      </Card>

      {/* Response */}
      {res && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded px-2 py-0.5 text-sm font-semibold ${statusTone(res.status)}`}>
                {res.status} {res.statusText}
              </span>
              <span className="text-xs text-muted-foreground">{res.durationMs} ms</span>
              <span className="text-xs text-muted-foreground">{formatBytes(res.sizeBytes)}</span>
              {res.contentType && (
                <Badge variant="outline" className="text-[10px]">
                  {res.contentType.split(";")[0]}
                </Badge>
              )}
              {res.truncated && (
                <Badge variant="outline" className="text-[10px] text-amber-600">
                  truncated
                </Badge>
              )}
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Response headers ({Object.keys(res.headers).length})
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono leading-relaxed">
                {Object.entries(res.headers)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")}
              </pre>
            </details>

            <div className="space-y-1">
              <Label>Body</Label>
              <pre className="max-h-[480px] overflow-auto rounded-md bg-muted p-3 text-xs font-mono leading-relaxed">
                {prettyBody(res.body) || "(empty)"}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ApiClient;
