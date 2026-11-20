import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/**/*.test.ts",
      "client/**/*.test.ts",
      "server/**/*.test.ts",
      "services/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
  },
});
