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
    optionalAsync(any()),
    optional(undefined_()),
    optionalAsync(undefined_()),
    optional(null_()),
    optionalAsync(null_()),
    optional(string()),
    optionalAsync(string()),
    optional(any(), `foo`),
    optionalAsync(any(), `foo`),
    optional(any(), `foo`),
    optionalAsync(any(), `foo`),
    optional(string(), `foo`),
    optionalAsync(string(), `foo`),
    optional(string(), `foo`),
    optionalAsync(string(), `foo`)
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
