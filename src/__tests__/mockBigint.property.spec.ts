import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

const bigintArb = fc.bigInt({ min: -1_000_000n, max: 1_000_000n });

const bigintSchemaArb: fc.Arbitrary<v.GenericSchema<bigint>> = fc.oneof(
  fc.constant(v.bigint()),

  // Inclusive bounds.
  fc.tuple(bigintArb, fc.bigInt({ min: 0n, max: 1_000_000n })).map(([lo, range]) => {
    return v.pipe(v.bigint(), v.minValue(lo), v.maxValue(lo + range)) as unknown as v.GenericSchema<bigint>;
  }),

  // Strict bounds (gt/lt) — leave at least 2 between them so a satisfying value exists.
  fc.tuple(bigintArb, fc.bigInt({ min: 2n, max: 1_000_000n })).map(([lo, range]) => {
    return v.pipe(v.bigint(), v.gtValue(lo), v.ltValue(lo + range)) as unknown as v.GenericSchema<bigint>;
  }),

  // Exact value pin.
  bigintArb.map((n) => v.pipe(v.bigint(), v.value(n)) as unknown as v.GenericSchema<bigint>),

  // Allow-list.
  fc
    .array(bigintArb, { minLength: 1, maxLength: 5 })
    .map((arr) => v.pipe(v.bigint(), v.values(arr)) as unknown as v.GenericSchema<bigint>)
);

describe(`mockBigint property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(bigintSchemaArb, (schema) => {
        const result = mock(schema);
        expect(v.parse(schema, result)).toBe(result);
      }),
      { numRuns: 200 }
    );
  });
});
