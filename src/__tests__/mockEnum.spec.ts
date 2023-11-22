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

  it.each([enum_(States), enumAsync(States)])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(
        schema.async ? parseAsync(schema, result) : parse(schema, result)
      ).toStrictEqual(result);
    }
  );
});
