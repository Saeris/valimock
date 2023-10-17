import { describe, expect, it } from "vitest";
import { parse, parseAsync, literal, literalAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockLiteral`, () => {
  it.each([literal(`foo`), literalAsync(`bar`), literal(6), literalAsync(9)])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(
        schema.async ? parseAsync(schema, result) : parse(schema, result)
      ).toStrictEqual(result);
    }
  );
});
