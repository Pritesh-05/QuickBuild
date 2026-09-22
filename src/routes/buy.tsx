import { createFileRoute } from "@tanstack/react-router";
import { BuyPage } from "@/pages/buy";

const title = "Where to Buy — QuickBuild";
const description =
  "Live marketplace search links to Amazon, Flipkart and more for every component in your current build.";

export const Route = createFileRoute("/buy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: BuyPage,
});
