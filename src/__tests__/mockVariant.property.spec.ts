import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Arbitrary producing a discriminated-union (variant) schema. Each option is
 * an object whose `type` key is a literal — the discriminator that lets
 * Valibot route an input to the correct variant.
 */
const variantSchemaArb: fc.Arbitrary<v.GenericSchema<unknown>> = fc
  .array(
    fc
      .record({
        tag: fc.string({ minLength: 1, maxLength: 8 }),
        bodyShape: fc.constantFrom(`string`, `number`, `boolean`)
      })
      .filter(({ tag }) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(tag)),
    { minLength: 2, maxLength: 4 }
  )
  .filter((entries) => {
    // Reject duplicate tags — variant requires unique discriminator values.
    const seen = new Set<string>();
    for (const { tag } of entries) {
      if (seen.has(tag)) return false;
      seen.add(tag);
    }
    return true;
  })
  .map((entries) => {
    const options = entries.map(({ tag, bodyShape }) => {
      const body = bodyShape === `string` ? v.string() : bodyShape === `number` ? v.number() : v.boolean();
      return v.object({ type: v.literal(tag), data: body });
    });
    return v.variant(`type`, options as never) as unknown as v.GenericSchema<unknown>;
  });

describe(`mockVariant property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(variantSchemaArb, (schema) => {
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 200 }
    );
  });
});
