import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  server: { proxy: { "/api/v1": "http://127.0.0.1:8000" } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
