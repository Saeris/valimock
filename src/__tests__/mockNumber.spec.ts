import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNumber`, () => {
  it.concurrent.each([
    v.number(),
    v.pipe(v.number(), v.minValue(2)),
    v.pipe(v.number(), v.maxValue(10)),
    v.pipe(v.number(), v.value(5)),
    v.pipe(v.number(), v.minValue(2), v.integer()),
    v.pipe(v.number(), v.maxValue(10), v.integer()),
    v.pipe(v.number(), v.value(5), v.integer())
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.pipeAsync(v.number(), v.minValue(2)),
    v.pipeAsync(v.number(), v.maxValue(10)),
    v.pipeAsync(v.number(), v.value(5)),
    v.pipeAsync(v.number(), v.minValue(2), v.integer()),
    v.pipeAsync(v.number(), v.maxValue(10), v.integer()),
    v.pipeAsync(v.number(), v.value(5), v.integer())
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
