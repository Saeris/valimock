import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockIntersect`, () => {
  it.concurrent.each([
    v.intersect([
      v.object({ name: v.pipe(v.string(), v.minLength(2), v.maxLength(12)) }),
      v.object({ email: v.pipe(v.string(), v.email()) })
    ])
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.intersectAsync([
      v.object({ name: v.pipe(v.string(), v.minLength(2), v.maxLength(12)) }),
      v.objectAsync({ email: v.pipeAsync(v.string(), v.email()) })
    ])
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
