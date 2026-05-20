import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

describe(`mockSet`, () => {
  describe(`property-based`, () => {
    it(`set without bounds: every mock round-trips through parse`, () => {
      const elementShapeArb = fc.constantFrom(v.string(), v.number());
      fc.assert(
        fc.property(elementShapeArb, (element) => {
          const schema = v.set(element as v.GenericSchema) as unknown as v.GenericSchema;
          const result = mock(schema) as Set<unknown>;
          expect(result).toBeInstanceOf(Set);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`set with exact size: result has exactly that many elements`, () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 8 }), (n) => {
          const schema = v.pipe(v.set(v.number()), v.size(n)) as unknown as v.GenericSchema;
          const result = mock(schema) as Set<number>;
          expect(result.size).toBe(n);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 50 }
      );
    });

    it(`set with min/max bounds: result size within bounds`, () => {
      fc.assert(
        fc.property(fc.tuple(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 5 })), ([lo, range]) => {
          const schema = v.pipe(v.set(v.number()), v.minSize(lo), v.maxSize(lo + range)) as unknown as v.GenericSchema;
          const result = mock(schema) as Set<number>;
          expect(result.size).toBeGreaterThanOrEqual(lo);
          expect(result.size).toBeLessThanOrEqual(lo + range);
        }),
        { numRuns: 50 }
      );
    });

    it(`set with not_size: result avoids the forbidden size`, () => {
      const schema = v.pipe(
        v.set(v.number()),
        v.minSize(2),
        v.maxSize(6),
        v.notSize(3),
        v.notSize(4),
        v.notSize(5)
      ) as unknown as v.GenericSchema;
      for (let i = 0; i < 20; i++) {
        const result = mock(schema) as Set<number>;
        expect([2, 6]).toContain(result.size);
      }
    });
  });
});
