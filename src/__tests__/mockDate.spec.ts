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
    dateAsync(),
    date([minValue(requirement)]),
    date([maxValue(requirement)]),
    dateAsync([minValue(requirement)]),
    dateAsync([maxValue(requirement)])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
