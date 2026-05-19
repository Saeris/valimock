import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { array, empty, length, maxLength, minLength, nonEmpty, number, parse, pipe, string } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Element schemas: simple primitives so the property focuses on array-level
 * constraints (length bounds). The element types are covered by their own
 * property tests.
 */
const elementSchemaArb = fc.oneof(fc.constant(string()), fc.constant(number()));

const arraySchemaArb: fc.Arbitrary<v.GenericSchema<unknown[]>> = elementSchemaArb.chain((elem) =>
  fc.oneof(
    fc.constant(array(elem) as unknown as v.GenericSchema<unknown[]>),

    // Inclusive bounds.
    fc
      .tuple(fc.nat({ max: 5 }), fc.integer({ min: 0, max: 10 }))
      .map(
        ([lo, range]) =>
          pipe(array(elem), minLength(lo), maxLength(lo + range)) as unknown as v.GenericSchema<unknown[]>
      ),

    // Exact length.
    fc.nat({ max: 10 }).map((n) => pipe(array(elem), length(n)) as unknown as v.GenericSchema<unknown[]>),

    // Empty.
    fc.constant(pipe(array(elem), empty()) as unknown as v.GenericSchema<unknown[]>),

    // Non-empty (with a sensible upper bound).
    fc.constant(pipe(array(elem), nonEmpty(), maxLength(5)) as unknown as v.GenericSchema<unknown[]>)
  )
);

describe(`mockArray property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(arraySchemaArb, (schema) => {
        const result = mock(schema);
        expect(parse(schema, result)).toEqual(result);
      }),
      { numRuns: 200 }
    );
  });

  it(`array of strings with length constraints round-trips`, () => {
    // Composite check: array element is itself a constrained string. This
    // catches regressions in element generation when wrapped by array bounds.
    const schema = pipe(array(string()), minLength(1), maxLength(3));
    fc.assert(
      fc.property(fc.constant(schema), (s) => {
        const result = mock(s);
        expect(parse(s, result)).toEqual(result);
      }),
      { numRuns: 50 }
    );
  });
});
