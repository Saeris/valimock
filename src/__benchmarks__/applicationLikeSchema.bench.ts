import { bench, describe } from "vite-plus/test";
import { Valimock } from "../Valimock.js";
import { applicationLikeSchema } from "./fixtures/index.js";

/**
 * Benchmark: wide-flat object, no recursion.
 *
 * Dominated by string-pipeline cost (keyNameGenerators, format generators,
 * the findFakerForKeyName cache, etc.). Useful as the canonical
 * "no-recursion" comparison case — if THIS bench regresses, the cause
 * is in the string pipeline or the dispatch loop, not a wrapper handler.
 */
describe(`mock(applicationLikeSchema)`, () => {
  const m = new Valimock({ onWarn: () => {} });

  bench(`default options`, () => {
    m.mock(applicationLikeSchema);
  });
});
