/* eslint-disable @typescript-eslint/prefer-enum-initializers */
/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
/* eslint-disable no-bitwise */
import { describe, expect, it } from "vitest";
import * as v from "valibot";
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

  it.each([v.enum(States), v.enum(Flags), v.enum(Features), v.enum(Status)])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    }
  );
});
