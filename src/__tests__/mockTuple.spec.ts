import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockTuple`, () => {
  it.concurrent.each([
    v.tuple([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())]),
    v.pipe(v.tuple([v.pipe(v.string(), v.url()), v.pipe(v.number(), v.maxValue(20), v.integer())]), v.maxLength(2))
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.tupleAsync([v.pipe(v.string(), v.url()), v.pipeAsync(v.number(), v.maxValue(20), v.integer())]),
    v.pipeAsync(
      v.tupleAsync([v.pipe(v.string(), v.url()), v.pipeAsync(v.number(), v.maxValue(20), v.integer())]),
      v.maxLength(2)
    )
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
