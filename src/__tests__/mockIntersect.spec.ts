import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";
import { captureWarnings } from "./helpers/captureWarnings.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

describe(`mockIntersect`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.intersect([
        v.object({ name: v.pipe(v.string(), v.minLength(2), v.maxLength(12)) }),
        v.object({ email: v.pipe(v.string(), v.email()) })
      ])
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.intersectAsync([
        v.object({ name: v.pipe(v.string(), v.minLength(2), v.maxLength(12)) }),
        v.objectAsync({ email: v.pipeAsync(v.string(), v.email()) })
      ])
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    /**
     * Arbitrary producing a homogeneous-object intersect schema. Each option
     * contributes a disjoint set of keys; intersect's deep-merge produces a
     * single object containing every key.
     *
     * We don't fuzz primitive intersections — `intersect([string, number])` is
     * structurally unsatisfiable, and matching-type primitive intersections
     * are equivalent to a single pipeline.
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
        // Enforce disjoint key sets across options. When two options share a
        // key with independently-mocked primitive values, intersect's deep-
        // merge rejects the disagreement — correct Valibot semantics, but not
        // a case our random mocking can satisfy. Real-world intersect usage
        // (extending one object type with another) keeps keys disjoint anyway.
        const usedKeys = new Set<string>();
        const options = perOptionEntries
          .map((entries) => {
            const shape: Record<string, v.GenericSchema> = {};
            for (const { key, valueShape } of entries) {
              if (usedKeys.has(key)) continue;
              usedKeys.add(key);
              shape[key] = valueShape === `string` ? v.string() : valueShape === `number` ? v.number() : v.boolean();
            }
            return v.object(shape);
          })
          .filter((opt) => Object.keys(opt.entries).length > 0);
        return v.intersect(options as never) as unknown as v.GenericSchema<unknown>;
      })
      .filter((schema) => {
        // After the disjoint-keys filter some options may have collapsed to
        // empty; reject the resulting schema if fewer than 2 options remain.
        const opts = (schema as unknown as { options: unknown[] }).options;
        return opts.length >= 2;
      });

    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(intersectSchemaArb, (schema) => {
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toEqual(result);
        }),
        { numRuns: 200 }
      );
    });
  });

  describe(`edge cases`, () => {
    it(`intersect with overlapping primitive options warns about merge issue`, () => {
      // intersect([string, string]) — each option independently mocks a different
      // string. The deep-merge sees unequal primitives and emits a "merge issue"
      // warning. The orchestrator keeps the earlier value.
      const schema = v.intersect([v.string(), v.string()]);
      const { mock, warnings } = captureWarnings();
      const result = mock(schema);
      expect(typeof result).toBe(`string`);
      let sawWarning = false;
      for (let i = 0; i < 30; i++) {
        mock(schema);
        if (warnings.some((w) => w.includes(`incompatible`))) {
          sawWarning = true;
          break;
        }
      }
      expect(sawWarning).toBe(true);
    });
  });
});
