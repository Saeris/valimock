import { describe, expect, it } from "vitest";
import { parse, nan } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNaN`, () => {
  it.each([nan()])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });
});
