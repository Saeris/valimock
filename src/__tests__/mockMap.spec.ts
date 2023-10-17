import { describe, expect, it } from "vitest";
import {
  object,
  map,
  mapAsync,
  string,
  email,
  maxLength,
  minLength,
  parse,
  parseAsync
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockMap`, () => {
  it.each([
    map(
      string([email()]),
      object({
        name: string([minLength(2), maxLength(16)]),
        city: string([minLength(2), maxLength(24)])
      })
    ),
    mapAsync(
      string([email()]),
      object({
        name: string([minLength(2), maxLength(16)]),
        city: string([minLength(2), maxLength(24)])
      })
    )
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
