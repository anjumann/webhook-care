"use client";

import * as React from "react";
import { Toaster as SileoToaster } from "sileo";
import { useTheme } from "next-themes";

/**
 * Sileo toast host, themed off next-themes so toasts match the active
 * light/dark mode. Keyed on the resolved theme so Sileo re-reads it when the
 * user toggles, and gated on mount to avoid a hydration mismatch.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const theme = resolvedTheme !== "light" ? "light" : "dark";

  return <SileoToaster key={theme} position="top-center" theme={"light"} />;
}

export default Toaster;
