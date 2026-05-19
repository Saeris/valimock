import { describe, expect, it } from "vite-plus/test";
import { parse, literal } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockLiteral`, () => {
  it.concurrent.each([literal(`foo`), literal(6)])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });
});
