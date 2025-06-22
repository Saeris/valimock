import { describe, expect, it } from "vitest";
import {
  pipe,
  pipeAsync,
  intersect,
  intersectAsync,
  object,
  objectAsync,
  string,
  email,
  maxLength,
  minLength,
  parse,
  parseAsync
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockIntersect`, () => {
  it.concurrent.each([
    intersect([
      object({ name: pipe(string(), minLength(2), maxLength(12)) }),
      object({ email: pipe(string(), email()) })
    ])
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    intersectAsync([
      object({ name: pipe(string(), minLength(2), maxLength(12)) }),
      objectAsync({ email: pipeAsync(string(), email()) })
    ])
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
