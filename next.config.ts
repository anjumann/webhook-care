import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reverse-proxy PostHog through our own origin so ad-blockers don't eat
  // analytics. `/ingest` → PostHog ingestion; `/ingest/static|array` → assets.
  // See docs/specs/16-analytics-posthog.md §3.
  skipTrailingSlashRedirect: true, // PostHog endpoints use trailing slashes (e.g. /e/)
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
