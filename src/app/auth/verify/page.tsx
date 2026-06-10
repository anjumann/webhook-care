"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Status = "verifying" | "success" | "error";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { get, set } = useLocalStorage<{ id: string; imageUrl: string }>("user");
  const [status, setStatus] = useState<Status>("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data?.userId) {
          setStatus("error");
          return;
        }
        // Adopt the canonical account's ULID on this device so it now operates
        // as the signed-in account (handles the merge case too).
        const existing = get();
        set({ id: data.userId, imageUrl: existing?.imageUrl ?? "zoro.jpg" });
        setStatus("success");
        router.replace(`/dashboard/${data.userId}`);
      } catch {
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {status === "verifying" && (
        <>
          <h1 className="text-xl font-semibold">Signing you in…</h1>
          <p className="mt-2 text-sm text-mid">Verifying your link.</p>
        </>
      )}
      {status === "success" && (
        <>
          <h1 className="text-xl font-semibold">You&apos;re in</h1>
          <p className="mt-2 text-sm text-mid">Taking you to your dashboard…</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-xl font-semibold">Link invalid or expired</h1>
          <p className="mt-2 text-sm text-mid">
            Magic links can only be used once and expire after 15 minutes.
            Request a fresh one from your dashboard.
          </p>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
