import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

describe(`mockBigint`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.bigint(),
      v.pipe(v.bigint(), v.minValue(100n), v.maxValue(200n)),
      v.pipe(v.bigint(), v.value(50n))
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.pipeAsync(v.bigint(), v.minValue(100n), v.maxValue(200n)),
      v.pipeAsync(v.bigint(), v.value(50n))
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    const bigintArb = fc.bigInt({ min: -1_000_000n, max: 1_000_000n });

    const bigintSchemaArb: fc.Arbitrary<v.GenericSchema<bigint>> = fc.oneof(
      fc.constant(v.bigint()),
      fc.tuple(bigintArb, fc.bigInt({ min: 0n, max: 1_000_000n })).map(([lo, range]) => {
        return v.pipe(v.bigint(), v.minValue(lo), v.maxValue(lo + range)) as unknown as v.GenericSchema<bigint>;
      }),
      fc.tuple(bigintArb, fc.bigInt({ min: 2n, max: 1_000_000n })).map(([lo, range]) => {
        return v.pipe(v.bigint(), v.gtValue(lo), v.ltValue(lo + range)) as unknown as v.GenericSchema<bigint>;
      }),
      bigintArb.map((n) => v.pipe(v.bigint(), v.value(n)) as unknown as v.GenericSchema<bigint>),
      fc
        .array(bigintArb, { minLength: 1, maxLength: 5 })
        .map((arr) => v.pipe(v.bigint(), v.values(arr)) as unknown as v.GenericSchema<bigint>)
    );

    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(bigintSchemaArb, (schema) => {
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toBe(result);
        }),
        { numRuns: 200 }
      );
    });
  });
});
