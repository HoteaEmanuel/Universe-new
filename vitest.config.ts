import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["backend/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["backend/**/*.ts", "packages/*/src/**/*.ts"],
      exclude: [
        "backend/generated/**",
        "backend/**/*.test.ts",
        "packages/*/src/**/*.test.ts",
      ],
    },
  },
});
