import { bench, describe } from "vite-plus/test";
import { Valimock } from "../Valimock.js";
import { messageLikeSchema } from "./fixtures/index.js";

/**
 * Benchmark: the recursive-lazy-through-nullish pattern.
 *
 * messageLikeSchema mirrors discordkit's Message schema — the shape that
 * drove the v1.5.0 regression. Healthy ops/sec is in the low thousands;
 * the v1.5.2 eager-recursion bug dropped it to ~38 ops/sec.
 *
 * Run all benches:           vp test bench
 * Run only this file:        vp test bench messageLikeSchema
 */
describe(`mock(messageLikeSchema)`, () => {
  const m = new Valimock({ onWarn: () => {} });

  bench(`default options`, () => {
    m.mock(messageLikeSchema);
  });
});
