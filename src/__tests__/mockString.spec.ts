import { describe, expect, it } from "vitest";
import {
  pipe,
  pipeAsync,
  parse,
  parseAsync,
  string,
  maxLength,
  minLength,
  length,
  cuid2,
  email,
  emoji,
  imei,
  ip,
  ipv4,
  ipv6,
  isoDate,
  isoDateTime,
  isoTime,
  isoTimeSecond,
  isoTimestamp,
  isoWeek,
  ulid,
  url,
  uuid
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockString`, () => {
  it.each([
    string(),
    pipe(string(), cuid2()),
    pipe(string(), email()),
    pipe(string(), emoji()),
    pipe(string(), imei()),
    pipe(string(), ip()),
    pipe(string(), ipv4()),
    pipe(string(), ipv6()),
    pipe(string(), isoDate()),
    pipe(string(), isoDateTime()),
    pipe(string(), isoTime()),
    pipe(string(), isoTimeSecond()),
    pipe(string(), isoTimestamp()),
    pipe(string(), isoWeek()),
    pipe(string(), ulid()),
    pipe(string(), url()),
    pipe(string(), uuid()),
    pipe(string(), minLength(4)),
    pipe(string(), maxLength(16)),
    pipe(string(), length(4)),
    pipe(string(), minLength(4)),
    pipe(string(), maxLength(16)),
    pipe(string(), length(4))
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    pipeAsync(string(), minLength(4)),
    pipeAsync(string(), maxLength(16)),
    pipeAsync(string(), length(4)),
    pipeAsync(string(), minLength(4)),
    pipeAsync(string(), maxLength(16)),
    pipeAsync(string(), length(4))
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
