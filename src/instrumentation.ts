// Server-side instrumentation. `register()` runs once when the Node server boots
// (Next.js instrumentation hook). Ships server logs to PostHog via OpenTelemetry
// OTLP. No-op unless a PostHog key is set (so CI/builds without one stay clean)
// and only on the Node runtime (never edge). See docs/specs/16-analytics-posthog.md.
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const exporter = new OTLPLogExporter({
    url: "https://us.i.posthog.com/otlp/v1/logs",
    headers: { Authorization: `Bearer ${key}` },
  });

  // Note: @opentelemetry/sdk-logs ≥0.2xx takes processors in the constructor —
  // the older `addLogRecordProcessor(...)` method was removed.
  const loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "webhook-care" }),
    processors: [new SimpleLogRecordProcessor({ exporter })],
  });

  // Expose the logger globally so route handlers can emit structured logs.
  (globalThis as unknown as { __posthogLogger?: unknown }).__posthogLogger =
    loggerProvider.getLogger("webhook-care");
}
