import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts", "tests/unit/**/*.test.ts"],
    environment: "node",
  },
})
