import { describe, expect, it } from "vitest";
import { parse, parseAsync, boolean, booleanAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockBoolean`, () => {
  it.each([boolean(), booleanAsync()])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(
        schema.async ? parseAsync(schema, result) : parse(schema, result)
      ).toStrictEqual(result);
    }
  );
});
