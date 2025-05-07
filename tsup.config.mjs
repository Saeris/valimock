import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/Valimock.ts"],
  clean: true,
  format: ["esm"],
  dts: true,
  outDir: "./dist"
});
