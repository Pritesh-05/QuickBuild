import { createFileRoute, redirect } from "@tanstack/react-router";

/** /admin by itself just forwards to the Parts console — there's nothing to
 * land on at the bare layout route. */
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/parts" });
  },
});