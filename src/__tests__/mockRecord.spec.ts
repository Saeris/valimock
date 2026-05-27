import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;
const mockWith = (recordKeysLength: number): Valimock[`mock`] =>
  new Valimock({ onWarn: () => {}, recordKeysLength }).mock;

describe(`mockRecord`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.record(
        v.pipe(v.string(), v.email()),
        v.object({
          name: v.pipe(v.string(), v.minLength(2), v.maxLength(16)),
          city: v.pipe(v.string(), v.minLength(2), v.maxLength(24))
        })
      )
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.recordAsync(
        v.pipeAsync(v.string(), v.email()),
        v.objectAsync({
          name: v.pipeAsync(v.string(), v.minLength(2), v.maxLength(16)),
          city: v.pipeAsync(v.string(), v.minLength(2), v.maxLength(24))
        })
      )
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    it(`record with string keys: every mock round-trips through parse`, () => {
      const valueShapeArb = fc.constantFrom(v.string(), v.number(), v.boolean());
      fc.assert(
        fc.property(valueShapeArb, (valueSchema) => {
          const schema = v.record(v.string(), valueSchema as v.GenericSchema) as unknown as v.GenericSchema;
          const result = mockWith(2)(schema);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`record with uuid keys: keys are uuids`, () => {
      const schema = v.record(v.pipe(v.string(), v.uuid()), v.number()) as unknown as v.GenericSchema;
      const result = mockWith(3)(schema) as Record<string, number>;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const key of Object.keys(result)) {
        expect(key).toMatch(uuidRegex);
      }
    });

    it(`record honors recordKeysLength when key schema produces unique values`, () => {
      const schema = v.record(v.pipe(v.string(), v.uuid()), v.number()) as unknown as v.GenericSchema;
      for (const targetLen of [1, 3, 5]) {
        const result = mockWith(targetLen)(schema) as Record<string, number>;
        expect(Object.keys(result).length).toBe(targetLen);
      }
    });

    it(`record may shrink when key schema produces duplicates (picklist)`, () => {
      const schema = v.record(v.picklist([`a`, `b`]), v.number()) as unknown as v.GenericSchema;
      const result = mockWith(5)(schema) as Record<string, number>;
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(result).length).toBeLessThanOrEqual(2);
      for (const key of Object.keys(result)) {
        expect([`a`, `b`]).toContain(key);
      }
    });
  });
});
