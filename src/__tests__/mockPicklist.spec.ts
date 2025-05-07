import { describe, expect, it } from "vitest";
import { parse, picklist } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockPicklist`, () => {
  it.each([picklist([`foo`, `bar`, `baz`])])(
    `should generate valid mock data (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );
});
