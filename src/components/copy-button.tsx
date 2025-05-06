"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
}

export function CopyButton({ text, label, variant = "outline" }: CopyButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={() => copyToClipboard(text)}
    >
      <Copy className="mr-2 h-4 w-4" />
      {label || "Copy URL"}
    </Button>
  );
} 