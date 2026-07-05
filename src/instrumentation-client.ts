// Client-side PostHog init (Next.js picks up `instrumentation-client.ts`
// automatically, runs before hydration). Product analytics only.
//
// Privacy contract — this app redacts secrets at the edge, and analytics honors
// the same rule: NO payload content ever reaches PostHog. Autocapture and
// session replay are OFF (both could scrape payload DOM); we send only the
// explicit, curated events in `src/lib/analytics.ts`. `identified_only` keeps
// anonymous visitors profile-free (cheaper) until we identify() a known ULID.
// See docs/specs/16-analytics-posthog.md.
import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host: "/ingest", // reverse-proxied in next.config.ts
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30", // current bundle: auto SPA $pageview/$pageleave
    person_profiles: "identified_only",
    autocapture: false,
    disable_session_recording: true,
    capture_exceptions: true,
  });
}
