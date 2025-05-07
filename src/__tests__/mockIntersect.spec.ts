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
  it.each([
    intersect([
      object({
        name: pipe(string(), minLength(2), maxLength(12))
      }),
      object({
        email: pipe(string(), email())
      })
    ])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    intersectAsync([
      object({
        name: pipe(string(), minLength(2), maxLength(12))
      }),
      objectAsync({
        email: pipeAsync(string(), email())
      })
    ])
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
