import { Link } from "@tanstack/react-router";
import { Cpu } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Cpu className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.03em]">
              QuickBuild
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A modern PC configurator with real compatibility checks, side-by-side
            spec comparison and an interactive 3D build preview.
          </p>
        </div>

        <FooterColumn
          title="Product"
          links={[
            { label: "PC Builder", to: "/build" },
            { label: "Compare Parts", to: "/compare" },
            { label: "Home", to: "/" },
          ]}
        />

        <div>
          <h3 className="mono-label text-muted-foreground">Categories</h3>
          <ul className="mt-4 space-y-2.5 font-mono text-[13px] text-muted-foreground">
            {["CPU", "GPU", "Motherboard", "Memory", "Storage", "Cooling"].map(
              (c) => (
                <li key={c}>{c}</li>
              ),
            )}
          </ul>
        </div>

        <div>
          <h3 className="mono-label text-muted-foreground">Status</h3>
          <ul className="mt-4 space-y-2.5 font-mono text-[13px] text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" />
              Catalog online
            </li>
            <li>Prices in USD</li>
            <li>Updated Aug 2026</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-5 py-5 font-mono text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 QuickBuild. Demo catalog data.</span>
          <span>Built for enthusiasts, not spreadsheets.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: "/" | "/build" | "/compare" }[];
}) {
  return (
    <div>
      <h3 className="mono-label text-muted-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5 font-mono text-[13px]">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}