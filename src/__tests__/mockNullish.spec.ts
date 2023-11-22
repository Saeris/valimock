import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  nullish,
  nullishAsync,
  any,
  string,
  null_,
  undefined_
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNullish`, () => {
  it.each([
    nullish(any()),
    nullishAsync(any()),
    nullish(undefined_()),
    nullishAsync(undefined_()),
    nullish(null_()),
    nullishAsync(null_()),
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
