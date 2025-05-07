import { describe, expect, it } from "vitest";
import { parse, literal } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockLiteral`, () => {
  it.each([literal(`foo`), literal(6)])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );
});
