import { describe, expect, it } from "vitest";
import {
  object,
  record,
  recordAsync,
  string,
  email,
  maxLength,
  minLength,
  parse,
  parseAsync
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockRecord`, () => {
  it.each([
    record(
      string([email()]),
      object({
        name: string([minLength(2), maxLength(16)]),
        city: string([minLength(2), maxLength(24)])
      })
    ),
    recordAsync(
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
