import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest-and-assets",
      closeBundle() {
        const dist = resolve(__dirname, "dist");

        // Copy manifest.json
        copyFileSync(
          resolve(__dirname, "manifest.json"),
          resolve(dist, "manifest.json")
        );

        // Copy icons
        const iconsDir = resolve(dist, "icons");
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
        for (const size of ["16", "48", "128"]) {
          const src = resolve(__dirname, `icons/icon${size}.png`);
          if (existsSync(src)) {
            copyFileSync(src, resolve(iconsDir, `icon${size}.png`));
          }
        }

        // Copy content script
        copyFileSync(
          resolve(__dirname, "src/content/content-script.js"),
          resolve(dist, "content-script.js")
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  base: "",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        editor: resolve(__dirname, "src/editor/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
        "service-worker": resolve(__dirname, "src/background/service-worker.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "service-worker") return "service-worker.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
