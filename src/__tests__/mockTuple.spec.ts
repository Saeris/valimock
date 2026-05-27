import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

const tupleItemsArb = fc.array(fc.constantFrom(v.string(), v.number(), v.boolean()), { minLength: 1, maxLength: 4 });

describe(`mockTuple`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([
      v.tuple([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())]),
      v.pipe(v.tuple([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())]), v.maxLength(2))
    ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    });

    it.concurrent.each([
      v.tupleAsync([v.pipe(v.string(), v.url()), v.pipeAsync(v.number(), v.maxValue(20), v.integer())]),
      v.pipeAsync(
        v.tupleAsync([v.pipe(v.string(), v.url()), v.pipeAsync(v.number(), v.maxValue(20), v.integer())]),
        v.maxLength(2)
      )
    ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    });
  });

  describe(`property-based`, () => {
    it(`tuple: every mock round-trips through parse`, () => {
      fc.assert(
        fc.property(tupleItemsArb, (items) => {
          const schema = v.tuple(items as never) as unknown as v.GenericSchema;
          const result = mockSchema(schema) as unknown[];
          expect(result.length).toBe(items.length);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`loose_tuple: declared positions present; extra positions tolerated by parse`, () => {
      fc.assert(
        fc.property(tupleItemsArb, (items) => {
          const schema = v.looseTuple(items as never) as unknown as v.GenericSchema;
          const result = mockSchema(schema) as unknown[];
          expect(result.length).toBe(items.length);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`strict_tuple: exactly the declared positions, nothing more`, () => {
      fc.assert(
        fc.property(tupleItemsArb, (items) => {
          const schema = v.strictTuple(items as never) as unknown as v.GenericSchema;
          const result = mockSchema(schema) as unknown[];
          expect(result.length).toBe(items.length);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it(`tuple_with_rest: declared positions round-trip (rest tail is currently omitted)`, () => {
      // Valimock's `tuple_with_rest` mocker reuses the tuple mocker, which only
      // generates the declared positional items. Parse accepts this when the
      // rest position is optional (zero items). This property guards that the
      // emitted prefix matches the declared positions.
      fc.assert(
        fc.property(tupleItemsArb, (items) => {
          const schema = v.tupleWithRest(items as never, v.string()) as unknown as v.GenericSchema;
          const result = mockSchema(schema) as unknown[];
          expect(result.length).toBe(items.length);
          expect(v.parse(schema, result)).toStrictEqual(result);
        }),
        { numRuns: 100 }
      );
    });
  });
});
