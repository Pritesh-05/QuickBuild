import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/home";

const title = "QuickBuild — Build Your Perfect PC in 3D";
const description =
  "Select PC components, check compatibility instantly, compare hardware specs and assemble your build in an interactive 3D configurator.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: HomePage,
});
