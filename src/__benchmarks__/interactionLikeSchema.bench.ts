import { bench, describe } from "vite-plus/test";
import { Valimock } from "../Valimock.js";
import { interactionLikeSchema } from "./fixtures/index.js";

/**
 * Benchmark: multi-`v.lazy()` union with cross-schema references.
 *
 * Exercises lazy resolution interleaved with discriminated union picking
 * and nested nullish wrappers. Closest match to discordkit's Interaction
 * schema, which mixes all three patterns.
 */
describe(`mock(interactionLikeSchema)`, () => {
  const m = new Valimock({ onWarn: () => {} });

  bench(`default options`, () => {
    m.mock(interactionLikeSchema);
  });
});
