import { createFileRoute } from "@tanstack/react-router";
import { ComparePage } from "@/pages/compare";
import type { CategoryId } from "@/data/types";

const CATEGORY_IDS: CategoryId[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "case",
  "cooler",
];

const title = "Compare PC Components — QuickBuild";
const description =
  "Line up CPUs, GPUs, motherboards, memory, storage and power supplies side by side and compare every specification that matters.";

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search["category"] as CategoryId | undefined;
    return raw && CATEGORY_IDS.includes(raw) ? { category: raw } : {};
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CompareRoute,
});

function CompareRoute() {
  const search = Route.useSearch();
  const category = search.category ?? "cpu";
  return <ComparePage key={category} initialCategory={category} />;
}