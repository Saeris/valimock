import { describe, expect, it } from "vitest";
import { parse, parseAsync, enumType, enumTypeAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockEnum`, () => {
  it.each([
    enumType([`foo`, `bar`, `baz`]),
    enumTypeAsync([`foo`, `bar`, `baz`])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
