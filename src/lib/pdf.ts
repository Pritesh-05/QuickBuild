import { jsPDF, GState } from "jspdf";
import { CATEGORIES } from "@/data/catalog";
import type { BuildState, CategoryId } from "@/data/types";
import type { CompatibilityReport } from "@/lib/compatibility";
import { currency, currencyRangeText, watts } from "@/lib/format";
import type { BuildReviewResult, ReviewGrade } from "@/lib/review";

const MARGIN_X = 48;
const PAGE_WIDTH = 595;
const PAGE_BOTTOM = 780;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const TILE = 26;

const GRADE_RGB: Record<ReviewGrade, [number, number, number]> = {
  excellent: [63, 191, 111],
  good: [47, 111, 232],
  fair: [201, 162, 39],
  "needs work": [224, 71, 63],
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [47, 111, 232];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function ensureSpace(doc: jsPDF, y: number, needed = 16): number {
  if (y + needed <= PAGE_BOTTOM) return y;
  doc.addPage();
  return 56;
}

/** Draws a small, deliberately abstract vector glyph per category — the
 * dataset has no product photography (nothing in QuickBuild does), so this
 * is the PDF's equivalent of the accent-tinted icon tiles used everywhere
 * else in the app, not a stand-in for a real photo. */
function drawCategoryIcon(doc: jsPDF, category: CategoryId, x: number, y: number, accent: string) {
  const [r, g, b] = hexToRgb(accent);
  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.14 }));
  doc.setFillColor(r, g, b);
  doc.roundedRect(x, y, TILE, TILE, 4, 4, "F");
  doc.restoreGraphicsState();

  doc.setDrawColor(r, g, b);
  doc.setFillColor(r, g, b);
  doc.setLineWidth(1);
  const cx = x + TILE / 2;
  const cy = y + TILE / 2;

  switch (category) {
    case "cpu":
      doc.rect(cx - 7, cy - 7, 14, 14, "S");
      doc.rect(cx - 3.5, cy - 3.5, 7, 7, "S");
      break;
    case "gpu":
      doc.roundedRect(cx - 9, cy - 5, 18, 10, 1.5, 1.5, "S");
      doc.circle(cx - 3, cy, 2.4, "S");
      doc.circle(cx + 4, cy, 2.4, "S");
      break;
    case "motherboard":
      doc.rect(cx - 8, cy - 8, 16, 16, "S");
      [-4, -1, 2, 5].forEach((dx) => doc.line(cx + dx, cy - 8, cx + dx, cy - 2));
      break;
    case "ram":
      doc.rect(cx - 6, cy - 8, 4, 16, "S");
      doc.rect(cx + 2, cy - 8, 4, 16, "S");
      break;
    case "storage":
      doc.roundedRect(cx - 9, cy - 6, 18, 12, 1.5, 1.5, "S");
      doc.circle(cx + 3, cy, 2.5, "S");
      break;
    case "psu":
      doc.rect(cx - 8, cy - 8, 16, 16, "S");
      doc.circle(cx, cy, 4, "S");
      break;
    case "case":
      doc.rect(cx - 6, cy - 9, 12, 18, "S");
      doc.line(cx - 6, cy - 3, cx + 6, cy - 3);
      break;
    case "cooler":
      doc.circle(cx, cy, 7, "S");
      [0, 60, 120, 180, 240, 300].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        doc.line(cx, cy, cx + Math.cos(rad) * 6, cy + Math.sin(rad) * 6);
      });
      break;
    case "monitor":
      doc.roundedRect(cx - 9, cy - 6, 18, 11, 1, 1, "S");
      doc.line(cx, cy + 5, cx, cy + 8);
      doc.line(cx - 4, cy + 8, cx + 4, cy + 8);
      break;
    case "keyboard":
      doc.roundedRect(cx - 9, cy - 5, 18, 10, 1, 1, "S");
      [-6, -2, 2, 6].forEach((dx) => doc.circle(cx + dx, cy, 0.6, "F"));
      break;
    case "mouse":
      doc.roundedRect(cx - 4, cy - 8, 8, 16, 4, 4, "S");
      doc.line(cx, cy - 8, cx, cy - 2);
      break;
  }
}

function writeSection(doc: jsPDF, title: string, lines: string[], y: number): number {
  if (lines.length === 0) return y;
  y = ensureSpace(doc, y, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text(title, MARGIN_X, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 18;

  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(`•  ${line}`, CONTENT_WIDTH) as string[];
    y = ensureSpace(doc, y, wrapped.length * 14);
    doc.text(wrapped, MARGIN_X, y);
    y += wrapped.length * 14 + 2;
  });

  return y + 8;
}

/** Builds and downloads a PDF summarising a build: a colored score badge,
 * an icon-tile parts list, price/wattage/PSU totals, and the review
 * verdict/strengths/suggestions. */
export function downloadBuildPdf(
  name: string,
  build: BuildState,
  report: CompatibilityReport,
  review: BuildReviewResult,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const [gr, gg, gb] = GRADE_RGB[review.grade];

  // ── Header banner ──────────────────────────────────────────────
  doc.setFillColor(18, 19, 23);
  doc.rect(0, 0, PAGE_WIDTH, 92, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("QuickBuild", MARGIN_X, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(190, 190, 200);
  doc.text(name, MARGIN_X, 60);

  // Score badge, top right of the banner
  const badgeX = PAGE_WIDTH - MARGIN_X - 90;
  doc.setFillColor(gr, gg, gb);
  doc.roundedRect(badgeX, 24, 90, 44, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${review.score}/100`, badgeX + 45, 45, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(review.grade, badgeX + 45, 59, { align: "center" });

  let y = 128;
  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const verdictLines = doc.splitTextToSize(review.verdict, CONTENT_WIDTH) as string[];
  doc.text(verdictLines, MARGIN_X, y);
  y += verdictLines.length * 14 + 20;

  // ── Parts list ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Parts list", MARGIN_X, y);
  y += 10;
  doc.setDrawColor(225);
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 16;

  CATEGORIES.forEach((c) => {
    const part = build[c.id];
    const rowHeight = TILE + 8;
    y = ensureSpace(doc, y, rowHeight);

    drawCategoryIcon(doc, c.id, MARGIN_X, y, part?.accent ?? "#5a6270");

    const textX = MARGIN_X + TILE + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text(c.label + (c.required ? "" : " (optional)"), textX, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    if (part) {
      doc.setTextColor(60);
      doc.text(`${part.brand} ${part.name}`, textX, y + 22);
      doc.setTextColor(120);
      doc.text(part.highlight, textX, y + 33);
    } else {
      doc.setTextColor(150);
      doc.text("Not selected", textX, y + 22);
    }

    if (part) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(20);
      doc.text(currencyRangeText(part.price), PAGE_WIDTH - MARGIN_X, y + 12, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140);
      doc.text("street price range", PAGE_WIDTH - MARGIN_X, y + 23, { align: "right" });
    }

    y += rowHeight;
  });

  // ── Summary ─────────────────────────────────────────────────────
  y += 10;
  y = ensureSpace(doc, y, 90);
  doc.setFillColor(246, 247, 249);
  doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 64, 6, 6, "F");
  const statusLabel =
    report.status === "ok"
      ? "No conflicts"
      : report.status === "warning"
        ? "Advisories only"
        : "Conflicts present";
  const stats: [string, string][] = [
    ["Total price", currency(report.totalPrice)],
    ["Estimated draw", watts(report.estimatedPower)],
    ["PSU recommended", `${watts(report.recommendedPsu)}+`],
    ["Compatibility", statusLabel],
  ];
  const colWidth = CONTENT_WIDTH / stats.length;
  stats.forEach(([label, value], i) => {
    const colX = MARGIN_X + i * colWidth + 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.text(label.toUpperCase(), colX, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(value, colX, y + 42);
  });
  y += 64 + 24;

  // ── Review detail ───────────────────────────────────────────────
  y = writeSection(doc, "Strengths", review.strengths, y);
  y = writeSection(doc, "Suggestions", review.suggestions, y);

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(`QuickBuild · generated ${new Date().toLocaleDateString()}`, MARGIN_X, 812);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_WIDTH - MARGIN_X, 812, { align: "right" });
  }

  const fileSafeName = name
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
  doc.save(`${fileSafeName || "quickbuild"}.pdf`);
}
