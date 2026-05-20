import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockMap`, () => {
  it.concurrent.each([
    v.map(
      v.pipe(v.string(), v.email()),
      v.object({
        name: v.pipe(v.string(), v.minLength(2), v.maxLength(16)),
        city: v.pipe(v.string(), v.minLength(2), v.maxLength(24))
      })
    )
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.mapAsync(
      v.pipe(v.string(), v.email()),
      v.objectAsync({
        name: v.pipeAsync(v.string(), v.minLength(2), v.maxLength(16)),
        city: v.pipeAsync(v.string(), v.minLength(2), v.maxLength(24))
      })
    )
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
