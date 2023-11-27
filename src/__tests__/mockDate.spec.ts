import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  date,
  dateAsync,
  minValue,
  maxValue
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockDate`, () => {
  const requirement = new Date(Date.now() + 3600000);

  it.each([
    date(),
    date([minValue(requirement)]),
    date([maxValue(requirement)])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    dateAsync(),
    dateAsync([minValue(requirement)]),
    dateAsync([maxValue(requirement)])
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
