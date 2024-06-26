import path from "node:path"

import { defineConfig } from "vite"

export default defineConfig({
  plugins: [],
  define: {
    "process.env": {},
  },
  build: {
    // sourcemap: true,
    emptyOutDir: false,
    outDir: path.resolve(__dirname, "dist"),
    lib: {
      formats: ["iife"],
      entry: path.resolve(__dirname, "content-script", "index.tsx"),
      name: "Vodskipper",
    },
    rollupOptions: {
      output: {
        entryFileNames: "contentScript/index.js",
        extend: true,
      },
    },
  },
})
