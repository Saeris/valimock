import { defineConfig } from "eslint/config";
import { base, stylistic, typeAware, vitest } from "@saeris/eslint-config";

export default defineConfig([base, stylistic, typeAware, vitest]);
