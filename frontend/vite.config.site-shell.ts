import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  // Disable publicDir so Vite doesn't try to copy public/ into the outDir
  // (which would recurse since outDir lives inside public/).
  publicDir: false,
  // Lib builds don't replace process.env.NODE_ENV automatically; do it here
  // so the IIFE runs in the browser without a ReferenceError on `process`.
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    lib: {
      entry: "src/site-shell-embed.tsx",
      name: "SiteShell",
      formats: ["iife"],
    },
    outDir: "public/content-mirror/_assets",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "site-shell.js",
      },
    },
  },
});
