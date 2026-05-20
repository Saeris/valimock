import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNullish`, () => {
  it.concurrent.each([
    v.nullish(v.any()),
    v.nullish(v.undefined_()),
    v.nullish(v.null_()),
    v.nullish(v.string()),
    v.nullish(v.any(), `foo`),
    v.nullish(v.string(), `foo`),
    v.nullish(v.string(), `foo`)
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.nullishAsync(v.any()),
    v.nullishAsync(v.undefined_()),
    v.nullishAsync(v.null_()),
    v.nullishAsync(v.string()),
    v.nullishAsync(v.any(), `foo`),
    v.nullishAsync(v.string(), `foo`),
    v.nullishAsync(v.string(), `foo`)
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
