import { Link, useRouter, useRouteContext } from "@tanstack/react-router";
import { Cpu, Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ALL_PARTS } from "@/data/catalog";
import { signOutFn } from "@/lib/functions/auth.functions";
import { amIAdmin } from "@/lib/functions/catalog.functions";

const NAV = [
  { to: "/", label: "Home", meta: "00" },
  { to: "/compare", label: "Compare", meta: "01" },
  { to: "/build", label: "Builder", meta: "02" },
  { to: "/buy", label: "Where to Buy", meta: "03" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useRouteContext({ from: "__root__" });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => amIAdmin(),
    enabled: Boolean(user),
  });

  async function handleSignOut() {
    await signOutFn();
    await router.invalidate();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-6 px-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-300 group-hover:rotate-6">
            <Cpu className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.03em]">QuickBuild</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {!isAdmin && NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="mono-label rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent !text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="mono-label hidden text-muted-foreground lg:inline">
            v1.0 · catalog {ALL_PARTS.length} parts
          </span>
          {!isAdmin && (
            <Link
              to="/build"
              className="mono-label hidden rounded-md bg-primary px-4 py-2.5 text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lift sm:inline-flex"
            >
              Start Building
            </Link>
          )}
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/account"
                className="mono-label inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-foreground transition-colors hover:bg-accent"
              >
                <User className="size-3.5" />
                {user.displayName}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="mono-label hidden rounded-md border border-border px-4 py-2.5 text-foreground transition-colors hover:bg-accent sm:inline-flex"
            >
              Log In
            </Link>
          )}
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent md:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-border/70 transition-[grid-template-rows] duration-300 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-transparent",
        )}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-5 py-3">
            {!isAdmin && NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                className="mono-label flex items-center justify-between rounded-md px-3 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent !text-foreground" }}
              >
                {item.label}
                <span className="text-muted-foreground/60">{item.meta}</span>
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="mono-label flex items-center justify-between rounded-md px-3 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {user.displayName}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void handleSignOut();
                  }}
                  className="mono-label flex items-center justify-between rounded-md px-3 py-3 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mono-label flex items-center justify-between rounded-md px-3 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
