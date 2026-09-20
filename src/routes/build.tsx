import { createFileRoute } from "@tanstack/react-router";
import { BuildPage } from "@/pages/build";

const title = "PC Builder — Configure a Compatible Build | QuickBuild";
const description =
  "Assemble a complete PC part by part with live socket, memory, clearance and wattage compatibility checks and an interactive 3D preview.";

export const Route = createFileRoute("/build")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: BuildPage,
});