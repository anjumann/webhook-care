"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

/**
 * "Save / claim your dashboard" — sends a magic link so the anonymous ULID
 * dashboard can be recovered and accessed across devices. Optional; anonymous
 * stays the default.
 */
export function ClaimAccount({ claimedEmail }: { claimedEmail?: string | null }) {
  const { id } = useUser();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !email) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId: id }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      toast.success("Check your inbox for a sign-in link.");
    } catch {
      toast.error("Could not send the link. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (claimedEmail) {
    return (
      <p className="text-[13px] text-mid">
        This dashboard is saved to{" "}
        <span className="font-medium text-fg">{claimedEmail}</span>. You can sign
        in on any device with a magic link.
      </p>
    );
  }

  if (sent) {
    return (
      <p className="text-[13px] text-mid">
        We sent a sign-in link to <span className="font-medium">{email}</span>.
        It expires in 15 minutes.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="sm:max-w-xs"
      />
      <Button type="submit" disabled={sending || !email}>
        {sending ? "Sending…" : "Email me a link"}
      </Button>
    </form>
  );
}

export default ClaimAccount;
