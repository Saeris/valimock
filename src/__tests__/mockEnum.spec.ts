/* eslint-disable @typescript-eslint/prefer-enum-initializers */
/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
/* eslint-disable no-bitwise */
import { describe, expect, it } from "vitest";
import { parse, parseAsync, enum_, enumAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

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

  it.each([enum_(States), enum_(Flags), enum_(Features), enum_(Status)])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );

  it.each([
    enumAsync(States),
    enumAsync(Flags),
    enumAsync(Features),
    enumAsync(Status)
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
