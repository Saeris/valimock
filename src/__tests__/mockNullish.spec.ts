import { describe, expect, it } from "vitest";
import { parse, parseAsync, nullish, nullishAsync, any, string, null_, undefined_ } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNullish`, () => {
  it.concurrent.each([
    nullish(any()),
    nullish(undefined_()),
    nullish(null_()),
    nullish(string()),
    nullish(any(), `foo`),
    nullish(string(), `foo`),
    nullish(string(), `foo`)
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    nullishAsync(any()),
    nullishAsync(undefined_()),
    nullishAsync(null_()),
    nullishAsync(string()),
    nullishAsync(any(), `foo`),
    nullishAsync(string(), `foo`),
    nullishAsync(string(), `foo`)
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
