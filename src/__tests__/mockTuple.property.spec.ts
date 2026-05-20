import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { boolean, looseTuple, number, parse, string, strictTuple, tuple, tupleWithRest } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/** Tuples with 1-4 positional elements of mixed primitive types. */
const tupleItemsArb = fc.array(fc.constantFrom(string(), number(), boolean()), { minLength: 1, maxLength: 4 });

describe(`mockTuple property-based`, () => {
  it(`tuple: every mock round-trips through parse`, () => {
    fc.assert(
      fc.property(tupleItemsArb, (items) => {
        const schema = tuple(items as never) as unknown as v.GenericSchema;
        const result = mock(schema) as unknown[];
        expect(result.length).toBe(items.length);
        expect(parse(schema, result)).toStrictEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`loose_tuple: declared positions present; extra positions tolerated by parse`, () => {
    fc.assert(
      fc.property(tupleItemsArb, (items) => {
        const schema = looseTuple(items as never) as unknown as v.GenericSchema;
        const result = mock(schema) as unknown[];
        expect(result.length).toBe(items.length);
        expect(parse(schema, result)).toStrictEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`strict_tuple: exactly the declared positions, nothing more`, () => {
    fc.assert(
      fc.property(tupleItemsArb, (items) => {
        const schema = strictTuple(items as never) as unknown as v.GenericSchema;
        const result = mock(schema) as unknown[];
        expect(result.length).toBe(items.length);
        expect(parse(schema, result)).toStrictEqual(result);
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
        const schema = tupleWithRest(items as never, string()) as unknown as v.GenericSchema;
        const result = mock(schema) as unknown[];
        expect(result.length).toBe(items.length);
        expect(parse(schema, result)).toStrictEqual(result);
      }),
      { numRuns: 100 }
    );
  });
});
