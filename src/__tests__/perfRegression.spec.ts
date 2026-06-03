import { describe, expect, it } from "vite-plus/test";
import { Valimock } from "../Valimock.js";
import {
  applicationLikeSchema,
  channelLikeSchema,
  interactionLikeSchema,
  messageLikeSchema
} from "../__benchmarks__/fixtures/index.js";

/**
 * Catastrophic performance regression canary.
 *
 * These tests don't measure wall-clock time — that's flaky on CI runners.
 * Instead they assert on `#mock` invocation counts and peak recursion depth,
 * which are *deterministic* properties of the algorithm and shift by
 * orders of magnitude when something goes wrong.
 *
 * The motivating example is the v1.5.0 wrapper-recursion bug, where
 * `nullable` / `nullish` / `optional` / `undefinedable` eagerly evaluated
 * their wrapped schema before discarding it ~50% of the time. On
 * `messageLikeSchema`, healthy call counts are in the low hundreds (p95
 * ~349 per the baseline measurement); the bug produced thousands. A
 * 4-5x headroom on the ceiling catches that catastrophic case while
 * tolerating natural variance from the random rolls inside wrapper
 * handlers.
 *
 * Each test averages over 20 trials to smooth out the variance — single
 * rolls can vary by ~3x due to how many `nullish` branches happen to
 * select the wrapped option vs the empty option.
 */

const TRIALS = 20;

interface CallCountStats {
  avgCalls: number;
  maxCalls: number;
  avgDepth: number;
  maxDepth: number;
}

const measure = (schema: Parameters<Valimock[`mock`]>[0]): CallCountStats => {
  const m = new Valimock({ instrument: true, onWarn: () => {} });
  const calls: number[] = [];
  const depths: number[] = [];
  for (let i = 0; i < TRIALS; i++) {
    m.resetInstrumentation();
    m.mock(schema);
    const stats = m.instrumentation;
    if (!stats) throw new Error(`instrumentation should be defined`);
    calls.push(stats.mockCalls);
    depths.push(stats.maxDepth);
  }
  return {
    avgCalls: calls.reduce((a, b) => a + b, 0) / TRIALS,
    maxCalls: Math.max(...calls),
    avgDepth: depths.reduce((a, b) => a + b, 0) / TRIALS,
    maxDepth: Math.max(...depths)
  };
};

describe(`perf regression canaries`, () => {
  it(`messageLikeSchema: recursive lazy through nullish stays bounded`, () => {
    // Baseline: avg ~150 calls, p95 ~349, max ~440. Healthy depth: max 16.
    // The v1.5.0 wrapper bug produced thousands of calls and unbounded
    // depth because every nullish-wrapped lazy ref descended eagerly
    // through the entire schema before the random roll discarded it.
    const stats = measure(messageLikeSchema);
    expect(stats.avgCalls).toBeLessThan(800);
    expect(stats.maxCalls).toBeLessThan(2000);
    expect(stats.maxDepth).toBeLessThan(50);
  });

  it(`channelLikeSchema: intersect-with-variant stays bounded`, () => {
    // Baseline: avg ~30 calls, max ~57. The intersect+variant pattern was
    // the dominant shape that drove the deepMerge variant-discriminator
    // regression in v1.5.x; ceiling here protects the call-count side.
    const stats = measure(channelLikeSchema);
    expect(stats.avgCalls).toBeLessThan(120);
    expect(stats.maxCalls).toBeLessThan(200);
    expect(stats.maxDepth).toBeLessThan(30);
  });

  it(`applicationLikeSchema: wide-flat object stays bounded`, () => {
    // Baseline: avg ~40 calls, max ~56. No recursion. Useful as a
    // control — if THIS schema's count explodes, the bug is in the
    // string pipeline or the dispatch loop, not in a wrapper.
    const stats = measure(applicationLikeSchema);
    expect(stats.avgCalls).toBeLessThan(120);
    expect(stats.maxCalls).toBeLessThan(200);
    expect(stats.maxDepth).toBeLessThan(30);
  });

  it(`interactionLikeSchema: multi-lazy union stays bounded`, () => {
    // Baseline: avg ~30 calls, max ~70. Multiple `v.lazy(() => ...)`
    // references; tests that lazy resolution doesn't double-recurse.
    const stats = measure(interactionLikeSchema);
    expect(stats.avgCalls).toBeLessThan(150);
    expect(stats.maxCalls).toBeLessThan(300);
    expect(stats.maxDepth).toBeLessThan(30);
  });
});

describe(`instrumentation hook`, () => {
  // The hook itself needs minimal tests — it's a public surface even though
  // it's intended for performance work, so its contract should be pinned.

  it(`is undefined when instrument: false (the default)`, () => {
    const m = new Valimock({ onWarn: () => {} });
    expect(m.instrumentation).toBeUndefined();
  });

  it(`returns counters when instrument: true`, () => {
    const m = new Valimock({ instrument: true, onWarn: () => {} });
    expect(m.instrumentation).toEqual({ mockCalls: 0, maxDepth: 0 });
  });

  it(`tracks mockCalls and maxDepth as #mock recurses`, () => {
    const m = new Valimock({ instrument: true, onWarn: () => {} });
    m.mock(applicationLikeSchema);
    const stats = m.instrumentation;
    if (!stats) throw new Error(`expected instrumentation`);
    expect(stats.mockCalls).toBeGreaterThan(0);
    expect(stats.maxDepth).toBeGreaterThan(0);
  });

  it(`resetInstrumentation() zeros the counters`, () => {
    const m = new Valimock({ instrument: true, onWarn: () => {} });
    m.mock(applicationLikeSchema);
    m.resetInstrumentation();
    expect(m.instrumentation).toEqual({ mockCalls: 0, maxDepth: 0 });
  });

  it(`returns a snapshot — mutating the returned object doesn't affect future reads`, () => {
    const m = new Valimock({ instrument: true, onWarn: () => {} });
    m.mock(applicationLikeSchema);
    const before = m.instrumentation;
    if (!before) throw new Error(`expected instrumentation`);
    before.mockCalls = 0;
    const after = m.instrumentation;
    if (!after) throw new Error(`expected instrumentation`);
    expect(after.mockCalls).toBeGreaterThan(0);
  });
});
