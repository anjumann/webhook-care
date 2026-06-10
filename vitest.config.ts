import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve the `@/*` → `src/*` alias from tsconfig natively (no plugin).
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "cli/**/*.test.mjs"],
    globals: true,
  },
});
