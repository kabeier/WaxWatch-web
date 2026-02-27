import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "next/link": path.resolve(__dirname, "src/test/mocks/next-link.tsx"),
      "next/app": path.resolve(__dirname, "src/test/mocks/next-app.ts"),
      "next/router": path.resolve(__dirname, "src/test/mocks/next-router.ts"),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 45,
        statements: 60,
      },
    },
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "dist/**", "node_modules/**"],
  },
});
