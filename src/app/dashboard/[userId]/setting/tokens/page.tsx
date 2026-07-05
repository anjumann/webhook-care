"use client";

import { useState } from "react";
import useSWR from "swr";
import { useUser } from "@/hooks/useUser";
import { useSession } from "@/components/auth/session-provider";
import CustomBreadcrumb from "@/components/custom-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Bot, Copy, KeyRound, Sparkles, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { track } from "@/lib/analytics";
import { guardedFetch } from "@/lib/guarded-fetch";
import { CodeBlock } from "@/components/console/code-block";
import type { Endpoint } from "@/endpoints/types";

interface ApiTokenRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const fetcher = async (url: string) => {
  const res = await guardedFetch(url);
  if (!res.ok) throw new Error("Failed to load tokens");
  return res.json();
};

export default function TokensPage() {
  const { id } = useUser();
  const { ready } = useSession();

  const { data: tokens, mutate } = useSWR<ApiTokenRow[]>(
    ready && id ? `/api/tokens?userId=${id}` : null,
    fetcher
  );

  // Used only to pre-fill a real <endpointId> in the example snippets.
  const { data: endpoints } = useSWR<Endpoint[]>(
    ready && id ? `/api/endpoints?userId=${id}` : null,
    fetcher
  );

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-app";

  // When a token was just created we have the raw value exactly once — inject it
  // (and a real endpoint id) into the snippets so they're copy-and-run ready.
  const tokenValue = newToken ?? "wcat_your_token";
  const endpointId = endpoints?.[0]?.id ?? "<endpointId>";
  const filled = newToken !== null;

  const restSnippet = `# List your endpoints
curl ${origin}/api/v1/endpoints \\
  -H "Authorization: Bearer ${tokenValue}"

# Fetch captured requests for an endpoint (paginated + filterable)
curl "${origin}/api/v1/endpoints/${endpointId}/requests?limit=25&method=POST" \\
  -H "Authorization: Bearer ${tokenValue}"

# Fetch one request in full
curl ${origin}/api/v1/requests/<requestId> \\
  -H "Authorization: Bearer ${tokenValue}"`;

  const mcpAddSnippet = `# Claude Code / Claude Desktop (remote MCP over HTTP)
claude mcp add --transport http webhook-catcher ${origin}/api/mcp \\
  --header "Authorization: Bearer ${tokenValue}"`;

  const mcpJsonSnippet = `{
  "mcpServers": {
    "webhook-catcher": {
      "url": "${origin}/api/mcp",
      "headers": { "Authorization": "Bearer ${tokenValue}" }
    }
  }
}`;

  async function handleCreate() {
    if (!id || !name.trim()) return;
    setCreating(true);
    try {
      const res = await guardedFetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, name: name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create token");
      }
      const data = await res.json();
      setNewToken(data.token); // shown exactly once
      setName("");
      mutate();
      track("token_created");
      toast.success("Token created — copy it now");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create token");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    try {
      const res = await guardedFetch(`/api/tokens/${tokenId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke token");
      mutate();
      toast.success("Token revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke token");
    }
  }

  const routeList = [
    { label: "Webhook Catcher", href: `/` },
    { label: "Dashboard", href: `/dashboard/${id}` },
    { label: "API Tokens", href: `/dashboard/${id}/setting/tokens` },
  ];

  return (
    <div className="mx-auto py-6">
      <CustomBreadcrumb
        header="API Tokens"
        description="Read-only Personal Access Tokens for agents and the REST API."
        routeList={routeList}
      />

      <Card className="my-8">
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="token-name">Create a token</Label>
            <div className="flex gap-2">
              <Input
                id="token-name"
                placeholder="e.g. Claude agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
              <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                <KeyRound className="w-4 h-4 mr-2" />
                {creating ? "Creating…" : "Create"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Grants read-only access: <code>endpoints:read</code>, <code>requests:read</code>.
            </p>
          </div>

          {newToken && (
            <div className="rounded-md border border-primary/40 bg-accent-soft p-3 space-y-2">
              <p className="text-sm font-medium">Copy your token now — it won&apos;t be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-muted px-2 py-1.5 text-xs font-mono">
                  {newToken}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(newToken);
                    toast.success("Token copied");
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNewToken(null)}>
                Done
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Your tokens</Label>
            {!tokens?.length ? (
              <p className="text-sm text-muted-foreground py-4">No tokens yet.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {tokens.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{t.name}</span>
                        <code className="text-xs text-muted-foreground">{t.prefix}…</code>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {t.scopes.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                        <span>
                          ·{" "}
                          {t.lastUsedAt
                            ? `last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                            : "never used"}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke this token?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Any agent or script using <strong>{t.name}</strong> will immediately lose access. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(t.id)}>
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="my-8">
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Using your token</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Send the token as a <code>Bearer</code> header to the read-only REST
              API. It can list your endpoints and read captured requests — it can
              never delete, replay, or modify anything.
            </p>
          </div>

          {filled && (
            <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-accent-soft px-3 py-2 text-xs text-foreground">
              <Sparkles className="h-3.5 w-3.5 flex-none text-primary" />
              <span>
                Snippets below are filled with your new token{endpoints?.[0] ? " and a real endpoint" : ""} — copy and run.
              </span>
            </div>
          )}

          <CodeBlock code={restSnippet} label="curl example" />

          <div className="flex items-start gap-2 rounded-md border p-3 text-sm text-muted-foreground">
            <Bot className="mt-0.5 h-4 w-4 flex-none text-primary" />
            <span>
              <strong className="text-foreground">Connect an AI agent (MCP):</strong>{" "}
              the same token lets agents like Claude connect to your webhooks over
              the Model Context Protocol — read-only tools{" "}
              <code>list_endpoints</code>, <code>get_requests</code>,{" "}
              <code>get_request</code>. Add the server below, then ask your agent
              to list your endpoints.
            </span>
          </div>

          <CodeBlock code={mcpAddSnippet} label="MCP add command" />

          <div className="space-y-1">
            <p className="text-sm font-medium">Generic MCP client config</p>
            <CodeBlock code={mcpJsonSnippet} label="MCP config" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
