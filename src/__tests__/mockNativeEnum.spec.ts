import { describe, expect, it } from "vitest";
import { parse, parseAsync, nativeEnum, nativeEnumAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNativeEnum`, () => {
  enum States {
    INITIAL = 0,
    FETCHING = 1,
    RESOLVED = 2,
    REJECTED = 3
  }

  it.each([nativeEnum(States), nativeEnumAsync(States)])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(
        schema.async ? parseAsync(schema, result) : parse(schema, result)
      ).toStrictEqual(result);
    }
  );
});
