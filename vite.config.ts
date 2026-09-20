import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
    }),
    // react's vite plugin must come after tanstackStart's
    viteReact(),
    nitro({
      // Redirect Nitro's server entry to src/server.ts (our SSR error
      // wrapper), which internally delegates to TanStack Start's own entry.
      serverEntry: "./src/server.ts",
    }),
  ],
});
