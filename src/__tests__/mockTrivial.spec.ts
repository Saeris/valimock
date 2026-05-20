import { describe, expect, it } from "vite-plus/test";
import {
  boolean,
  nan,
  nonNullable,
  nonNullish,
  nonOptional,
  null_,
  nullable,
  nullish,
  number,
  optional,
  parse,
  string
} from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Quick sanity tests for the small/trivial mockers that don't warrant a full
 * fast-check property suite — the universe of valid output is so narrow that
 * a handful of iterations is conclusive.
 */

describe(`mockBoolean`, () => {
  it(`returns a boolean and round-trips`, () => {
    const schema = boolean();
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(typeof result).toBe(`boolean`);
      expect(parse(schema, result)).toBe(result);
    }
  });
});

describe(`mockNaN`, () => {
  it(`always returns NaN and round-trips`, () => {
    const schema = nan();
    for (let i = 0; i < 10; i++) {
      const result = mock(schema);
      expect(Number.isNaN(result)).toBe(true);
      // Valibot parse uses Object.is for NaN comparison, so the round-trip is
      // trivially satisfied (parse returns the same NaN).
      expect(Number.isNaN(parse(schema, result))).toBe(true);
    }
  });
});

describe(`mockNull`, () => {
  it(`always returns null and round-trips`, () => {
    const schema = null_();
    for (let i = 0; i < 10; i++) {
      const result = mock(schema);
      expect(result).toBeNull();
      expect(parse(schema, result)).toBeNull();
    }
  });
});

describe(`mockRequired family (non_nullable / non_nullish / non_optional)`, () => {
  it(`non_nullable: wraps a nullable, produces a non-null value`, () => {
    const schema = nonNullable(nullable(string()));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(result).not.toBeNull();
      expect(typeof result).toBe(`string`);
      expect(parse(schema, result)).toBe(result);
    }
  });

  it(`non_nullish: wraps a nullish, produces neither null nor undefined`, () => {
    const schema = nonNullish(nullish(number()));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
      expect(typeof result).toBe(`number`);
      expect(parse(schema, result)).toBe(result);
    }
  });

  it(`non_optional: wraps an optional, never returns undefined`, () => {
    const schema = nonOptional(optional(string()));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(result).not.toBeUndefined();
      expect(typeof result).toBe(`string`);
      expect(parse(schema, result)).toBe(result);
    }
  });
});
