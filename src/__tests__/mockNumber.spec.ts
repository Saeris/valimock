import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

type NumberPipeItem = v.PipeItem<number, number, v.BaseIssue<unknown>>;

describe(`mockNumber`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.number(),
      v.pipe(v.number(), v.minValue(2)),
      v.pipe(v.number(), v.maxValue(10)),
      v.pipe(v.number(), v.value(5)),
      v.pipe(v.number(), v.minValue(2), v.integer()),
      v.pipe(v.number(), v.maxValue(10), v.integer()),
      v.pipe(v.number(), v.value(5), v.integer())
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.pipeAsync(v.number(), v.minValue(2)),
      v.pipeAsync(v.number(), v.maxValue(10)),
      v.pipeAsync(v.number(), v.value(5)),
      v.pipeAsync(v.number(), v.minValue(2), v.integer()),
      v.pipeAsync(v.number(), v.maxValue(10), v.integer()),
      v.pipeAsync(v.number(), v.value(5), v.integer())
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    /**
     * Arbitrary producing a number schema with a satisfiable mix of constraints.
     * Each branch encodes one combination of actions; satisfiability is checked
     * at generation time so every emitted schema can in principle round-trip.
     */
    const numberSchemaArb: fc.Arbitrary<v.GenericSchema<number>> = fc.oneof(
      fc.constant(v.number()),
      fc.constant(v.pipe(v.number(), v.integer())),
      fc.constant(v.pipe(v.number(), v.safeInteger())),
      fc.constant(v.pipe(v.number(), v.finite())),
      fc.tuple(fc.integer({ min: -100, max: 100 }), fc.integer({ min: 0, max: 100 })).map(([lo, range]) => {
        return v.pipe(v.number(), v.minValue(lo), v.maxValue(lo + range)) as unknown as v.GenericSchema<number>;
      }),
      fc.tuple(fc.integer({ min: -100, max: 100 }), fc.integer({ min: 2, max: 100 })).map(([lo, range]) => {
        return v.pipe(v.number(), v.gtValue(lo), v.ltValue(lo + range)) as unknown as v.GenericSchema<number>;
      }),
      fc.tuple(fc.integer({ min: -100, max: 100 }), fc.integer({ min: 1, max: 100 })).map(([lo, range]) => {
        return v.pipe(
          v.number(),
          v.integer(),
          v.minValue(lo),
          v.maxValue(lo + range)
        ) as unknown as v.GenericSchema<number>;
      }),
      fc
        .tuple(fc.integer({ min: 2, max: 25 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 5, max: 50 }))
        .filter(([factor, lo, range]) => Math.floor((lo + range) / factor) >= Math.ceil(lo / factor))
        .map(([factor, lo, range]) => {
          return v.pipe(
            v.number(),
            v.integer(),
            v.multipleOf(factor),
            v.minValue(lo),
            v.maxValue(lo + range)
          ) as unknown as v.GenericSchema<number>;
        }),
      fc
        .integer({ min: -1000, max: 1000 })
        .map((n) => v.pipe(v.number(), v.value(n)) as unknown as v.GenericSchema<number>),
      fc
        .array(fc.integer({ min: -100, max: 100 }), { minLength: 1, maxLength: 5 })
        .map((arr) => v.pipe(v.number(), v.values(arr)) as unknown as v.GenericSchema<number>),
      fc
        .tuple(fc.integer({ min: 0, max: 50 }), fc.integer({ min: 60, max: 100 }), fc.integer({ min: 0, max: 5 }))
        .map(([lo, hi, forbidden]) => {
          const items: NumberPipeItem[] = [
            v.integer() as NumberPipeItem,
            v.minValue(lo) as NumberPipeItem,
            v.maxValue(hi) as NumberPipeItem,
            v.notValue(forbidden) as NumberPipeItem
          ];
          return v.pipe(v.number(), ...items) as unknown as v.GenericSchema<number>;
        }),
      fc.array(fc.integer({ min: -10, max: 10 }), { minLength: 1, maxLength: 4 }).map((arr) => {
        const items: NumberPipeItem[] = [
          v.integer() as NumberPipeItem,
          v.minValue(-100) as NumberPipeItem,
          v.maxValue(100) as NumberPipeItem,
          v.notValues(arr) as NumberPipeItem
        ];
        return v.pipe(v.number(), ...items) as unknown as v.GenericSchema<number>;
      })
    );

    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(numberSchemaArb, (schema) => {
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toBe(result);
        }),
        { numRuns: 200 }
      );
    });
  });
});
