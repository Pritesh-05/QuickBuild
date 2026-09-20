import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Lightbulb, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES } from "@/data/catalog";
import type { BuildState } from "@/data/types";
import { analyzeBuild } from "@/lib/compatibility";
import { reviewBuild, type ReviewGrade } from "@/lib/review";
import { downloadBuildPdf } from "@/lib/pdf";
import { currency, watts } from "@/lib/format";
import { createSharedBuild } from "@/lib/functions/shared-builds.functions";
import { toPartIdMap } from "@/lib/functions/builds.functions";
import { cn } from "@/lib/utils";
import { BuildCharacter } from "./build-character";

const GRADE_STYLE: Record<ReviewGrade, string> = {
  excellent: "text-success",
  good: "text-brand",
  fair: "text-warning",
  "needs work": "text-destructive",
};

const GRADE_ACCENT: Record<ReviewGrade, string> = {
  excellent: "#3ecf8e",
  good: "#f2994a",
  fair: "#e0b93f",
  "needs work": "#e0473f",
};

interface BuildReviewPanelProps {
  build: BuildState;
  buildName: string;
  variant?: "panel" | "public";
}

export function BuildReviewPanel({ build, buildName, variant = "panel" }: BuildReviewPanelProps) {
  const report = useMemo(() => analyzeBuild(build), [build]);
  const review = useMemo(() => reviewBuild(build, report), [build, report]);

  const [creatingLink, setCreatingLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    variant === "public" && typeof window !== "undefined" ? window.location.href : null,
  );
  const [copied, setCopied] = useState(false);

  const [typedLength, setTypedLength] = useState(0);
  const [revealRest, setRevealRest] = useState(false);

  useEffect(() => {
    setTypedLength(0);
    setRevealRest(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTypedLength(i);
      if (i >= review.verdict.length) {
        clearInterval(id);
        setTimeout(() => setRevealRest(true), 250);
      }
    }, 22);
    return () => clearInterval(id);
  }, [review.verdict]);

  const speaking = typedLength < review.verdict.length;

  async function handleCreateLink() {
    setCreatingLink(true);
    try {
      const { id } = await createSharedBuild({
        data: { name: buildName, build: toPartIdMap(build) },
      });
      setShareUrl(`${window.location.origin}/share/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create a share link");
    } finally {
      setCreatingLink(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="size-28 shrink-0">
          <BuildCharacter accent={GRADE_ACCENT[review.grade]} speaking={speaking} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mono-label text-muted-foreground">score</p>
          <p className={cn("display-md mt-1", GRADE_STYLE[review.grade])}>
            {review.score}/100 <span className="text-[15px] font-normal">· {review.grade}</span>
          </p>
        </div>
        <p className="mono-data shrink-0 text-right text-[12px] text-muted-foreground">
          {report.selectedCount}/{CATEGORIES.length} parts
          <br />
          {currency(report.totalPrice)}
        </p>
      </div>
      <p className="mt-3 min-h-[3.5em] text-[14px] leading-relaxed text-foreground">
        {review.verdict.slice(0, typedLength)}
        {speaking && <span className="animate-pulse text-brand">▍</span>}
      </p>

      {revealRest && (
        <div className="anim-boot">
          {review.strengths.length > 0 && (
            <div className="mt-5">
              <p className="mono-label text-muted-foreground">strengths</p>
              <ul className="mt-2 space-y-1.5">
                {review.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-[13px] text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.suggestions.length > 0 && (
            <div className="mt-5">
              <p className="mono-label text-muted-foreground">suggestions</p>
              <ul className="mt-2 space-y-1.5">
                {review.suggestions.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-[13px] text-foreground">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <dl className="mono-data mt-6 grid grid-cols-2 gap-px border border-border bg-border text-[12px] sm:grid-cols-4">
            {[
              ["build price", currency(report.totalPrice)],
              ["total wattage", watts(report.estimatedPower)],
              ["psu advised", `${watts(report.recommendedPsu)}+`],
              ["status", report.status === "ok" ? "clean" : report.status],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-3 py-2">
                <dt className="mono-label text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadBuildPdf(buildName, build, report, review)}
              className="mono-label inline-flex items-center gap-2 border border-border px-3.5 py-2.5 transition-colors hover:border-brand hover:text-brand"
            >
              <Download className="size-3.5" /> Download PDF
            </button>

            {variant === "panel" && !shareUrl && (
              <button
                type="button"
                onClick={() => void handleCreateLink()}
                disabled={creatingLink}
                className="mono-label inline-flex items-center gap-2 bg-brand px-3.5 py-2.5 text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {creatingLink ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Link2 className="size-3.5" />
                )}
                {creatingLink ? "Creating link…" : "Create share link"}
              </button>
            )}

            {shareUrl && (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="mono-label inline-flex items-center gap-2 bg-brand px-3.5 py-2.5 text-brand-foreground transition-opacity hover:opacity-90"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            )}
          </div>

          {shareUrl && (
            <p className="mono-data mt-2 truncate text-[12px] text-muted-foreground">{shareUrl}</p>
          )}
        </div>
      )}
    </div>
  );
}