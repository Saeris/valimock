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

  it.each([enum_(States)])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([enumAsync(States)])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
