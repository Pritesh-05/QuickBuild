import { Link, useRouteContext, useRouter, useRouterState } from "@tanstack/react-router";
import { Boxes, LogOut, Package, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { signOutFn } from "@/lib/functions/auth.functions";

const ADMIN_NAV = [
  { to: "/admin/parts", label: "Parts", icon: Package },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/models", label: "Models", icon: Boxes },
] as const;

/** Full replacement for SiteHeader/SiteFooter on every /admin/* route (see
 * the "/admin" prefix check in __root.tsx) — an admin managing the catalog
 * or user roles should never see the consumer nav ("Start Building", Home,
 * Compare) or marketing footer a builder sees. This is a separate console,
 * not another page in the site. */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useRouteContext({ from: "__root__" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await signOutFn();
    await router.invalidate();
    await router.navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 overflow-x-auto px-5 sm:gap-6 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
              <ShieldCheck className="size-3.5" />
            </span>
            <span className="mono-label text-foreground">quickbuild admin</span>
          </div>

          <nav className="flex items-center gap-1">
            {ADMIN_NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "mono-label inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <span className="mono-label hidden text-muted-foreground md:inline">
                {user.email}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}