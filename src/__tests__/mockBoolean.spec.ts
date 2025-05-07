import { describe, expect, it } from "vitest";
import { parse, boolean } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockBoolean`, () => {
  it.each([boolean()])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });
});
