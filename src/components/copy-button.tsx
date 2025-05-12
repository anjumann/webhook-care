"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  isIcon?: boolean;
}

export function CopyButton({ text, label, variant = "outline", isIcon = false }: CopyButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={() => copyToClipboard(text)}
      size={isIcon ? "icon" : "sm"}
      className="cursor-pointer"
    >
      {isIcon ? <Copy className={`${!isIcon ? "mr-2" : ""} h-2 w-2`} /> : <> <Copy className={`${!isIcon ? "" : "mr-2"} h-2 w-2`} /> {label ?? "Copy URL"} </> }
    </Button>
  );
} 