import posthog from "posthog-js";

if (!process.env.NEXT_PUBLIC_POSTHOG_KEY)
  throw new Error(
    "[PostHog] Missing NEXT_PUBLIC_POSTHOG_KEY environment variable",
  );

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
});
