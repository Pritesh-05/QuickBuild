/**
 * Logs errors caught by the root route's error boundary. Kept as a thin
 * wrapper (rather than a bare console.error at the call site) so a real
 * error-tracking service (Sentry, etc.) can be dropped in here later
 * without touching __root.tsx.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[QuickBuild]", message, { context, error });
}
