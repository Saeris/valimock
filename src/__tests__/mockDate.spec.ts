import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

describe(`mockDate`, () => {
  const requirement = new Date(Date.now() + 3600000);

  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.date(),
      v.pipe(v.date(), v.value(new Date(`2025-05-07T11:41:17.000Z`))),
      v.pipe(v.date(), v.minValue(requirement)),
      v.pipe(v.date(), v.maxValue(requirement))
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.pipeAsync(v.date(), v.minValue(requirement)),
      v.pipeAsync(v.date(), v.maxValue(requirement))
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    const dateArb = fc.date({ min: new Date(2000, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true });

    const dateSchemaArb: fc.Arbitrary<v.GenericSchema<Date>> = fc.oneof(
      fc.constant(v.date()),
      fc.tuple(dateArb, fc.integer({ min: 0, max: 365 })).map(([from, days]) => {
        const to = new Date(from.getTime() + days * 86400000);
        return v.pipe(v.date(), v.minValue(from), v.maxValue(to)) as unknown as v.GenericSchema<Date>;
      }),
      dateArb.map((d) => v.pipe(v.date(), v.minValue(d)) as unknown as v.GenericSchema<Date>),
      dateArb.map((d) => v.pipe(v.date(), v.maxValue(d)) as unknown as v.GenericSchema<Date>),
      dateArb.map((d) => v.pipe(v.date(), v.value(d)) as unknown as v.GenericSchema<Date>)
    );

    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(dateSchemaArb, (schema) => {
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toEqual(result);
        }),
        { numRuns: 200 }
      );
    });
  });
});
