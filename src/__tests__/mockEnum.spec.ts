/* eslint-disable @typescript-eslint/prefer-enum-initializers */
/* eslint-disable @typescript-eslint/prefer-literal-enum-member */

import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

describe(`mockEnum`, () => {
  enum States {
    INITIAL = 0,
    FETCHING = 1,
    RESOLVED = 2,
    REJECTED = 3
  }

  enum Flags {
    JOIN = 1 << 0,
    SPECTATE = 1 << 1,
    PLAY = 1 << 2
  }

  enum Features {
    FOO = `FOO`,
    BAR = `BAR`,
    BAZ = `BAZ`
  }

  enum Status {
    RED,
    YELLOW,
    GREEN
  }

  describe(`hand-written cases`, () => {
    it.concurrent.each([v.enum(States), v.enum(Flags), v.enum(Features), v.enum(Status)])(
      `should generate valid mock data (%#)`,
      { repeats: 5 },
      (schema) => {
        const result = mockSchema(schema);
        expect(v.parse(schema, result)).toStrictEqual(result);
      }
    );
  });

  describe(`property-based`, () => {
    // TS native enums are nominal types declared at compile time, so we can't
    // generate them via fast-check directly. Instead we cover several
    // representative shapes — string, numeric (with reverse mapping), and
    // mixed — with many iterations each.

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

    it.each([
      [`string enum`, v.enum_(StringEnum), Object.values(StringEnum)],
      [`numeric enum`, v.enum_(NumericEnum), [0, 1, 2]],
      [`mixed enum`, v.enum_(MixedEnum), [`yes`, `no`, 42]]
    ])(`%s: every mock value is a valid enum member and round-trips`, (_label, schema, validValues) => {
      for (let i = 0; i < 50; i++) {
        const result = mockSchema(schema);
        expect(validValues).toContain(result);
        expect(v.parse(schema, result)).toBe(result);
      }
    });
  });
});
