import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import {
  base64,
  bic,
  creditCard,
  cuid2,
  decimal,
  digits,
  email,
  emoji,
  empty,
  endsWith,
  hexColor,
  hexadecimal,
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
  length,
  mac,
  mac48,
  mac64,
  maxLength,
  minLength,
  nanoid,
  nonEmpty,
  octal,
  parse,
  pipe,
  rfcEmail,
  slug,
  startsWith,
  string,
  type GenericSchema,
  ulid,
  url,
  uuid
} from "valibot";
import { Valimock } from "../Valimock.js";

type StringPipeItem = v.PipeItem<string, string, v.BaseIssue<unknown>>;

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Format actions sortable by their *realistic* faker output length range — not
 * the theoretical regex minima. e.g. Valibot's email regex permits `a@b.co`
 * (6 chars) but `faker.internet.email()` reliably produces 15+ chars. We
 * filter on what we can actually generate so the property holds in practice.
 */
const formats = {
  base64: { minLen: 64, maxLen: 64, build: () => base64() },
  bic: { minLen: 8, maxLen: 11, build: () => bic() },
  // Once separators are stripped, faker outputs 13-16 digits (Visa min, Mastercard/Discover max).
  credit_card: { minLen: 13, maxLen: 16, build: () => creditCard() },
  cuid2: { minLen: 24, maxLen: 256, build: () => cuid2() },
  decimal: { minLen: 3, maxLen: 32, build: () => decimal() },
  digits: { minLen: 1, maxLen: 64, build: () => digits() },
  email: { minLen: 15, maxLen: 64, build: () => email() },
  // faker.internet.emoji() always returns exactly one grapheme. Most modern
  // emojis are 2 UTF-16 code units (surrogate pair) — though Valibot's regex
  // also accepts 1-code-unit chars like `©`, faker doesn't reliably hit them.
  emoji: { minLen: 2, maxLen: 2, build: () => emoji() },
  hex_color: { minLen: 7, maxLen: 7, build: () => hexColor() },
  hexadecimal: { minLen: 1, maxLen: 64, build: () => hexadecimal() },
  // IMEI has exactly two valid lengths: 15 (digits-only) or 18 (dashed groups).
  // Lengths 16-17 are unsatisfiable. Use a generous max here; satisfiability filter handles it.
  imei: { minLen: 15, maxLen: 18, build: () => imei() },
  ip: { minLen: 7, maxLen: 39, build: () => ip() },
  ipv4: { minLen: 7, maxLen: 15, build: () => ipv4() },
  ipv6: { minLen: 15, maxLen: 39, build: () => ipv6() },
  iso_date: { minLen: 10, maxLen: 10, build: () => isoDate() },
  iso_date_time: { minLen: 16, maxLen: 16, build: () => isoDateTime() },
  iso_time: { minLen: 5, maxLen: 5, build: () => isoTime() },
  iso_time_second: { minLen: 8, maxLen: 8, build: () => isoTimeSecond() },
  iso_timestamp: { minLen: 24, maxLen: 24, build: () => isoTimestamp() },
  iso_week: { minLen: 8, maxLen: 8, build: () => isoWeek() },
  mac: { minLen: 17, maxLen: 17, build: () => mac() },
  mac48: { minLen: 17, maxLen: 17, build: () => mac48() },
  mac64: { minLen: 23, maxLen: 23, build: () => mac64() },
  nanoid: { minLen: 21, maxLen: 21, build: () => nanoid() },
  octal: { minLen: 1, maxLen: 64, build: () => octal() },
  rfc_email: { minLen: 15, maxLen: 64, build: () => rfcEmail() },
  slug: { minLen: 2, maxLen: 32, build: () => slug() },
  ulid: { minLen: 26, maxLen: 26, build: () => ulid() },
  url: { minLen: 15, maxLen: 64, build: () => url() },
  uuid: { minLen: 36, maxLen: 36, build: () => uuid() }
} as const;

type FormatKey = keyof typeof formats;
const formatKeys = Object.keys(formats) as FormatKey[];

/**
 * Arbitrary producing a string schema and a satisfiability hint.
 * Combines a (possibly absent) format with (possibly absent) length bounds,
 * filtering combinations that are inherently unsatisfiable so the round-trip
 * property holds unconditionally.
 */
const stringSchemaArb = fc
  .record({
    formatKey: fc.option(fc.constantFrom(...formatKeys), { nil: undefined }),
    bounds: fc.option(
      fc.oneof(
        fc.tuple(fc.nat({ max: 64 }), fc.constant(undefined)).map(([min]) => ({ kind: `min` as const, min })),
        fc
          .tuple(fc.constant(undefined), fc.integer({ min: 1, max: 64 }))
          .map(([, max]) => ({ kind: `max` as const, max })),
        fc
          .tuple(fc.nat({ max: 30 }), fc.integer({ min: 1, max: 60 }))
          .filter(([min, max]) => min <= max)
          .map(([min, max]) => ({ kind: `range` as const, min, max })),
        fc.nat({ max: 32 }).map((n) => ({ kind: `exact` as const, len: n })),
        fc.constant({ kind: `nonEmpty` as const }),
        fc.constant({ kind: `empty` as const })
      ),
      { nil: undefined }
    )
  })
  .filter(({ formatKey, bounds }) => {
    // Reject combinations no valid string can satisfy.
    if (formatKey === undefined || bounds === undefined) return true;
    const fmt = formats[formatKey];
    if (bounds.kind === `empty`) return false; // every format requires at least one char
    // IMEI uniquely has only two valid lengths (15 and 18); reject any exact
    // length in between.
    if (formatKey === `imei` && bounds.kind === `exact` && bounds.len !== 15 && bounds.len !== 18) return false;
    // BIC uniquely has only two valid lengths (8 BIC8 and 11 BIC11).
    if (formatKey === `bic` && bounds.kind === `exact` && bounds.len !== 8 && bounds.len !== 11) return false;
    if (bounds.kind === `exact`) return bounds.len >= fmt.minLen && bounds.len <= fmt.maxLen;
    if (bounds.kind === `range`) return bounds.min <= fmt.maxLen && bounds.max >= fmt.minLen;
    if (bounds.kind === `max`) return bounds.max >= fmt.minLen;
    if (bounds.kind === `min`) return bounds.min <= fmt.maxLen;
    return true;
  })
  .map(({ formatKey, bounds }) => {
    const items: StringPipeItem[] = [];
    if (formatKey) items.push(formats[formatKey].build() as StringPipeItem);
    if (bounds) {
      switch (bounds.kind) {
        case `min`:
          items.push(minLength(bounds.min));
          break;
        case `max`:
          items.push(maxLength(bounds.max));
          break;
        case `range`:
          items.push(minLength(bounds.min), maxLength(bounds.max));
          break;
        case `exact`:
          items.push(length(bounds.len));
          break;
        case `nonEmpty`:
          items.push(nonEmpty());
          break;
        case `empty`:
          items.push(empty());
          break;
      }
    }
    const schema: GenericSchema<string> =
      items.length === 0 ? string() : (pipe(string(), ...items) as GenericSchema<string>);
    return schema;
  });

describe(`mockString property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(stringSchemaArb, (schema) => {
        const value = mock(schema);
        // The property: whatever we generate must satisfy the schema we used
        // to generate it. parse() throws on mismatch — that's the failure mode.
        expect(parse(schema, value)).toBe(value);
      }),
      { numRuns: 200 }
    );
  });

  it(`startsWith / endsWith / includes constraints are honored`, () => {
    fc.assert(
      fc.property(
        fc.record({
          startsW: fc.option(fc.string({ minLength: 1, maxLength: 5 })),
          endsW: fc.option(fc.string({ minLength: 1, maxLength: 5 }))
        }),
        ({ startsW, endsW }) => {
          const items: StringPipeItem[] = [];
          if (startsW !== null) items.push(startsWith(startsW) as StringPipeItem);
          if (endsW !== null) items.push(endsWith(endsW) as StringPipeItem);
          if (items.length === 0) return;
          const schema = pipe(string(), ...items) as GenericSchema<string>;
          const value = mock(schema);
          expect(parse(schema, value)).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});
