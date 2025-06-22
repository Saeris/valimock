import { describe, expect, it } from "vitest";
import { parse, parseAsync, nonNullable, nonNullableAsync, string } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNonNullable`, () => {
  it.concurrent.each([nonNullable(string())])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([nonNullableAsync(string())])(
    `should generate valid mock data with async validation (%#)`,
    { repeats: 5 },
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
