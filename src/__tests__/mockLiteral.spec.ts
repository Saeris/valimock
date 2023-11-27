import { describe, expect, it } from "vitest";
import { parse, parseAsync, literal, literalAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockLiteral`, () => {
  it.each([literal(`foo`), literal(6)])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );

  it.each([literalAsync(`bar`), literalAsync(9)])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
