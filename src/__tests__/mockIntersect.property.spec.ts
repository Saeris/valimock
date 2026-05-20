import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { boolean, intersect, number, object, parse, string } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Arbitrary producing a homogeneous-object intersect schema. Each option
 * contributes a disjoint set of keys; intersect's deep-merge produces a
 * single object containing every key.
 *
 * We don't fuzz primitive intersections — `intersect([string, number])` is
 * structurally unsatisfiable (no value is both a string and a number), and
 * even matching-type primitive intersections like
 * `intersect([string(), pipe(string(), email())])` are equivalent to a
 * single pipeline.
 */
const intersectSchemaArb: fc.Arbitrary<v.GenericSchema<unknown>> = fc
  .array(
    fc.array(
      fc.record({
        key: fc.string({ minLength: 1, maxLength: 5 }).filter((k) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(k)),
        valueShape: fc.constantFrom(`string`, `number`, `boolean`)
      }),
      { minLength: 1, maxLength: 3 }
    ),
    { minLength: 2, maxLength: 3 }
  )
  .map((perOptionEntries) => {
    // Enforce disjoint key sets across options. If two options share a key
    // with independently-mocked primitive values, intersect's deep-merge will
    // reject the disagreement — that's correct Valibot semantics, but it's
    // not a case our random mocking can satisfy. Real-world intersect usage
    // (extending one object type with another) keeps keys disjoint anyway.
    const usedKeys = new Set<string>();
    const options = perOptionEntries
      .map((entries) => {
        const shape: Record<string, v.GenericSchema> = {};
        for (const { key, valueShape } of entries) {
          if (usedKeys.has(key)) continue;
          usedKeys.add(key);
          shape[key] = valueShape === `string` ? string() : valueShape === `number` ? number() : boolean();
        }
        return object(shape);
      })
      .filter((opt) => Object.keys(opt.entries).length > 0);
    return intersect(options as never) as unknown as v.GenericSchema<unknown>;
  })
  .filter((schema) => {
    // After the disjoint-keys filter some options may have collapsed to
    // empty; reject the resulting schema if fewer than 2 options remain.
    const opts = (schema as unknown as { options: unknown[] }).options;
    return opts.length >= 2;
  });

describe(`mockIntersect property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(intersectSchemaArb, (schema) => {
        const result = mock(schema);
        expect(parse(schema, result)).toEqual(result);
      }),
      { numRuns: 200 }
    );
  });
});
