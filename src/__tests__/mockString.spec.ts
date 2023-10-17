import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  string,
  stringAsync,
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
    stringAsync(),
    string([cuid2()]),
    string([email()]),
    string([emoji()]),
    string([imei()]),
    string([ip()]),
    string([ipv4()]),
    string([ipv6()]),
    string([isoDate()]),
    string([isoDateTime()]),
    string([isoTime()]),
    string([isoTimeSecond()]),
    string([isoTimestamp()]),
    string([isoWeek()]),
    string([ulid()]),
    string([url()]),
    string([uuid()]),
    string([minLength(4)]),
    string([maxLength(16)]),
    string([length(4)]),
    stringAsync([minLength(4)]),
    stringAsync([maxLength(16)]),
    stringAsync([length(4)]),
    string([minLength(4)]),
    string([maxLength(16)]),
    string([length(4)]),
    stringAsync([minLength(4)]),
    stringAsync([maxLength(16)]),
    stringAsync([length(4)])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
