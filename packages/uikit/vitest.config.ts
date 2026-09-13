import { defineConfig } from "vitest/config";

// Pure geometry tests use Node; Waterfall interaction tests opt into jsdom.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
