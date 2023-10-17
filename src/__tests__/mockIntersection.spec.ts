import { describe, expect, it } from "vitest";
import {
  intersection,
  intersectionAsync,
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

describe(`mockIntersection`, () => {
  it.each([
    intersection([
      object({
        name: string([minLength(2), maxLength(12)])
      }),
      object({
        email: string([email()])
      })
    ]),
    intersectionAsync([
      object({
        name: string([minLength(2), maxLength(12)])
      }),
      objectAsync({
        email: string([email()])
      })
    ])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
