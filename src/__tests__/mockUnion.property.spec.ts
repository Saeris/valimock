import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/** Arbitrary producing a union of 2-4 heterogeneous primitive options. */
const unionSchemaArb: fc.Arbitrary<v.GenericSchema<unknown>> = fc
  .array(
    fc.oneof(
      fc.constant(v.string()),
      fc.constant(v.number()),
      fc.constant(v.boolean()),
      fc.integer().map((n) => v.literal(n)),
      fc.string({ minLength: 1, maxLength: 8 }).map((s) => v.literal(s))
    ),
    { minLength: 2, maxLength: 4 }
  )
  .map((options) => v.union(options as never) as unknown as v.GenericSchema<unknown>);

describe(`mockUnion property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(unionSchemaArb, (schema) => {
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 200 }
    );
  });

  it(`nested union (union of unions) still produces a satisfying value`, () => {
    const inner = v.union([v.string(), v.number()]);
    const outer = v.union([
      inner,
      v.boolean(),
      v.pipe(v.number(), v.maxValue(10))
    ]) as unknown as v.GenericSchema<unknown>;
    fc.assert(
      fc.property(fc.constant(outer), (s) => {
        const result = mock(s);
        expect(v.parse(s, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });
});
