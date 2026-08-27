/**
 * PostHog analytics helper.
 * Initializes posthog-js and re-exports the singleton for use throughout the app.
 */
import posthog from "posthog-js";

const token = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined;

if (!token || !host) {
  if (import.meta.env.DEV) {
    console.error(
      "VITE_PUBLIC_POSTHOG_KEY or VITE_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, " +
        "this causes events to be silently missed. " +
        "This error stops appearing once VITE_PUBLIC_POSTHOG_KEY and VITE_PUBLIC_POSTHOG_HOST are configured",
    );
  }
} else {
  posthog.init(token, {
    api_host: host,
    defaults: "2026-05-30",
    capture_pageview: false, // We handle pageviews manually via router
  });
}

export { posthog };
