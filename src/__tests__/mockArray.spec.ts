import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockArray`, () => {
  it.concurrent.each([
    v.array(v.string()),
    v.array(v.number()),
    v.array(v.union([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())])),
    v.pipe(v.array(v.string()), v.empty()),
    v.pipe(v.array(v.string()), v.minLength(2)),
    v.pipe(v.array(v.string()), v.maxLength(10)),
    v.pipe(v.array(v.string()), v.length(5))
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.arrayAsync(v.string()),
    v.arrayAsync(v.number()),
    v.arrayAsync(v.union([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())])),
    v.pipeAsync(v.arrayAsync(v.string()), v.empty()),
    v.pipeAsync(v.arrayAsync(v.string()), v.minLength(2)),
    v.pipeAsync(v.arrayAsync(v.string()), v.maxLength(10)),
    v.pipeAsync(v.arrayAsync(v.string()), v.length(5))
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
