import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

const dateSchemaArb: fc.Arbitrary<v.GenericSchema<Date>> = fc.oneof(
  fc.constant(v.date()),

  // Inclusive bounds: from is at most `to`.
  fc
    .tuple(
      fc.date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true }),
      fc.integer({ min: 0, max: 365 })
    )
    .map(([from, days]) => {
      const to = new Date(from.getTime() + days * 86400000);
      return v.pipe(v.date(), v.minValue(from), v.maxValue(to)) as unknown as v.GenericSchema<Date>;
    }),

  // min only.
  fc
    .date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true })
    .map((d) => v.pipe(v.date(), v.minValue(d)) as unknown as v.GenericSchema<Date>),

  // max only.
  fc
    .date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true })
    .map((d) => v.pipe(v.date(), v.maxValue(d)) as unknown as v.GenericSchema<Date>),

  // Exact value pin.
  fc
    .date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true })
    .map((d) => v.pipe(v.date(), v.value(d)) as unknown as v.GenericSchema<Date>)
);

describe(`mockDate property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(dateSchemaArb, (schema) => {
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 200 }
    );
  });
});
