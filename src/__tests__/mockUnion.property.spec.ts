import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { boolean, literal, number, parse, pipe, string, union } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/** Arbitrary producing a union of 2-4 heterogeneous primitive options. */
const unionSchemaArb: fc.Arbitrary<v.GenericSchema<unknown>> = fc
  .array(
    fc.oneof(
      fc.constant(string()),
      fc.constant(number()),
      fc.constant(boolean()),
      fc.integer().map((n) => literal(n)),
      fc.string({ minLength: 1, maxLength: 8 }).map((s) => literal(s))
    ),
    { minLength: 2, maxLength: 4 }
  )
  .map((options) => union(options as never) as unknown as v.GenericSchema<unknown>);

describe(`mockUnion property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(unionSchemaArb, (schema) => {
        const result = mock(schema);
        expect(parse(schema, result)).toEqual(result);
      }),
      { numRuns: 200 }
    );
  });

  it(`nested union (union of unions) still produces a satisfying value`, () => {
    const inner = union([string(), number()]);
    const outer = union([inner, boolean(), pipe(number(), v.maxValue(10))]) as unknown as v.GenericSchema<unknown>;
    fc.assert(
      fc.property(fc.constant(outer), (s) => {
        const result = mock(s);
        expect(parse(s, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });
});
