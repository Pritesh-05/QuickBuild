import { useEffect, useState } from "react";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import {
  Box,
  ChevronRight,
  FolderOpen,
  LogIn,
  LogOut,
  Menu,
  Play,
  Power,
  Settings2,
  User,
  X,
} from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { useCatalog } from "@/hooks/use-catalog";
import { Viewer } from "@/components/three/viewer";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

const BOOT_LOG = [
  "init chassis bus ............ ok",
  "mount parts catalog ......... ok",
  "load compatibility rules .... ok",
  "spin up 3d viewport ......... ok",
];

const NAV = [
  { to: "/build", label: "Configurator" },
  { to: "/compare", label: "Comparison bay" },
  { to: "/account", label: "Saved builds" },
  { to: "/admin", label: "Catalog admin" },
] as const;

export function HomePage() {
  const { data: catalog } = useCatalog();
  const { user } = useRouteContext({ from: "__root__" });
  const router = useRouter();

  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [powered, setPowered] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [clock, setClock] = useState("--:--:--");

  function handleStart() {
    void router.navigate({ to: "/build", viewTransition: true });
  }

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const allParts = Object.values(catalog).flat();
  const categoryLists = Object.values(catalog).filter((list) => list.length > 0);
  const avgBuildPrice = categoryLists.length
    ? categoryLists.reduce(
        (sum, list) => sum + list.reduce((s, p) => s + p.price, 0) / list.length,
        0,
      )
    : 0;

  if (!powered) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="mono-label text-muted-foreground">session terminated</p>
        <h1 className="display-lg mt-4">Power off</h1>
        <p className="mono-data mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          The workstation has been shut down. Nothing was lost — your build stays on this device.
        </p>
        <button
          type="button"
          onClick={() => setPowered(true)}
          className="mono-label mt-8 inline-flex items-center gap-2 border border-brand px-5 py-3 text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          <Power className="size-3.5" /> Restart
        </button>
      </main>
    );
  }

  // UPDATED: Now featuring 5 dedicated buttons, including an explicit Login/Profile button
  const commands = [
    {
      key: "start",
      label: "Start",
      hint: "New build",
      icon: Play,
      onClick: handleStart,
    },
    {
      key: "load",
      label: "Load",
      hint: "Saved builds",
      icon: FolderOpen,
      onClick: () => void router.navigate({ to: "/account" }),
    },
    {
      key: "login",
      label: user ? "Profile" : "Login",
      hint: user ? "Your account" : "Sign in",
      icon: user ? User : LogIn,
      onClick: () => void router.navigate({ to: user ? "/account" : "/login" }),
    },
    {
      key: "settings",
      label: "Settings",
      hint: "Preferences",
      icon: Settings2,
      onClick: () => setSettingsOpen(true),
    },
    {
      key: "exit",
      label: "Exit",
      hint: "Shut down",
      icon: LogOut,
      onClick: () => setPowered(false),
    },
  ];

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ambient chassis + grid */}
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute inset-0 hidden items-center justify-center opacity-[0.22] md:flex">
        <Viewer mode="build" autoRotate enableZoom={false} className="h-[85vh] w-[85vw] border-0" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />

      {/* Title rail */}
      <header className="relative z-20 flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setNavOpen(true)}
          className="flex size-9 items-center justify-center border border-border text-foreground transition-colors hover:border-brand hover:text-brand"
        >
          <Menu className="size-4" />
        </button>
        <p className="mono-label text-muted-foreground">menu screen // on enter</p>
        <span className="mono-data hidden text-[12px] text-muted-foreground sm:block">{clock}</span>
        <span className="mono-data text-[12px] text-muted-foreground sm:hidden">
          {allParts.length}p
        </span>
      </header>

      {/* Center console */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="hud-brackets anim-boot relative border border-border bg-card/70 px-8 py-9 backdrop-blur-sm sm:px-16 sm:py-12">
          <span className="mono-label absolute -top-2.5 left-6 bg-background px-2 text-brand">
            v1.0 // rig console
          </span>
          <h1 className="display-xl text-glow text-center">
            Quick
            <br />
            Build
          </h1>
          <p className="mono-label mt-5 text-center text-muted-foreground">
            pick · verify · assemble in 3d
          </p>
        </div>

        {/* Mobile gate */}
        {!initialized && (
          <button
            type="button"
            onClick={() => setInitialized(true)}
            className="mono-label anim-blink mt-12 text-brand md:hidden"
          >
            [ tap to initialize ]
          </button>
        )}

        {/* Stepped command pedestal */}
        <div
          className={cn(
            "mt-10 w-full max-w-4xl md:mt-14 md:block", // Widened to max-w-4xl to fit 5 items
            initialized ? "block" : "hidden",
          )}
        >
          <div className="mx-auto hidden h-6 w-[72%] border-x border-t border-border md:block" />
          <div className="mx-auto hidden h-6 w-[88%] border-x border-t border-border md:block" />
          {/* UPDATED: sm:grid-cols-3 and md:grid-cols-5 */}
          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3 md:grid-cols-5">
            {commands.map((c, i) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onClick}
                style={{ animationDelay: `${i * 70}ms` }}
                className="group anim-boot flex items-center justify-between gap-3 bg-card px-5 py-5 text-left transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                <span>
                  <span className="mono-label block opacity-60">{`0${i + 1}`}</span>
                  <span className="display-md mt-1 block">{c.label}</span>
                  <span className="mono-label mt-1 block opacity-60">{c.hint}</span>
                </span>
                <c.icon className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry strip */}
        <dl className="mono-data mt-12 grid w-full max-w-4xl grid-cols-2 gap-px border border-border bg-border text-[12px] sm:grid-cols-4">
          {[
            ["parts indexed", String(allParts.length)],
            ["categories", String(CATEGORIES.length)],
            ["rules", "9"],
            ["avg build price", currency(avgBuildPrice)],
          ].map(([k, v]) => (
            <div key={k} className="bg-background px-4 py-3">
              <dt className="mono-label text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Boot log footer */}
      <footer className="relative z-10 hidden border-t border-border px-6 py-3 md:block">
        <ul className="mono-data flex flex-wrap gap-x-8 gap-y-1 text-[11px] text-muted-foreground">
          {BOOT_LOG.map((l) => (
            <li key={l} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" />
              {l}
            </li>
          ))}
        </ul>
      </footer>

      {/* Slide-in nav */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
            className="flex-1 bg-background/80 backdrop-blur-sm"
          />
          <nav className="hud-scanlines relative w-[min(20rem,85vw)] border-l border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="mono-label text-brand">navigation</p>
              <button type="button" aria-label="Close" onClick={() => setNavOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <ul className="mt-6 space-y-px">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={() => setNavOpen(false)}
                    className="mono-label flex items-center justify-between border border-border px-4 py-3.5 transition-colors hover:border-brand hover:text-brand"
                  >
                    {n.label}
                    <ChevronRight className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mono-data mt-8 flex items-center gap-2 text-[12px] text-muted-foreground">
              <Box className="size-3.5" /> {user ? user.email : "guest session"}
            </p>
          </nav>
        </div>
      )}

      {/* Settings overlay */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
          <div className="hud-brackets w-full max-w-md border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="mono-label text-brand">settings</p>
              <button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <ul className="mono-data mt-5 space-y-px text-[13px]">
              {[
                ["Viewport", "3D · hardware accelerated"],
                ["Units", "INR · watts"],
                ["Autosave", "Local device storage"],
                ["Catalog source", "Static + live table"],
              ].map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-center justify-between border border-border px-4 py-3"
                >
                  <span className="mono-label text-muted-foreground">{k}</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="mono-label mt-6 w-full border border-brand px-4 py-3 text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}