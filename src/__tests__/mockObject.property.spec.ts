import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import {
  boolean,
  exactOptional,
  looseObject,
  nullable,
  nullish,
  number,
  object,
  optional,
  parse,
  string,
  strictObject
} from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

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
          shape[key] = string();
          break;
        case `number`:
          shape[key] = number();
          break;
        case `boolean`:
          shape[key] = boolean();
          break;
        case `optional-string`:
          shape[key] = optional(string()) as v.GenericSchema;
          break;
        case `nullable-number`:
          shape[key] = nullable(number()) as v.GenericSchema;
          break;
        case `nullish-boolean`:
          shape[key] = nullish(boolean()) as v.GenericSchema;
          break;
        case `exactOptional-string`:
          shape[key] = exactOptional(string()) as v.GenericSchema;
          break;
      }
    }
    return shape;
  });

describe(`mockObject property-based`, () => {
  it(`object: every mock round-trips through parse`, () => {
    fc.assert(
      fc.property(objectEntriesArb, (entries) => {
        const schema = object(entries) as unknown as v.GenericSchema;
        const result = mock(schema);
        expect(parse(schema, result)).toStrictEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`loose_object: extra keys are not added by mocker; declared keys round-trip`, () => {
    fc.assert(
      fc.property(objectEntriesArb, (entries) => {
        const schema = looseObject(entries) as unknown as v.GenericSchema;
        const result = mock(schema);
        expect(parse(schema, result)).toStrictEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`strict_object: no extra keys, every declared key present`, () => {
    fc.assert(
      fc.property(objectEntriesArb, (entries) => {
        const schema = strictObject(entries) as unknown as v.GenericSchema;
        const result = mock(schema);
        expect(parse(schema, result)).toStrictEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`nested objects round-trip`, () => {
    const inner = object({ name: string(), age: number() });
    const outer = object({
      label: string(),
      payload: inner,
      maybe: optional(inner) as v.GenericSchema
    }) as unknown as v.GenericSchema;
    for (let i = 0; i < 50; i++) {
      const result = mock(outer);
      expect(parse(outer, result)).toStrictEqual(result);
    }
  });
});
