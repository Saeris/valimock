import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockWith = (mapEntriesLength: number): Valimock[`mock`] =>
  new Valimock({ onWarn: () => {}, mapEntriesLength }).mock;

describe(`mockMap property-based`, () => {
  it(`map with string keys: every mock round-trips through parse`, () => {
    const valueShapeArb = fc.constantFrom(v.string(), v.number(), v.boolean());
    fc.assert(
      fc.property(valueShapeArb, (valueSchema) => {
        const schema = v.map(v.string(), valueSchema as v.GenericSchema) as unknown as v.GenericSchema;
        const result = mockWith(2)(schema) as Map<unknown, unknown>;
        expect(result).toBeInstanceOf(Map);
        expect(v.parse(schema, result)).toStrictEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`map honors mapEntriesLength when key schema produces unique values`, () => {
    const schema = v.map(v.pipe(v.string(), v.uuid()), v.number()) as unknown as v.GenericSchema;
    for (const targetLen of [1, 3, 5]) {
      const result = mockWith(targetLen)(schema) as Map<string, number>;
      expect(result.size).toBe(targetLen);
    }
  });

  it(`map shrinks gracefully when key schema produces duplicates (picklist)`, () => {
    // picklist with 2 options + mapEntriesLength=5 → at most 2 distinct keys
    // before the retry budget exhausts.
    const schema = v.map(v.picklist([`a`, `b`]), v.number()) as unknown as v.GenericSchema;
    const warnings: string[] = [];
    const m = new Valimock({ onWarn: (msg) => warnings.push(msg), mapEntriesLength: 5 }).mock;
    const result = m(schema) as Map<string, number>;
    expect(result.size).toBeGreaterThanOrEqual(1);
    expect(result.size).toBeLessThanOrEqual(2);
    for (const key of result.keys()) {
      expect([`a`, `b`]).toContain(key);
    }
    // Warning should have surfaced about the size shortfall.
    expect(warnings.some((w) => w.includes(`Map generation could not reach target size`))).toBe(true);
  });
});
