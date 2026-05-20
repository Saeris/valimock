import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { date, maxValue, minValue, parse, pipe, value as valueAction } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

const dateSchemaArb: fc.Arbitrary<v.GenericSchema<Date>> = fc.oneof(
  fc.constant(date()),

  // Inclusive bounds: from is at most `to`.
  fc
    .tuple(
      fc.date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true }),
      fc.integer({ min: 0, max: 365 })
    )
    .map(([from, days]) => {
      const to = new Date(from.getTime() + days * 86400000);
      return pipe(date(), minValue(from), maxValue(to)) as unknown as v.GenericSchema<Date>;
    }),

  // min only.
  fc
    .date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true })
    .map((d) => pipe(date(), minValue(d)) as unknown as v.GenericSchema<Date>),

  // max only.
  fc
    .date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true })
    .map((d) => pipe(date(), maxValue(d)) as unknown as v.GenericSchema<Date>),

  // Exact value pin.
  fc
    .date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true })
    .map((d) => pipe(date(), valueAction(d)) as unknown as v.GenericSchema<Date>)
);

describe(`mockDate property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(dateSchemaArb, (schema) => {
        const result = mock(schema);
        expect(parse(schema, result)).toEqual(result);
      }),
      { numRuns: 200 }
    );
  });
});
