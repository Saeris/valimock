import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

/**
 * Regression: prior to lazifying the wrapper handlers (#mockNullable,
 * #mockNullish, #mockOptional, #mockUndefinedable), each of them passed
 * `this.#mock(schema.wrapped)` into a `faker.helpers.arrayElement([...])`
 * literal. Array literals evaluate their elements eagerly, so the wrapped
 * mock fired on EVERY call — even when arrayElement subsequently picked
 * the empty branch (null/undefined). For self-referencing schemas wrapped
 * in nullish, this caused unbounded eager descent through the entire
 * schema tree on every node, producing 1000ms+ per mock and intermittent
 * stack-depth exceptions.
 *
 * These tests pin the lazy-evaluation contract by counting the calls to
 * a `v.lazy(getter)` that wraps a recursive object schema. Under the fix,
 * the getter is invoked only when the random roll picks the wrapped
 * branch. Under the bug, it fires on every nullish mock and on every
 * level of the recursive descent — far above the probabilistic floor.
 */

describe(`wrapper handlers are lazy`, () => {
  it(`nullable: invokes the wrapped schema mock only when the wrapped branch is picked`, () => {
    let getterCalls = 0;
    const inner: v.GenericSchema = v.lazy(() => {
      getterCalls++;
      return v.string();
    });
    const schema = v.nullable(inner);
    const mock = new Valimock({ onWarn: () => {} }).mock;

    const TRIALS = 1000;
    let nullCount = 0;
    for (let i = 0; i < TRIALS; i++) {
      if (mock(schema) === null) nullCount++;
    }

    // Sampling sanity: should be roughly 50/50 wrapped vs null. Allow a
    // very loose band (250-750) to keep the test from flaking on
    // pathological seeds — the point isn't the exact ratio, it's that
    // both branches fire.
    expect(nullCount).toBeGreaterThan(TRIALS * 0.25);
    expect(nullCount).toBeLessThan(TRIALS * 0.75);

    // The lazy contract: getter calls track non-null outputs, not total
    // mocks. With the eager bug, getterCalls would equal TRIALS (the
    // wrapped mock ran on every iteration regardless of the pick).
    expect(getterCalls).toBe(TRIALS - nullCount);
  });

  it(`nullish: getter calls track wrapped-branch picks, not total mocks`, () => {
    let getterCalls = 0;
    const inner: v.GenericSchema = v.lazy(() => {
      getterCalls++;
      return v.number();
    });
    const schema = v.nullish(inner);
    const mock = new Valimock({ onWarn: () => {} }).mock;

    const TRIALS = 1000;
    let wrappedCount = 0;
    for (let i = 0; i < TRIALS; i++) {
      const result = mock(schema);
      if (typeof result === `number`) wrappedCount++;
    }

    // 1/3 each of wrapped / null / undefined; loose band to avoid PRNG-
    // dependent flakiness.
    expect(wrappedCount).toBeGreaterThan(TRIALS * 0.15);
    expect(wrappedCount).toBeLessThan(TRIALS * 0.55);
    expect(getterCalls).toBe(wrappedCount);
  });

  it(`optional: getter calls track wrapped-branch picks`, () => {
    let getterCalls = 0;
    const inner: v.GenericSchema = v.lazy(() => {
      getterCalls++;
      return v.boolean();
    });
    const schema = v.optional(inner);
    const mock = new Valimock({ onWarn: () => {} }).mock;

    const TRIALS = 1000;
    let definedCount = 0;
    for (let i = 0; i < TRIALS; i++) {
      const result = mock(schema);
      if (result !== undefined) definedCount++;
    }

    expect(definedCount).toBeGreaterThan(TRIALS * 0.25);
    expect(definedCount).toBeLessThan(TRIALS * 0.75);
    expect(getterCalls).toBe(definedCount);
  });

  it(`undefinedable: getter calls track wrapped-branch picks`, () => {
    let getterCalls = 0;
    const inner: v.GenericSchema = v.lazy(() => {
      getterCalls++;
      return v.string();
    });
    const schema = v.undefinedable(inner);
    const mock = new Valimock({ onWarn: () => {} }).mock;

    const TRIALS = 1000;
    let definedCount = 0;
    for (let i = 0; i < TRIALS; i++) {
      const result = mock(schema);
      if (result !== undefined) definedCount++;
    }

    expect(definedCount).toBeGreaterThan(TRIALS * 0.25);
    expect(definedCount).toBeLessThan(TRIALS * 0.75);
    expect(getterCalls).toBe(definedCount);
  });

  it(`self-referencing schema in v.nullish(v.lazy(...)) terminates without unbounded descent`, () => {
    // The discordkit pattern: a recursive object schema where the
    // self-reference is wrapped in nullish-lazy. Under the bug, mocking
    // this schema descended through every level of the recursion eagerly
    // even though the outer nullish would discard most results, producing
    // 1000ms+ per mock and occasional stack-overflow. Under the fix, each
    // level's recursion gates on a coin flip — so the tree terminates
    // probabilistically and total work stays bounded.
    type Node = { id: string; child?: Node | null };
    const recursive: v.GenericSchema<Node> = v.object({
      id: v.string(),
      child: v.nullish(v.lazy(() => recursive))
    }) as unknown as v.GenericSchema<Node>;

    const mock = new Valimock({ onWarn: () => {} }).mock;
    // The test passes as long as this doesn't blow the call stack or
    // hang. We sample 100 mocks; if even one descends unbounded, the
    // process either throws "Maximum call stack size exceeded" or
    // times out.
    for (let i = 0; i < 100; i++) {
      const result = mock(recursive) as Node;
      expect(typeof result.id).toBe(`string`);
    }
  });
});
