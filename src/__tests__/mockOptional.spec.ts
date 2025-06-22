import { describe, expect, it } from "vitest";
import { parse, parseAsync, object, optional, optionalAsync, any, string, undefined_, null_ } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockOptional`, () => {
  it.concurrent.each([
    optional(any()),
    optional(undefined_()),
    optional(null_()),
    optional(string()),
    optional(any(), `foo`),
    optional(any(), `foo`),
    optional(string(), `foo`),
    optional(string(), `foo`),
    object({
      optional: optional(string()),
      withDefault: optional(string(), `foo`)
    })
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    optionalAsync(any()),
    optionalAsync(undefined_()),
    optionalAsync(null_()),
    optionalAsync(string()),
    optionalAsync(any(), `foo`),
    optionalAsync(any(), `foo`),
    optionalAsync(string(), `foo`),
    optionalAsync(string(), `foo`)
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
