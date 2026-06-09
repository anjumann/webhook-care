export const APP_NAME = "Webhook Catcher";

export const APP_DESCRIPTION = "A modern webhook testing and debugging platform. Create endpoints, inspect requests, and forward webhooks to multiple destinations.";

export const APP_VERSION = "1.0.0";

/**
 * HTTP methods, recolored to the Emerald Console ramp.
 * Methods render mono-bold; `color` is a Tailwind text token from the ramp
 * (`text-c1..c4` / `text-warn` / `text-danger`). Most methods read in the
 * brand accent; destructive/mutating verbs get a distinguishing hue.
 */
export const METHODS = {
    GET: {
        label: "GET",
        color: "text-c2",
    },
    POST: {
        label: "POST",
        color: "text-primary",
    },
    PUT: {
        label: "PUT",
        color: "text-c3",
    },
    DELETE: {
        label: "DELETE",
        color: "text-danger",
    },
    PATCH: {
        label: "PATCH",
        color: "text-warn",
    },
    OPTIONS: {
        label: "OPTIONS",
        color: "text-c4",
    },
    HEAD: {
        label: "HEAD",
        color: "text-dim",
    },
}