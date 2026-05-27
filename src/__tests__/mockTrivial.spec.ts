import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Quick sanity tests for the small/trivial mockers that don't warrant a full
 * fast-check property suite — the universe of valid output is so narrow that
 * a handful of iterations is conclusive.
 */

describe(`mockBoolean`, () => {
  it(`returns a boolean and round-trips`, () => {
    const schema = v.boolean();
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(typeof result).toBe(`boolean`);
      expect(v.parse(schema, result)).toBe(result);
    }
  });
});

describe(`mockNaN`, () => {
  it(`always returns NaN and round-trips`, () => {
    const schema = v.nan();
    for (let i = 0; i < 10; i++) {
      const result = mock(schema);
      expect(Number.isNaN(result)).toBe(true);
      // Valibot parse uses Object.is for NaN comparison, so the round-trip is
      // trivially satisfied (parse returns the same NaN).
      expect(Number.isNaN(v.parse(schema, result))).toBe(true);
    }
  });
});

describe(`mockNull`, () => {
  it(`always returns null and round-trips`, () => {
    const schema = v.null_();
    for (let i = 0; i < 10; i++) {
      const result = mock(schema);
      expect(result).toBeNull();
      expect(v.parse(schema, result)).toBeNull();
    }
  });
});

describe(`mockRequired family (non_nullable / non_nullish / non_optional)`, () => {
  it(`non_nullable: wraps a nullable, produces a non-null value`, () => {
    const schema = v.nonNullable(v.nullable(v.string()));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(result).not.toBeNull();
      expect(typeof result).toBe(`string`);
      expect(v.parse(schema, result)).toBe(result);
    }
  });

  it(`non_nullish: wraps a nullish, produces neither null nor undefined`, () => {
    const schema = v.nonNullish(v.nullish(v.number()));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
      expect(typeof result).toBe(`number`);
      expect(v.parse(schema, result)).toBe(result);
    }
  });

  it(`non_optional: wraps an optional, never returns undefined`, () => {
    const schema = v.nonOptional(v.optional(v.string()));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(result).not.toBeUndefined();
      expect(typeof result).toBe(`string`);
      expect(v.parse(schema, result)).toBe(result);
    }
  });
});

describe(`async wrappers (nullableAsync / nullishAsync / optionalAsync / nonNullableAsync)`, () => {
  // The async variants of nullable/nullish/optional/non_nullable should mock
  // identically to their sync counterparts and round-trip via parseAsync.
  it.concurrent.each([
    v.nullableAsync(v.string()),
    v.nullishAsync(v.any()),
    v.nullishAsync(v.string(), `foo`),
    v.optionalAsync(v.string()),
    v.optionalAsync(v.any(), `foo`),
    v.nonNullableAsync(v.string())
  ])(`round-trips via parseAsync (%#)`, { repeats: 5 }, async (schema) => {
    const result = mock(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
