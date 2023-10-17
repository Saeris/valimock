import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  nonNullable,
  nonNullableAsync,
  string
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNonNullable`, () => {
  it.each([
    nonNullable(string()),
    nonNullableAsync(string()),
    nonNullable(string()),
    nonNullableAsync(string())
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
