import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

describe(`mockObject`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.object({
        name: v.pipe(v.string(), v.minLength(2), v.maxLength(32)),
        address: v.object({
          city: v.union([
            v.literal(`San Francisco`),
            v.literal(`Portland`),
            v.literal(`Seattle`),
            v.pipe(v.string(), v.minLength(2))
          ]),
          postalCode: v.pipe(v.number(), v.maxValue(99999), v.integer(), v.minValue(0))
        })
      })
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.objectAsync({
        name: v.pipeAsync(v.string(), v.minLength(2), v.maxLength(32)),
        address: v.objectAsync({
          city: v.unionAsync([
            v.literal(`San Francisco`),
            v.literal(`Portland`),
            v.literal(`Seattle`),
            v.pipeAsync(v.string(), v.minLength(2))
          ]),
          postalCode: v.pipeAsync(v.number(), v.maxValue(99999), v.integer(), v.minValue(0))
        })
      })
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    /** Produces a non-empty record of property-name → primitive-schema entries. */
    const objectEntriesArb = fc
      .uniqueArray(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 6 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          shape: fc.constantFrom(
            `string`,
            `number`,
            `boolean`,
            `optional-string`,
            `nullable-number`,
            `nullish-boolean`,
            `exactOptional-string`
          )
        }),
        { minLength: 1, maxLength: 6, selector: (e) => e.key }
      )
      .map((entries) => {
        const shape: Record<string, v.GenericSchema> = {};
        for (const { key, shape: kind } of entries) {
          switch (kind) {
            case `string`:
              shape[key] = v.string();
              break;
            case `number`:
              shape[key] = v.number();
              break;
            case `boolean`:
              shape[key] = v.boolean();
              break;
            case `optional-string`:
              shape[key] = v.optional(v.string()) as v.GenericSchema;
              break;
            case `nullable-number`:
              shape[key] = v.nullable(v.number()) as v.GenericSchema;
              break;
            case `nullish-boolean`:
              shape[key] = v.nullish(v.boolean()) as v.GenericSchema;
              break;
            case `exactOptional-string`:
              shape[key] = v.exactOptional(v.string()) as v.GenericSchema;
              break;
          }
        }
        return shape;
      });

    it(`object: every mock round-trips through parse`, () => {
      fc.assert(
        fc.property(objectEntriesArb, (entries) => {
          const schema = v.object(entries) as unknown as v.GenericSchema;
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`loose_object: extra keys are not added by mocker; declared keys round-trip`, () => {
      fc.assert(
        fc.property(objectEntriesArb, (entries) => {
          const schema = v.looseObject(entries) as unknown as v.GenericSchema;
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`strict_object: no extra keys, every declared key present`, () => {
      fc.assert(
        fc.property(objectEntriesArb, (entries) => {
          const schema = v.strictObject(entries) as unknown as v.GenericSchema;
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`nested objects round-trip`, () => {
      const inner = v.object({ name: v.string(), age: v.number() });
      const outer = v.object({
        label: v.string(),
        payload: inner,
        maybe: v.optional(inner) as v.GenericSchema
      }) as unknown as v.GenericSchema;
      for (let i = 0; i < 50; i++) {
        const result = mockSchema(outer);
        expect(v.parse(outer, result)).toStrictEqual(result);
      }
    });
  });
});
