import { describe, expect, it } from "vitest";
import { parse, parseAsync, nullable, nullableAsync, string } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNullable`, () => {
  it.each([
    nullable(string()),
    nullableAsync(string()),
    nullable(string()),
    nullableAsync(string())
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
