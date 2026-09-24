import path from "node:path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @universe/shared is a workspace source package (symlinked, not a real
  // published dependency) - excluding it from pre-bundling means edits to it
  // are picked up on the next reload instead of needing a stale esbuild
  // dep-cache cleared out by hand.
  optimizeDeps: {
    exclude: ["@universe/shared"],
  },
})
