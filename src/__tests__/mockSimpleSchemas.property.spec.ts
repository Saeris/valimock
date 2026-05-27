import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Property tests for schemas with little to no constraint surface — they
 * either always produce the same type (void, undefined, symbol, function),
 * are wrappers around other schemas (lazy, optional/nullish/undefinedable),
 * or accept anything (any, unknown).
 *
 * `never` is intentionally excluded: it's definitionally un-mockable and our
 * mocker throws a MockError when invoked, which is the correct behavior.
 * That's covered by a single unit test below.
 */

describe(`mockSimpleSchemas property-based`, () => {
  it(`any: every value is structurally legal`, () => {
    const schema = v.any();
    fc.assert(
      fc.property(fc.nat(), () => {
        // any() accepts anything; parse should be identity.
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`unknown: every value is structurally legal`, () => {
    const schema = v.unknown();
    fc.assert(
      fc.property(fc.nat(), () => {
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`void: always returns undefined`, () => {
    const schema = v.void_();
    fc.assert(
      fc.property(fc.nat(), () => {
        const result = mock(schema);
        expect(result).toBeUndefined();
        expect(v.parse(schema, result)).toBeUndefined();
      }),
      { numRuns: 50 }
    );
  });

  it(`undefined: always returns undefined`, () => {
    const schema = v.undefined_();
    fc.assert(
      fc.property(fc.nat(), () => {
        const result = mock(schema);
        expect(result).toBeUndefined();
        expect(v.parse(schema, result)).toBeUndefined();
      }),
      { numRuns: 50 }
    );
  });

  it(`symbol: returns a symbol`, () => {
    const schema = v.symbol();
    fc.assert(
      fc.property(fc.nat(), () => {
        const result = mock(schema);
        expect(typeof result).toBe(`symbol`);
        expect(v.parse(schema, result)).toBe(result);
      }),
      { numRuns: 50 }
    );
  });

  it(`function: returns a callable`, () => {
    const schema = v.function_();
    fc.assert(
      fc.property(fc.nat(), () => {
        const result = mock(schema);
        expect(typeof result).toBe(`function`);
        expect(v.parse(schema, result)).toBe(result);
      }),
      { numRuns: 50 }
    );
  });

  it(`undefinedable: wraps inner schema, allows undefined`, () => {
    fc.assert(
      fc.property(fc.constantFrom(v.string(), v.number(), v.boolean()), (inner) => {
        const schema = v.undefinedable(inner as v.GenericSchema);
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`undefinedable with default value is honored`, () => {
    const schema = v.undefinedable(v.string(), `default-value`);
    // Whatever the coin flip, the mocker should always emit the default
    // value when one is declared (matching parse() behavior on missing input).
    for (let i = 0; i < 20; i++) {
      const result = mock(schema);
      expect(result).toBe(`default-value`);
    }
  });

  it(`optional: wraps inner schema, allows undefined or missing`, () => {
    fc.assert(
      fc.property(fc.constantFrom(v.string(), v.number(), v.boolean()), (inner) => {
        const schema = v.optional(inner as v.GenericSchema);
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`nullable: wraps inner schema, allows null`, () => {
    fc.assert(
      fc.property(fc.constantFrom(v.string(), v.number(), v.boolean()), (inner) => {
        const schema = v.nullable(inner as v.GenericSchema);
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`nullish: wraps inner schema, allows null or undefined`, () => {
    fc.assert(
      fc.property(fc.constantFrom(v.string(), v.number(), v.boolean()), (inner) => {
        const schema = v.nullish(inner as v.GenericSchema);
        const result = mock(schema);
        expect(v.parse(schema, result)).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it(`lazy: recurses into getter`, () => {
    // Self-referential schema modelling a linked list of strings.
    type Node = { value: string; next?: Node };
    const nodeSchema: v.GenericSchema<Node> = v.object({
      value: v.string(),
      next: v.optional(v.lazy(() => nodeSchema))
    }) as unknown as v.GenericSchema<Node>;
    for (let i = 0; i < 20; i++) {
      const result = mock(nodeSchema);
      expect(v.parse(nodeSchema, result)).toEqual(result);
    }
  });
});

describe(`mockNever`, () => {
  it(`throws MockError because never is un-mockable by design`, () => {
    const schema = v.never();
    // never() has no satisfying value, so we surface a MockError rather than
    // emitting a value parse will reject. Users who hit this should restructure
    // the schema (e.g. use a union that excludes the never branch) or supply
    // a customMocks entry that returns a sentinel.
    expect(() => mock(schema)).toThrow(/never/);
  });
});
