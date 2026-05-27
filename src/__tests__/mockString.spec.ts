import * as fc from "fast-check";
import { describe, expect, it, vi } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";
import { captureWarnings } from "./helpers/captureWarnings.js";

type StringPipeItem = v.PipeItem<string, string, v.BaseIssue<unknown>>;

const mock = new Valimock({ onWarn: () => {} }).mock;
const mockSchema = new Valimock().mock;

/**
 * Format actions sortable by their *realistic* faker output length range — not
 * the theoretical regex minima. e.g. Valibot's email regex permits `a@b.co`
 * (6 chars) but `faker.internet.email()` reliably produces 15+ chars. We
 * filter on what we can actually generate so the property holds in practice.
 */
const formats = {
  base64: { minLen: 64, maxLen: 64, build: () => v.base64() },
  bic: { minLen: 8, maxLen: 11, build: () => v.bic() },
  // Once separators are stripped, faker outputs 13-16 digits (Visa min, Mastercard/Discover max).
  credit_card: { minLen: 13, maxLen: 16, build: () => v.creditCard() },
  cuid2: { minLen: 24, maxLen: 256, build: () => v.cuid2() },
  decimal: { minLen: 3, maxLen: 32, build: () => v.decimal() },
  digits: { minLen: 1, maxLen: 64, build: () => v.digits() },
  email: { minLen: 15, maxLen: 64, build: () => v.email() },
  // faker.internet.emoji() always returns exactly one grapheme. Most modern
  // emojis are 2 UTF-16 code units (surrogate pair) — though Valibot's regex
  // also accepts 1-code-unit chars like `©`, faker doesn't reliably hit them.
  emoji: { minLen: 2, maxLen: 2, build: () => v.emoji() },
  hex_color: { minLen: 7, maxLen: 7, build: () => v.hexColor() },
  hexadecimal: { minLen: 1, maxLen: 64, build: () => v.hexadecimal() },
  // IMEI has exactly two valid lengths: 15 (digits-only) or 18 (dashed groups).
  // Lengths 16-17 are unsatisfiable. Use a generous max here; satisfiability filter handles it.
  imei: { minLen: 15, maxLen: 18, build: () => v.imei() },
  ip: { minLen: 7, maxLen: 39, build: () => v.ip() },
  ipv4: { minLen: 7, maxLen: 15, build: () => v.ipv4() },
  ipv6: { minLen: 15, maxLen: 39, build: () => v.ipv6() },
  iso_date: { minLen: 10, maxLen: 10, build: () => v.isoDate() },
  iso_date_time: { minLen: 16, maxLen: 16, build: () => v.isoDateTime() },
  iso_time: { minLen: 5, maxLen: 5, build: () => v.isoTime() },
  iso_time_second: { minLen: 8, maxLen: 8, build: () => v.isoTimeSecond() },
  iso_timestamp: { minLen: 24, maxLen: 24, build: () => v.isoTimestamp() },
  iso_week: { minLen: 8, maxLen: 8, build: () => v.isoWeek() },
  mac: { minLen: 17, maxLen: 17, build: () => v.mac() },
  mac48: { minLen: 17, maxLen: 17, build: () => v.mac48() },
  mac64: { minLen: 23, maxLen: 23, build: () => v.mac64() },
  nanoid: { minLen: 21, maxLen: 21, build: () => v.nanoid() },
  octal: { minLen: 1, maxLen: 64, build: () => v.octal() },
  rfc_email: { minLen: 15, maxLen: 64, build: () => v.rfcEmail() },
  slug: { minLen: 2, maxLen: 32, build: () => v.slug() },
  ulid: { minLen: 26, maxLen: 26, build: () => v.ulid() },
  url: { minLen: 15, maxLen: 64, build: () => v.url() },
  uuid: { minLen: 36, maxLen: 36, build: () => v.uuid() }
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
    if (formatKey === undefined || bounds === undefined) return true;
    const fmt = formats[formatKey];
    if (bounds.kind === `empty`) return false;
    if (formatKey === `imei` && bounds.kind === `exact` && bounds.len !== 15 && bounds.len !== 18) return false;
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
          items.push(v.minLength(bounds.min));
          break;
        case `max`:
          items.push(v.maxLength(bounds.max));
          break;
        case `range`:
          items.push(v.minLength(bounds.min), v.maxLength(bounds.max));
          break;
        case `exact`:
          items.push(v.length(bounds.len));
          break;
        case `nonEmpty`:
          items.push(v.nonEmpty());
          break;
        case `empty`:
          items.push(v.empty());
          break;
      }
    }
    const schema: v.GenericSchema<string> =
      items.length === 0 ? v.string() : (v.pipe(v.string(), ...items) as v.GenericSchema<string>);
    return schema;
  });

describe(`mockString`, () => {
  describe(`hand-written cases`, () => {
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
      const result = mockSchema(schema);
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
      const result = mockSchema(schema);
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

  describe(`property-based`, () => {
    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(stringSchemaArb, (schema) => {
          const value = mock(schema);
          expect(v.parse(schema, value)).toBe(value);
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
            if (startsW !== null) items.push(v.startsWith(startsW) as StringPipeItem);
            if (endsW !== null) items.push(v.endsWith(endsW) as StringPipeItem);
            if (items.length === 0) return;
            const schema = v.pipe(v.string(), ...items) as v.GenericSchema<string>;
            const value = mock(schema);
            expect(v.parse(schema, value)).toBe(value);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe(`edge cases — substring constraints`, () => {
    it(`startsWith only: result starts with the required prefix`, () => {
      const schema = v.pipe(v.string(), v.startsWith(`pfx-`));
      for (let i = 0; i < 20; i++) {
        const result = mock(schema);
        expect(result).toMatch(/^pfx-/);
        expect(v.parse(schema, result)).toBe(result);
      }
    });

    it(`endsWith only: result ends with the required suffix`, () => {
      const schema = v.pipe(v.string(), v.endsWith(`.suffix`));
      for (let i = 0; i < 20; i++) {
        const result = mock(schema);
        expect(result.endsWith(`.suffix`)).toBe(true);
        expect(v.parse(schema, result)).toBe(result);
      }
    });

    it(`startsWith + endsWith + maxLength: enforce truncates while preserving tail`, () => {
      const schema = v.pipe(v.string(), v.startsWith(`a`), v.endsWith(`z`), v.maxLength(20));
      for (let i = 0; i < 20; i++) {
        const result = mock(schema);
        expect(result.startsWith(`a`)).toBe(true);
        expect(result.endsWith(`z`)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(20);
        expect(v.parse(schema, result)).toBe(result);
      }
    });

    it(`includes: result contains each required substring`, () => {
      const schema = v.pipe(v.string(), v.includes(`foo`), v.includes(`bar`));
      for (let i = 0; i < 20; i++) {
        const result = mock(schema);
        expect(result).toContain(`foo`);
        expect(result).toContain(`bar`);
        expect(v.parse(schema, result)).toBe(result);
      }
    });

    it(`excludes: result does not contain forbidden substrings (retry until satisfied)`, () => {
      const schema = v.pipe(v.string(), v.excludes(`zzzzzz`)) as v.GenericSchema<string>;
      for (let i = 0; i < 20; i++) {
        const result = mock(schema);
        expect(result).not.toContain(`zzzzzz`);
        expect(v.parse(schema, result)).toBe(result);
      }
    });
  });

  describe(`edge cases — value constraints`, () => {
    it(`value: returns the exact pinned value`, () => {
      const schema = v.pipe(v.string(), v.value(`pinned`));
      for (let i = 0; i < 5; i++) {
        expect(mock(schema)).toBe(`pinned`);
      }
    });

    it(`values: returns one of the allow-list entries`, () => {
      const schema = v.pipe(v.string(), v.values([`one`, `two`, `three`]));
      const seen = new Set<string>();
      for (let i = 0; i < 50; i++) {
        seen.add(mock(schema));
      }
      for (const val of seen) {
        expect([`one`, `two`, `three`]).toContain(val);
      }
    });

    it(`values + not_values: produces an allow-list entry not in the forbidden set`, () => {
      const schema = v.pipe(v.string(), v.values([`good`, `bad`, `ugly`]), v.notValues([`bad`]));
      for (let i = 0; i < 30; i++) {
        const result = mock(schema);
        expect([`good`, `ugly`]).toContain(result);
        expect(result).not.toBe(`bad`);
      }
    });

    it(`not_value: never returns the forbidden string`, () => {
      const schema = v.pipe(v.string(), v.notValue(`forbidden-exact-value-aaa`));
      for (let i = 0; i < 30; i++) {
        const result = mock(schema);
        expect(result).not.toBe(`forbidden-exact-value-aaa`);
      }
    });
  });

  describe(`edge cases — length constraints`, () => {
    it(`not_length: result length avoids the forbidden value`, () => {
      const schema = v.pipe(v.string(), v.minLength(4), v.maxLength(8), v.notLength(5), v.notLength(6), v.notLength(7));
      for (let i = 0; i < 30; i++) {
        const result = mock(schema);
        expect([4, 8]).toContain(result.length);
        expect(v.parse(schema, result)).toBe(result);
      }
    });
  });

  describe(`edge cases — stringMap override`, () => {
    it(`stringMap entry is invoked when keyName matches`, () => {
      const customMock = vi.fn(() => `CUSTOM-VALUE`);
      const mockWithMap = new Valimock({
        onWarn: () => {},
        stringMap: { customField: customMock }
      }).mock;

      const objSchema = v.object({ customField: v.string() });
      const result = mockWithMap(objSchema as never) as { customField: string };
      expect(result.customField).toBe(`CUSTOM-VALUE`);
      expect(customMock).toHaveBeenCalled();
    });

    it(`stringMap overrides format generators by key name`, () => {
      const schema = v.object({ email: v.pipe(v.string(), v.email()) });
      const mockWithMap = new Valimock({
        onWarn: () => {},
        stringMap: { email: () => `override@example.com` }
      }).mock;
      const result = mockWithMap(schema as never) as { email: string };
      expect(result.email).toBe(`override@example.com`);
    });
  });

  describe(`edge cases — diagnostics`, () => {
    it(`onWarn fires when retry budget is exhausted on impossible constraints`, () => {
      const { mock, warnings } = captureWarnings();
      // Inherently unsatisfiable: length(3) + email() (no valid email fits in 3 chars).
      const schema = v.pipe(v.string(), v.email(), v.length(3));
      mock(schema);
      expect(warnings.some((w) => w.includes(`Could not satisfy`))).toBe(true);
    });
  });
});
