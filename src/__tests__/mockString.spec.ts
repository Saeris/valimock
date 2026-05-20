import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockString`, () => {
  it.concurrent.each([
    v.string(),
    v.pipe(v.string(), v.base64()),
    v.pipe(v.string(), v.bic()),
    v.pipe(v.string(), v.creditCard()),
    v.pipe(v.string(), v.cuid2()),
    v.pipe(v.string(), v.decimal()),
    v.pipe(v.string(), v.email()),
    v.pipe(v.string(), v.emoji()),
    v.pipe(v.string(), v.empty()),
    v.pipe(v.string(), v.hexadecimal()),
    v.pipe(v.string(), v.hexColor()),
    v.pipe(v.string(), v.imei()),
    v.pipe(v.string(), v.ip()),
    v.pipe(v.string(), v.ipv4()),
    v.pipe(v.string(), v.ipv6()),
    v.pipe(v.string(), v.isoDate()),
    v.pipe(v.string(), v.isoDateTime()),
    v.pipe(v.string(), v.isoTime()),
    v.pipe(v.string(), v.isoTimeSecond()),
    v.pipe(v.string(), v.isoTimestamp()),
    v.pipe(v.string(), v.isoWeek()),
    v.pipe(v.string(), v.mac()),
    v.pipe(v.string(), v.octal()),
    v.pipe(v.string(), v.ulid()),
    v.pipe(v.string(), v.url()),
    v.pipe(v.string(), v.uuid()),
    v.pipe(v.string(), v.minLength(4)),
    v.pipe(v.string(), v.maxLength(16)),
    v.pipe(v.string(), v.length(4)),
    v.pipe(v.string(), v.minLength(4)),
    v.pipe(v.string(), v.maxLength(16)),
    v.pipe(v.string(), v.length(4))
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema); //?
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.object({
      email: v.pipe(v.string(), v.email()),
      uuid: v.pipe(v.string(), v.uuid()),
      uid: v.pipe(v.string(), v.uuid()),
      url: v.pipe(v.string(), v.url()),
      name: v.pipe(v.string(), v.nonEmpty()),
      date: v.pipe(v.string(), v.isoDate()),
      dateTime: v.pipe(v.string(), v.isoDateTime()),
      digits: v.pipe(v.string(), v.digits()),
      colorHex: v.pipe(v.string(), v.hexColor()),
      color: v.pipe(v.string(), v.hexColor()),
      backgroundColor: v.pipe(v.string(), v.hexColor()),
      textShadow: v.pipe(v.string(), v.hexColor()),
      textColor: v.pipe(v.string(), v.hexColor()),
      textDecorationColor: v.pipe(v.string(), v.hexColor()),
      borderColor: v.pipe(v.string(), v.hexColor()),
      borderTopColor: v.pipe(v.string(), v.hexColor()),
      borderRightColor: v.pipe(v.string(), v.hexColor()),
      borderBottomColor: v.pipe(v.string(), v.hexColor()),
      borderLeftColor: v.pipe(v.string(), v.hexColor()),
      borderBlockStartColor: v.pipe(v.string(), v.hexColor()),
      borderBlockEndColor: v.pipe(v.string(), v.hexColor()),
      borderInlineStartColor: v.pipe(v.string(), v.hexColor()),
      borderInlineEndColor: v.pipe(v.string(), v.hexColor()),
      columnRuleColor: v.pipe(v.string(), v.hexColor()),
      outlineColor: v.pipe(v.string(), v.hexColor()),
      phoneNumber: v.pipe(v.string(), v.nonEmpty()),
      username: v.pipe(v.string(), v.nonEmpty()),
      displayName: v.pipe(v.string(), v.nonEmpty()),
      discriminator: v.pipe(v.string(), v.digits(), v.length(4)),
      firstName: v.pipe(v.string(), v.nonEmpty()),
      middleName: v.pipe(v.string(), v.nonEmpty()),
      lastName: v.pipe(v.string(), v.nonEmpty()),
      fullName: v.pipe(v.string(), v.nonEmpty()),
      gender: v.pipe(v.string(), v.nonEmpty()),
      sex: v.pipe(v.string(), v.nonEmpty()),
      zodiacSign: v.pipe(v.string(), v.nonEmpty()),
      isbn: v.pipe(v.string(), v.nonEmpty()),
      iban: v.pipe(v.string(), v.nonEmpty()),
      vin: v.pipe(v.string(), v.nonEmpty()),
      vrm: v.pipe(v.string(), v.nonEmpty())
    })
  ])(`should generate valid mock data based on object keys (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema); // ?
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.pipeAsync(v.string(), v.minLength(4)),
    v.pipeAsync(v.string(), v.maxLength(16)),
    v.pipeAsync(v.string(), v.length(4)),
    v.pipeAsync(v.string(), v.minLength(4)),
    v.pipeAsync(v.string(), v.maxLength(16)),
    v.pipeAsync(v.string(), v.length(4))
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
