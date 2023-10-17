import { describe, expect, it } from "vitest";
import { parse, parseAsync, nan, nanAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNaN`, () => {
  it.each([nan(), nanAsync(), nan(), nanAsync()])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(
        schema.async ? parseAsync(schema, result) : parse(schema, result)
      ).toStrictEqual(result);
    }
  );
});
