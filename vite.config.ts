/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/art-museum-creator/",
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom)[\\/]/ },
            {
              name: "ui",
              test: /node_modules[\\/](@base-ui[\\/]react|lucide-react|clsx|class-variance-authority|tailwind-merge)[\\/]/,
            },
            {
              name: "konva",
              test: /node_modules[\\/](konva|react-konva)[\\/]/,
            },
            { name: "vendor", test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: "./tests/setup.ts",
  },
});
