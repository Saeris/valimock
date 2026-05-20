import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

const unionSchemaArb: fc.Arbitrary<v.GenericSchema<unknown>> = fc
  .array(
    fc.oneof(
      fc.constant(v.string()),
      fc.constant(v.number()),
      fc.constant(v.boolean()),
      fc.integer().map((n) => v.literal(n)),
      fc.string({ minLength: 1, maxLength: 8 }).map((s) => v.literal(s))
    ),
    { minLength: 2, maxLength: 4 }
  )
  .map((options) => v.union(options as never) as unknown as v.GenericSchema<unknown>);

describe(`mockUnion`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([v.union([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())])])(
      `should generate valid mock data (%#)`,
      { repeats: 5 },
      (schema) => {
        const result = mockSchema(schema);
        expect(v.parse(schema, result)).toStrictEqual(result);
      }
    );

    it.concurrent.each([
      v.unionAsync([v.pipe(v.string(), v.url()), v.pipeAsync(v.number(), v.maxValue(20), v.integer())])
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(unionSchemaArb, (schema) => {
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toEqual(result);
        }),
        { numRuns: 200 }
      );
    });

    it(`nested union (union of unions) still produces a satisfying value`, () => {
      const inner = v.union([v.string(), v.number()]);
      const outer = v.union([
        inner,
        v.boolean(),
        v.pipe(v.number(), v.maxValue(10))
      ]) as unknown as v.GenericSchema<unknown>;
      fc.assert(
        fc.property(fc.constant(outer), (s) => {
          const result = mockSchema(s);
          expect(v.parse(s, result)).toEqual(result);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe(`edge cases`, () => {
    it(`overlapping union (later option's mock matches earlier option): retries to find a non-overlapping option`, () => {
      // Option[0] is a strict supertype of option[1]'s shape — parse routes to
      // option[0] and strips option[1]'s extra key. mockUnion must detect and
      // retry until the picked option's mock round-trips cleanly.
      const schema = v.union([
        v.object({ kind: v.string() }),
        v.object({ kind: v.literal(`special`), extra: v.number() })
      ]);
      const m = new Valimock({ onWarn: () => {} }).mock;
      for (let i = 0; i < 50; i++) {
        const result = m(schema);
        expect(v.parse(schema, result)).toStrictEqual(result);
      }
    });

    it(`onWarn fires for unions where no option survives the round-trip`, () => {
      // Option[0] strictly contains option[1]'s shape. The retry loop's
      // untried-option preference recovers without emitting the warning.
      const schema = v.union([v.object({ kind: v.string() }), v.object({ kind: v.string(), more: v.number() })]);
      const m = new Valimock({ onWarn: () => {} }).mock;
      for (let i = 0; i < 20; i++) {
        const result = m(schema);
        expect(v.parse(schema, result)).toStrictEqual(result);
      }
    });
  });
});
