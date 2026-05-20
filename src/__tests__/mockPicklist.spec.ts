import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

describe(`mockPicklist`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([v.picklist([`foo`, `bar`, `baz`])])(
      `should generate valid mock data (%#)`,
      { repeats: 5 },
      (schema) => {
        const result = mockSchema(schema);
        expect(v.parse(schema, result)).toStrictEqual(result);
      }
    );
  });

  describe(`property-based`, () => {
    const literalValueArb = fc.oneof(
      fc.string({ minLength: 1, maxLength: 10 }),
      fc.integer({ min: -1000, max: 1000 }),
      fc.boolean()
    );

    it(`every literal returns the exact literal value`, () => {
      fc.assert(
        fc.property(literalValueArb, (value) => {
          const schema = v.literal(value) as unknown as v.GenericSchema<unknown>;
          const result = mockSchema(schema);
          expect(result).toBe(value);
          expect(v.parse(schema, result)).toBe(value);
        }),
        { numRuns: 100 }
      );
    });

    it(`every mock value is drawn from the picklist options`, () => {
      fc.assert(
        fc.property(fc.array(literalValueArb, { minLength: 1, maxLength: 6 }), (options) => {
          const schema = v.picklist(options as never) as unknown as v.GenericSchema<unknown>;
          const result = mockSchema(schema);
          expect(options).toContain(result);
          expect(v.parse(schema, result)).toBe(result);
        }),
        { numRuns: 200 }
      );
    });
  });
});
