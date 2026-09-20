import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { amIAdmin } from "@/lib/functions/catalog.functions";
import { AdminShell } from "@/components/admin/admin-shell";

/** Layout route for everything under /admin/*. The auth + admin guard lives
 * here once, so admin.parts.tsx and admin.users.tsx don't each need to
 * repeat it — beforeLoad on a parent route runs before any child route's
 * loader. */
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" });
    const isAdmin = await amIAdmin();
    if (!isAdmin) throw redirect({ to: "/account" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      {/* Child routes (admin.index / admin.parts / admin.users) render here. */}
      <Outlet />
    </AdminShell>
  );
}