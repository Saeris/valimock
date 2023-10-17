import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/Valimock.ts"],
  clean: true,
  format: ["esm", "cjs"],
  dts: true,
  outDir: "./dist"
});
