import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

describe(`mockArray`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.array(v.string()),
      v.array(v.number()),
      v.array(v.union([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())])),
      v.pipe(v.array(v.string()), v.empty()),
      v.pipe(v.array(v.string()), v.minLength(2)),
      v.pipe(v.array(v.string()), v.maxLength(10)),
      v.pipe(v.array(v.string()), v.length(5))
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.arrayAsync(v.string()),
      v.arrayAsync(v.number()),
      v.arrayAsync(v.union([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())])),
      v.pipeAsync(v.arrayAsync(v.string()), v.empty()),
      v.pipeAsync(v.arrayAsync(v.string()), v.minLength(2)),
      v.pipeAsync(v.arrayAsync(v.string()), v.maxLength(10)),
      v.pipeAsync(v.arrayAsync(v.string()), v.length(5))
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    /**
     * Element schemas: simple primitives so the property focuses on array-level
     * constraints (length bounds). The element types are covered by their own
     * property tests.
     */
    const elementSchemaArb = fc.oneof(fc.constant(v.string()), fc.constant(v.number()));

    const arraySchemaArb: fc.Arbitrary<v.GenericSchema<unknown[]>> = elementSchemaArb.chain((elem) =>
      fc.oneof(
        fc.constant(v.array(elem) as unknown as v.GenericSchema<unknown[]>),

        // Inclusive bounds.
        fc
          .tuple(fc.nat({ max: 5 }), fc.integer({ min: 0, max: 10 }))
          .map(
            ([lo, range]) =>
              v.pipe(v.array(elem), v.minLength(lo), v.maxLength(lo + range)) as unknown as v.GenericSchema<unknown[]>
          ),

        // Exact length.
        fc.nat({ max: 10 }).map((n) => v.pipe(v.array(elem), v.length(n)) as unknown as v.GenericSchema<unknown[]>),

        // Empty.
        fc.constant(v.pipe(v.array(elem), v.empty()) as unknown as v.GenericSchema<unknown[]>),

        // Non-empty (with a sensible upper bound).
        fc.constant(v.pipe(v.array(elem), v.nonEmpty(), v.maxLength(5)) as unknown as v.GenericSchema<unknown[]>)
      )
    );

    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(arraySchemaArb, (schema) => {
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toEqual(result);
        }),
        { numRuns: 200 }
      );
    });

    it(`array of strings with length constraints round-trips`, () => {
      // Composite check: array element is itself a constrained string. This
      // catches regressions in element generation when wrapped by array bounds.
      const schema = v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(3));
      fc.assert(
        fc.property(fc.constant(schema), (s) => {
          const result = mockSchema(s);
          expect(v.parse(s, result)).toEqual(result);
        }),
        { numRuns: 50 }
      );
    });
  });
});
