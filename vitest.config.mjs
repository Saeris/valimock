import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: `valimock`,
    globals: true,
    watch: false
  }
});
