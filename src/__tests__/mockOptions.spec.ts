import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { MockError, Valimock } from "../Valimock.js";
import { captureWarnings } from "./helpers/captureWarnings.js";

describe(`Valimock options`, () => {
  describe(`seed`, () => {
    it(`same seed across instances produces the same value`, () => {
      // Determinism guarantee: callers can pin output by passing `seed`. Without
      // this test the seed branch on line 141 of Valimock.ts is silently dead.
      const schema = v.object({
        name: v.pipe(v.string(), v.minLength(3), v.maxLength(12)),
        count: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100))
      });
      const a = new Valimock({ onWarn: () => {}, seed: 42 }).mock(schema);
      const b = new Valimock({ onWarn: () => {}, seed: 42 }).mock(schema);
      expect(a).toStrictEqual(b);
    });

    it(`different seeds usually produce different values`, () => {
      const schema = v.pipe(v.string(), v.minLength(5), v.maxLength(20));
      const a = new Valimock({ onWarn: () => {}, seed: 1 }).mock(schema);
      const b = new Valimock({ onWarn: () => {}, seed: 99 }).mock(schema);
      // Not a strict guarantee (two seeds could collide), but at the bounds
      // we're using a collision is overwhelmingly unlikely.
      expect(a).not.toBe(b);
    });
  });

  describe(`throwOnUnknownType`, () => {
    it(`throws MockError for unrecognized schema types when enabled`, () => {
      // Construct a hand-rolled "schema" with a type Valimock doesn't register
      // and no customMocks entry. Default behavior is to warn + return undefined;
      // throwOnUnknownType: true must elevate that to a thrown MockError.
      const fakeSchema = { kind: `schema`, type: `synthetic_unknown_type` } as never;
      const m = new Valimock({ onWarn: () => {}, throwOnUnknownType: true }).mock;
      expect(() => m(fakeSchema)).toThrow(MockError);
      expect(() => m(fakeSchema)).toThrow(/synthetic_unknown_type/);
    });

    it(`default behavior (throwOnUnknownType: false) warns instead of throwing`, () => {
      const { mock, warnings } = captureWarnings();
      const fakeSchema = { kind: `schema`, type: `another_unknown` } as never;
      expect(() => mock(fakeSchema)).not.toThrow();
      expect(warnings.some((w) => w.includes(`another_unknown`))).toBe(true);
    });
  });

  describe(`lazyAsync with an async getter`, () => {
    it(`warns and returns undefined because synchronous mock() can't resolve a Promise`, () => {
      // lazyAsync's getter may return a Promise. `mock()` is synchronous and
      // can't await it, so we surface the limitation rather than emit a
      // value that will fail parse.
      const { mock, warnings } = captureWarnings();
      const schema = v.lazyAsync(async () => v.string());
      const result = mock(schema as never);
      expect(result).toBeUndefined();
      expect(warnings.some((w) => w.includes(`lazy`) && w.includes(`Promise`))).toBe(true);
    });

    it(`lazyAsync with a sync getter still works`, () => {
      // The async wrapper doesn't force the getter to be async — when it
      // returns synchronously, mock() recurses normally.
      const m = new Valimock({ onWarn: () => {} }).mock;
      const schema = v.lazyAsync(() => v.string());
      const result = m(schema as never) as string;
      expect(typeof result).toBe(`string`);
    });
  });
});

describe(`intersect with no options`, () => {
  it(`returns an empty object`, () => {
    // Edge case: v.intersect([]) is structurally legal (matches nothing in
    // particular, vacuously satisfied). The generator's early return on
    // line 32 of intersect.ts gives an empty object.
    const m = new Valimock({ onWarn: () => {} }).mock;
    const schema = v.intersect([] as never);
    const result = m(schema);
    expect(result).toStrictEqual({});
  });
});
