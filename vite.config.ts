import { defineConfig } from "vite-plus";
import { lint, fmt } from "@saeris/configs";

export default defineConfig({
  // ── Linting (Oxlint) ────────────────────────────────────────────────
  lint,
  // ── Formatting (Oxfmt) ──────────────────────────────────────────────
  fmt,
  // ── Builds (tsdown) ─────────────────────────────────────────────────
  pack: {
    entry: [`./src/Valimock.ts`],
    clean: true,
    format: [`esm`],
    dts: true,
    outDir: `./dist`
  },
  // ── Testing (Vitest) ────────────────────────────────────────────────
  test: {
    name: `valimock`,
    globals: true,
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
    passWithNoTests: true,
    // Benchmark suite (run via `vp test bench`). Files live under
    // src/__benchmarks__/ and reuse the fixture library there. Kept out of
    // the default `vp test` run so the iteration-time bench suite doesn't
    // gate CI — it answers "is this change actually faster?" not "did
    // anything break".
    benchmark: {
      include: ["src/__benchmarks__/**/*.bench.{ts,tsx}"],
      exclude: ["**/node_modules/**", "**/dist/**"]
    }
  }
});
