import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  nullish,
  nullishAsync,
  any,
  string,
  nullType,
  undefinedType
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNullish`, () => {
  it.each([
    nullish(any()),
    nullishAsync(any()),
    nullish(undefinedType()),
    nullishAsync(undefinedType()),
    nullish(nullType()),
    nullishAsync(nullType()),
    nullish(string()),
    nullishAsync(string()),
    nullish(any(), `foo`),
    nullishAsync(any(), `foo`),
    nullish(string(), `foo`),
    nullishAsync(string(), `foo`),
    nullish(string(), `foo`),
    nullishAsync(string(), `foo`)
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
