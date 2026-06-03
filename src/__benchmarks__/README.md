# Performance benchmarks

This directory holds Vitest `bench()` files for iteration-time performance evaluation. They are **not run by default** — they're tools for contributors evaluating a perf change, not catastrophe-detection canaries.

For the regression canary that runs in normal CI, see [`src/__tests__/perfRegression.spec.ts`](../__tests__/perfRegression.spec.ts).

## Running

```bash
# Run all benchmarks
vp test bench

# Run a single bench file
vp test bench messageLikeSchema

# Run with a custom number of iterations (default: tinybench-driven)
vp test bench --benchmark.iterations=200
```

Output looks like:

```
 BENCH  Summary
 mock(messageLikeSchema) > default options
   3,420 ops/sec  ±0.42%  (456 samples)
```

`ops/sec` is the headline number. Higher is faster. The `±0.42%` is the relative margin of error — anything under ~1% is stable enough to compare runs.

## How to evaluate a perf change

1. Run the bench on `main` (or whatever baseline you're comparing against) and save the output.
2. Switch to your branch, run the bench again.
3. Compare ops/sec across runs **on the same machine, in the same session**. Absolute numbers vary by hardware and load — ratios within a session are stable.

A change that drops ops/sec by >5% (well above the RME) is a regression. A change that improves it by >5% is a win. Anything in the middle is noise and shouldn't drive decisions.

## What's here

| File                             | Fixture                             | Pattern                                 |
| -------------------------------- | ----------------------------------- | --------------------------------------- |
| `messageLikeSchema.bench.ts`     | recursive lazy through nullish      | the v1.5.0 wrapper-recursion shape      |
| `channelLikeSchema.bench.ts`     | `intersect([common, variant(...)])` | discriminated unions with shared fields |
| `applicationLikeSchema.bench.ts` | wide-flat object                    | string-pipeline-dominated, no recursion |
| `interactionLikeSchema.bench.ts` | multi-`v.lazy()` union              | cross-schema references                 |

The fixture schemas themselves live in [`fixtures/`](./fixtures/) and are shared with the regression canary spec.

## Adding a new benchmark

A new bench file should:

1. Live in this directory with a `.bench.ts` suffix (Vitest's discovery glob).
2. Import only from `fixtures/` and Valimock's public exports. No discordkit imports, no network, no filesystem.
3. Wrap each measurement in a `describe()` block named after the schema being mocked. Multiple `bench()` calls inside the same `describe` get side-by-side comparison in the reporter — use that to compare configurations of the same workload.
4. Construct the `Valimock` instance _outside_ the `bench()` callback when possible. Constructor cost is real (Map + Set initialization) but is a one-time hit, not a per-mock cost — including it in the timing measurement would obscure the actual mock cost.

## Profiling for hotspot discovery

The bench suite tells you _whether_ a change is faster. To find out _where_ the time is going, use the CPU profiler:

```bash
node --cpu-prof --cpu-prof-dir=./profiles node_modules/vitest/dist/cli.js bench --run
```

Open the resulting `.cpuprofile` in Chrome DevTools → Performance → "Load Profile". Self-time columns surface the top hotspots; that's how the original perf report identified `findFakerForKeyName` as 21.4% of CPU time.
