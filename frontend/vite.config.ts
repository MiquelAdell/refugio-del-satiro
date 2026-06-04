/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/prestamos/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/prestamos/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prestamos/, ""),
      },
      "/_nav.json": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // Static assets served by Caddy from the content-mirror in production.
      // Dev needs to reach them too so the SiteHeader logo and any other
      // mirror-resident images load on /prestamos/* pages.
      "/_assets": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
