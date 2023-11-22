import { describe, expect, it } from "vitest";
import { parse, parseAsync, picklist, picklistAsync } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockPicklist`, () => {
  it.each([
    picklist([`foo`, `bar`, `baz`]),
    picklistAsync([`foo`, `bar`, `baz`])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
