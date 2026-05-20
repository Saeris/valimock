import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { literal, parse, picklist } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

const literalValueArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.integer({ min: -1000, max: 1000 }),
  fc.boolean()
);

describe(`mockLiteral property-based`, () => {
  it(`every literal returns the exact literal value`, () => {
    fc.assert(
      fc.property(literalValueArb, (value) => {
        const schema = literal(value) as unknown as v.GenericSchema<unknown>;
        const result = mock(schema);
        expect(result).toBe(value);
        expect(parse(schema, result)).toBe(value);
      }),
      { numRuns: 100 }
    );
  });
});

describe(`mockPicklist property-based`, () => {
  it(`every mock value is drawn from the picklist options`, () => {
    fc.assert(
      fc.property(fc.array(literalValueArb, { minLength: 1, maxLength: 6 }), (options) => {
        const schema = picklist(options as never) as unknown as v.GenericSchema<unknown>;
        const result = mock(schema);
        expect(options).toContain(result);
        expect(parse(schema, result)).toBe(result);
      }),
      { numRuns: 200 }
    );
  });
});
