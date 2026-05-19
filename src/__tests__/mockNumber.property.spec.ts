import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import {
  finite,
  gtValue,
  integer,
  ltValue,
  maxValue,
  minValue,
  multipleOf,
  notValue,
  notValues,
  number,
  parse,
  pipe,
  safeInteger,
  value as valueAction,
  values as valuesAction
} from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

type NumberPipeItem = v.PipeItem<number, number, v.BaseIssue<unknown>>;

/**
 * Arbitrary producing a number schema with a satisfiable mix of constraints.
 * Each "kind" encodes one combination of actions; satisfiability is checked
 * at generation time so every emitted schema can in principle round-trip.
 */
const numberSchemaArb: fc.Arbitrary<v.GenericSchema<number>> = fc.oneof(
  fc.constant(number()),

  // Integer-only.
  fc.constant(pipe(number(), integer())),
  fc.constant(pipe(number(), safeInteger())),
  fc.constant(pipe(number(), finite())),

  // Inclusive bounds.
  fc.tuple(fc.integer({ min: -100, max: 100 }), fc.integer({ min: 0, max: 100 })).map(([lo, range]) => {
    const schema = pipe(number(), minValue(lo), maxValue(lo + range)) as unknown as v.GenericSchema<number>;
    return schema;
  }),

  // Strict bounds.
  fc.tuple(fc.integer({ min: -100, max: 100 }), fc.integer({ min: 2, max: 100 })).map(([lo, range]) => {
    const schema = pipe(number(), gtValue(lo), ltValue(lo + range)) as unknown as v.GenericSchema<number>;
    return schema;
  }),

  // Integer + bounds.
  fc.tuple(fc.integer({ min: -100, max: 100 }), fc.integer({ min: 1, max: 100 })).map(([lo, range]) => {
    const schema = pipe(number(), integer(), minValue(lo), maxValue(lo + range)) as unknown as v.GenericSchema<number>;
    return schema;
  }),

  // multiple_of within a range.
  fc
    .tuple(fc.integer({ min: 2, max: 25 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 5, max: 50 }))
    .filter(([factor, lo, range]) => Math.floor((lo + range) / factor) >= Math.ceil(lo / factor))
    .map(([factor, lo, range]) => {
      const schema = pipe(
        number(),
        integer(),
        multipleOf(factor),
        minValue(lo),
        maxValue(lo + range)
      ) as unknown as v.GenericSchema<number>;
      return schema;
    }),

  // Exact value pin.
  fc
    .integer({ min: -1000, max: 1000 })
    .map((n) => pipe(number(), valueAction(n)) as unknown as v.GenericSchema<number>),

  // Allow-list.
  fc
    .array(fc.integer({ min: -100, max: 100 }), { minLength: 1, maxLength: 5 })
    .map((arr) => pipe(number(), valuesAction(arr)) as unknown as v.GenericSchema<number>),

  // Forbidden values (with a bounded range that leaves room).
  fc
    .tuple(fc.integer({ min: 0, max: 50 }), fc.integer({ min: 60, max: 100 }), fc.integer({ min: 0, max: 5 }))
    .map(([lo, hi, forbidden]) => {
      const items: NumberPipeItem[] = [
        integer() as NumberPipeItem,
        minValue(lo) as NumberPipeItem,
        maxValue(hi) as NumberPipeItem,
        notValue(forbidden) as NumberPipeItem
      ];
      return pipe(number(), ...items) as unknown as v.GenericSchema<number>;
    }),

  // not_values with several forbidden integers.
  fc.array(fc.integer({ min: -10, max: 10 }), { minLength: 1, maxLength: 4 }).map((arr) => {
    const items: NumberPipeItem[] = [
      integer() as NumberPipeItem,
      minValue(-100) as NumberPipeItem,
      maxValue(100) as NumberPipeItem,
      notValues(arr) as NumberPipeItem
    ];
    return pipe(number(), ...items) as unknown as v.GenericSchema<number>;
  })
);

describe(`mockNumber property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(numberSchemaArb, (schema) => {
        const result = mock(schema);
        expect(parse(schema, result)).toBe(result);
      }),
      { numRuns: 200 }
    );
  });
});
