"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => copyToClipboard(text)}
    >
      <Copy className="mr-2 h-4 w-4" />
      Copy URL
    </Button>
  );
} 