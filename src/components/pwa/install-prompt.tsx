"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The `beforeinstallprompt` event is not in the standard DOM lib types, so we
 * type it explicitly. Only Chromium-based browsers fire it.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "wcat:pwa-install-dismissed";

/**
 * Subtle, dismissible "Install app" button. Captures `beforeinstallprompt`,
 * defers it, and calls `prompt()` on click. Hidden when the app is already
 * installed (standalone display-mode) or after the user dismisses it.
 *
 * Renders nothing until a deferred prompt is available, so it stays invisible
 * on browsers that don't support installation (e.g. desktop Safari).
 */
export function InstallPrompt() {
  const deferredRef = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Already installed → never show.
    if (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari standalone flag.
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      return;
    }

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // localStorage may be unavailable (private mode); treat as not dismissed.
    }
    if (dismissed) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredRef.current = event as BeforeInstallPromptEvent;
      setVisible(true);
    };

    const onInstalled = () => {
      deferredRef.current = null;
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = React.useCallback(async () => {
    const deferred = deferredRef.current;
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferredRef.current = null;
    setVisible(false);
    if (outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // ignore — best-effort persistence.
      }
    }
  }, []);

  const handleDismiss = React.useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore — best-effort persistence.
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="inline-flex items-center gap-1 rounded-sm border border-border bg-elev pl-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstall}
        className="h-8 gap-1.5 px-2 text-[13px] text-mid hover:text-foreground"
      >
        <Download className="size-[15px]" strokeWidth={1.7} />
        Install app
      </Button>
      <button
        type="button"
        aria-label="Dismiss install prompt"
        onClick={handleDismiss}
        className="flex size-8 items-center justify-center rounded-sm text-dim transition-colors hover:text-foreground"
      >
        <X className="size-[14px]" strokeWidth={1.7} />
      </button>
    </div>
  );
}

export default InstallPrompt;
