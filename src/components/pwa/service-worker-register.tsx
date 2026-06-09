"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell service worker (`/sw.js`).
 *
 * Production-only: registering in dev interferes with Turbopack HMR and can
 * serve stale chunks. Guarded for `serviceWorker` support so it no-ops on
 * unsupported browsers. Renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal; the app works without the SW.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;
