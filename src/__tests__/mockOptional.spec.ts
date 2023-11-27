import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  optional,
  optionalAsync,
  any,
  string,
  undefined_,
  null_
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockOptional`, () => {
  it.each([
    optional(any()),
    optional(undefined_()),
    optional(null_()),
    optional(string()),
    optional(any(), `foo`),
    optional(any(), `foo`),
    optional(string(), `foo`),
    optional(string(), `foo`)
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    optionalAsync(any()),
    optionalAsync(undefined_()),
    optionalAsync(null_()),
    optionalAsync(string()),
    optionalAsync(any(), `foo`),
    optionalAsync(any(), `foo`),
    optionalAsync(string(), `foo`),
    optionalAsync(string(), `foo`)
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
