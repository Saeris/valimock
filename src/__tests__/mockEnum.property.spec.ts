import { describe, expect, it } from "vite-plus/test";
import { enum_, parse } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * TS native enums are nominal types declared at compile time, so we can't
 * generate them via fast-check directly. Instead we cover several
 * representative shapes by hand: string enum, numeric enum (with reverse
 * mapping), and mixed.
 */

enum StringEnum {
  A = `a`,
  B = `b`,
  C = `c`
}

enum NumericEnum {
  X,
  Y,
  Z
}

enum MixedEnum {
  Yes = `yes`,
  No = `no`,
  Maybe = 42
}

describe(`mockEnum`, () => {
  it.each([
    [`string enum`, enum_(StringEnum), Object.values(StringEnum)],
    [`numeric enum`, enum_(NumericEnum), [0, 1, 2]],
    [`mixed enum`, enum_(MixedEnum), [`yes`, `no`, 42]]
  ])(`%s: every mock value is a valid enum member and round-trips`, (_label, schema, validValues) => {
    for (let i = 0; i < 50; i++) {
      const result = mock(schema);
      expect(validValues).toContain(result);
      expect(parse(schema, result)).toBe(result);
    }
  });
});
