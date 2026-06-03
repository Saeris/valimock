import { bench, describe } from "vite-plus/test";
import { Valimock } from "../Valimock.js";
import { channelLikeSchema } from "./fixtures/index.js";

/**
 * Benchmark: `intersect([common, variant(...)])` discriminated unions.
 *
 * Exercises the intersect deepMerge path (the v1.5.1 variant-discriminator
 * regression) and variant resolution. No recursion — useful as a control
 * for the difference between shape-driven and recursion-driven cost.
 */
describe(`mock(channelLikeSchema)`, () => {
  const m = new Valimock({ onWarn: () => {} });

  bench(`default options`, () => {
    m.mock(channelLikeSchema);
  });
});
