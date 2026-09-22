import { Link } from "@tanstack/react-router";
import { ExternalLink, Home, ShoppingCart } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { useBuild } from "@/hooks/use-build";
import { currencyRangeText } from "@/lib/format";
import { PartIcon } from "@/components/parts/part-icon";

/** Each retailer's live search-results URL for a given query — these open
 * the marketplace's own real-time listings/prices for the part, rather than
 * a fixed product link that can go stale or 404. */
const RETAILERS = [
  {
    id: "amazon",
    label: "Amazon.in",
    accent: "#f2994a",
    url: (q: string) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  },
  {
    id: "flipkart",
    label: "Flipkart",
    accent: "#2f6fe8",
    url: (q: string) =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "mdcomputers",
    label: "MD Computers",
    accent: "#e0473f",
    // MD Computers is a real Indian PC-component retailer with a plain,
    // server-rendered search URL — unlike Croma/Reliance Digital, this
    // reliably lands on actual results rather than a blank client-routed
    // shell.
    url: (q: string) =>
      `https://mdcomputers.in/index.php?route=product/search&search=${encodeURIComponent(q)}&category_id=0`,
  },
] as const;

export function BuyPage() {
  const { build, loaded } = useBuild();

  const selected = CATEGORIES.map((c) => ({ meta: c, part: build[c.id] })).filter(
    (row) => row.part !== null,
  );

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8 lg:py-14">
      <Link
        to="/"
        className="mono-label inline-flex items-center gap-1.5 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-brand hover:text-brand"
      >
        <Home className="size-3.5" />
        Back to home
      </Link>

      <header className="mt-6 max-w-2xl">
        <p className="mono-label text-brand">Buy</p>
        <h1 className="display-lg mt-3">Where to Buy</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Live marketplace search links for every part currently in your build. Each button
          opens that retailer's own real-time listings and pricing for the part — nothing here
          is a cached or hardcoded price.
        </p>
      </header>

      {!loaded ? (
        <p className="mono-data mt-10 text-[13px] text-muted-foreground">Loading your build…</p>
      ) : selected.length === 0 ? (
        <div className="mt-10 border border-dashed border-border px-6 py-10 text-center">
          <ShoppingCart className="mx-auto size-6 text-muted-foreground" />
          <p className="mono-data mt-3 text-[13px] text-muted-foreground">
            Your build is empty — add some parts first and their buy links will show up here.
          </p>
          <Link
            to="/build"
            className="mono-label mt-5 inline-flex items-center gap-1.5 bg-primary px-4 py-2.5 text-primary-foreground transition-opacity hover:opacity-90"
          >
            Go to builder
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {selected.map(({ meta, part }) => {
            const p = part!;
            const query = `${p.brand} ${p.name}`;
            return (
              <li
                key={meta.id}
                className="border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${p.accent}22`, color: p.accent }}
                    >
                      <PartIcon category={meta.id} className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="mono-label text-muted-foreground">{meta.label}</p>
                      <p className="truncate text-[15px] font-semibold tracking-[-0.02em]">
                        {p.brand} {p.name}
                      </p>
                    </div>
                  </div>
                  <p className="mono-data shrink-0 text-[13px] text-muted-foreground">
                    {currencyRangeText(p.price)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {RETAILERS.map((r) => (
                    <a
                      key={r.id}
                      href={r.url(query)}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mono-label inline-flex items-center gap-1.5 border border-border px-3 py-2 text-foreground transition-colors hover:border-brand hover:text-brand"
                    >
                      <ExternalLink className="size-3.5" style={{ color: r.accent }} />
                      {r.label}
                    </a>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
