"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface CodeBlockProps {
  /** The exact text copied to the clipboard (and rendered). */
  code: string;
  /** Optional toast label, e.g. "curl command". */
  label?: string;
  className?: string;
}

/**
 * A copy-to-clipboard code block. The copy button reveals on hover/focus and
 * copies the full `code` verbatim — used for curl/MCP snippets so a developer
 * can grab a ready-to-run command in one click.
 */
export function CodeBlock({ code, label, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(label ? `${label} copied` : "Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — copy manually");
    }
  }

  return (
    <div className={cn("group relative", className)}>
      <button
        type="button"
        onClick={copy}
        aria-label={label ? `Copy ${label}` : "Copy to clipboard"}
        className="absolute right-2 top-2 z-10 rounded-md border bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur-sm transition hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre className="overflow-x-auto rounded-md bg-muted p-3 pr-12 text-xs font-mono leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
