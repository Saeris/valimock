import type { StringContext } from "./types.js";

/** Per-generator retry budget when faker output needs to be filtered or length-bound. */
const FORMAT_RETRY_BUDGET = 8;

/**
 * Call `produce` repeatedly until `predicate(value)` is true or the budget is
 * exhausted. Returns the last produced value either way — callers either get a
 * satisfying candidate or fall through to the orchestrator's retry loop /
 * unsatisfiable-warning path.
 */
const retryUntil = (produce: () => string, predicate: (value: string) => boolean): string => {
  let value = produce();
  for (let i = 0; i < FORMAT_RETRY_BUDGET; i++) {
    if (predicate(value)) return value;
    value = produce();
  }
  return value;
};

/** True iff `value.length` falls inside `ctx.bounds`. */
const withinBounds = (value: string, ctx: StringContext): boolean =>
  value.length >= ctx.bounds.min && value.length <= ctx.bounds.max;

/**
 * Synthesize a valid IPv4 sized to fit `ctx.bounds`. Each octet can be 1-3
 * chars (`0`-`255`), so total length is 7 ("1.1.1.1") to 15 ("255.255.255.255").
 * Pick a target length and divide it across the four octets.
 */
const synthesizeIpv4 = (ctx: StringContext): string => {
  const target = Math.max(7, Math.min(15, ctx.bounds.min === ctx.bounds.max ? ctx.bounds.max : ctx.bounds.max));
  // Distribute `target - 3` digits across 4 octets (3 dots).
  const digitsTotal = target - 3;
  const baseDigits = Math.floor(digitsTotal / 4);
  const extras = digitsTotal % 4;
  const octets: string[] = [];
  for (let i = 0; i < 4; i++) {
    const w = baseDigits + (i < extras ? 1 : 0);
    octets.push(octetForWidth(w, ctx));
  }
  return octets.join(`.`);
};

/** Produce an IPv4 octet of exactly `width` characters (1-3). */
const octetForWidth = (width: number, ctx: StringContext): string => {
  if (width <= 1) return String(ctx.faker.number.int({ min: 0, max: 9 }));
  if (width === 2) return String(ctx.faker.number.int({ min: 10, max: 99 }));
  return String(ctx.faker.number.int({ min: 100, max: 255 }));
};

/**
 * Synthesize a valid IPv6 sized to fit `ctx.bounds`. Eight groups separated
 * by 7 colons, each group 1-4 hex digits. Min length 15 (`1:1:1:1:1:1:1:1`),
 * max 39 (`ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff`).
 */
const synthesizeIpv6 = (ctx: StringContext): string => {
  const target = Math.max(15, Math.min(39, ctx.bounds.min === ctx.bounds.max ? ctx.bounds.max : ctx.bounds.max));
  // Distribute `target - 7` hex chars across 8 groups (7 colons).
  const hexTotal = target - 7;
  const base = Math.floor(hexTotal / 8);
  const extras = hexTotal % 8;
  const groups: string[] = [];
  for (let i = 0; i < 8; i++) {
    const w = Math.max(1, Math.min(4, base + (i < extras ? 1 : 0)));
    groups.push(ctx.faker.string.hexadecimal({ prefix: ``, length: w, casing: `lower` }));
  }
  return groups.join(`:`);
};

/**
 * Generators keyed by the format name recorded in `ctx.format` during
 * `collectConstraints`. Each generator receives the full `ctx` and should:
 *   1. Produce a value that matches Valibot's regex for that format
 *   2. Honor `ctx.bounds` when the format permits variable length, retrying
 *      faker calls or synthesizing a fitting value
 *   3. If bounds cannot be satisfied (e.g. `uuid` with `length(10)`), return
 *      the format-valid value anyway — the orchestrator's `satisfies()` check
 *      will reject it and emit an "unsatisfiable" warning rather than us
 *      emitting an invalid-format value.
 *
 * Adding a new format means: (1) add a `setFormat(name)` entry to
 * actionHandlers, and (2) add a matching generator here.
 */
export const formatGenerators: Record<string, (ctx: StringContext) => string> = {
  base64: (ctx) => ctx.faker.string.hexadecimal({ prefix: ``, length: 64 }),

  bic: (ctx) => {
    // Faker's BIC can include "00" at positions 7-8 (location code), which
    // Valibot's regex rejects via a negative lookahead. Retry around it, then
    // fall back to synthesis after the budget.
    const candidate = retryUntil(
      () => ctx.faker.finance.bic(),
      (v) => !/^.{6}00/.test(v) && withinBounds(v, ctx)
    );
    if (!/^.{6}00/.test(candidate) && withinBounds(candidate, ctx)) return candidate;
    // Synthesized fallback: 6 uppercase letters + 2 non-"00" alphanumerics + optional 3 alphanumerics.
    const len = Math.min(11, Math.max(8, ctx.bounds.min, Math.min(11, ctx.bounds.max)));
    const bank = ctx.faker.string.alpha({ length: 6, casing: `upper` });
    const location = `A${ctx.faker.string.alphanumeric({ length: 1, casing: `upper` })}`;
    return len <= 8
      ? `${bank}${location}`
      : `${bank}${location}${ctx.faker.string.alphanumeric({ length: 3, casing: `upper` })}`;
  },

  credit_card: (ctx) =>
    retryUntil(
      () =>
        ctx.faker.finance.creditCardNumber({
          issuer: ctx.faker.helpers.arrayElement([`american_express`, `diners_club`, `jcb`, `mastercard`])
        }),
      (v) => withinBounds(v, ctx)
    ),

  cuid2: (ctx) => {
    // Valibot's CUID2 regex requires /^[a-z][\da-z]*$/u — lowercase letter, then any lowercase alphanumerics.
    // Real CUID2s are 24+ chars; honor bounds.min, bounded above by bounds.max.
    const length = Math.max(24, ctx.bounds.min);
    if (length > ctx.bounds.max) {
      // Unsatisfiable: minimum CUID2 length exceeds bounds.max. Return a 24-char
      // value anyway and let the orchestrator's satisfies()/warning path handle it.
      return (
        ctx.faker.string.alpha({ length: 1, casing: `lower` }) +
        ctx.faker.string.alphanumeric({ length: 23, casing: `lower` })
      );
    }
    return (
      ctx.faker.string.alpha({ length: 1, casing: `lower` }) +
      ctx.faker.string.alphanumeric({ length: length - 1, casing: `lower` })
    );
  },

  decimal: (ctx) => {
    // Valibot's decimal regex: /^[+-]?(?:\d*\.)?\d+$/ — any digit string is valid.
    // faker.number.float() typically produces 3-8 char values like "0.5" or "42.71",
    // so we retry first and fall back to direct digit synthesis when bounds are
    // outside that range.
    if (ctx.bounds.max >= 3 && ctx.bounds.min <= 8) {
      const candidate = retryUntil(
        () => ctx.faker.number.float().toString(),
        (v) => withinBounds(v, ctx)
      );
      if (withinBounds(candidate, ctx)) return candidate;
    }
    // Synthesize: a pure digit string of length within bounds. Pick min when
    // the band is narrow, else a random length within the band.
    const len =
      ctx.bounds.min === ctx.bounds.max
        ? ctx.bounds.min
        : ctx.faker.number.int({ min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) });
    return ctx.faker.string.numeric({ length: Math.max(1, len), allowLeadingZeros: false });
  },

  digits: (ctx) =>
    ctx.faker.string.numeric({
      allowLeadingZeros: true,
      length: { min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) }
    }),

  email: (ctx) => {
    // faker.internet.email() typically produces 15-50 char emails. If bounds.max
    // is tight, retry with a budget then fall back to synthesizing a minimal
    // valid email of the requested length.
    const candidate = retryUntil(
      () => ctx.faker.internet.email(),
      (v) => withinBounds(v, ctx)
    );
    if (withinBounds(candidate, ctx)) return candidate;
    // Synthesize: `<local>@<domain>.<tld>`. Minimum valid form `a@b.co` = 6 chars.
    const target = Math.max(6, Math.min(64, ctx.bounds.max));
    const tld = `co`;
    const fixed = `@x.${tld}`; // 6 chars including the @
    const localLen = Math.max(1, target - fixed.length);
    return `${ctx.faker.string.alpha({ length: localLen, casing: `lower` })}${fixed}`;
  },

  emoji: (ctx) => ctx.faker.internet.emoji(),

  hex_color: (ctx) => ctx.faker.color.rgb(),

  hexadecimal: (ctx) =>
    ctx.faker.string.hexadecimal({
      prefix: ``,
      length: { min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) }
    }),

  imei: (ctx) => {
    // Valibot accepts both `\d{15}` and `\d{2}-\d{6}-\d{6}-\d` (15 vs 18 chars).
    // Faker's `phone.imei()` returns the dashed form. Pick the form that fits
    // the bounds; Luhn checksum is preserved when we strip dashes.
    const dashed = ctx.faker.phone.imei();
    const undashed = dashed.replace(/-/g, ``);
    if (withinBounds(dashed, ctx)) return dashed;
    if (withinBounds(undashed, ctx)) return undashed;
    return dashed;
  },

  ip: (ctx) => {
    const candidate = retryUntil(
      () => ctx.faker.internet.ip(),
      (v) => withinBounds(v, ctx)
    );
    if (withinBounds(candidate, ctx)) return candidate;
    // Choose family by target length: 7-15 → IPv4, 16+ → IPv6.
    return ctx.bounds.max <= 15 ? synthesizeIpv4(ctx) : synthesizeIpv6(ctx);
  },

  ipv4: (ctx) => {
    const candidate = retryUntil(
      () => ctx.faker.internet.ipv4(),
      (v) => withinBounds(v, ctx)
    );
    if (withinBounds(candidate, ctx)) return candidate;
    return synthesizeIpv4(ctx);
  },

  ipv6: (ctx) => {
    const candidate = retryUntil(
      () => ctx.faker.internet.ipv6(),
      (v) => withinBounds(v, ctx)
    );
    if (withinBounds(candidate, ctx)) return candidate;
    return synthesizeIpv6(ctx);
  },

  // Domain (Valibot v1.3): 1-253 chars, dot-separated labels, TLD 2-63 letters.
  domain: (ctx) => {
    const candidate = retryUntil(
      () => ctx.faker.internet.domainName(),
      (v) => withinBounds(v, ctx)
    );
    if (withinBounds(candidate, ctx)) return candidate;
    // Synthesize: `<label>.co` minimum 4 chars (`a.co`).
    const target = Math.max(4, Math.min(64, ctx.bounds.max));
    const labelLen = Math.max(1, target - 3);
    return `${ctx.faker.string.alpha({ length: labelLen, casing: `lower` })}.co`;
  },

  // ISBN (Valibot v1.2): ISBN-10 or ISBN-13 with checksum, optional hyphens.
  // Faker.commerce.isbn() reliably produces valid ISBNs.
  isbn: (ctx) => ctx.faker.commerce.isbn(),

  // ISRC (Valibot v1.3): International Standard Recording Code.
  // /^(?:[A-Z]{2}[A-Z\d]{3}\d{7}|[A-Z]{2}-[A-Z\d]{3}-\d{2}-\d{5})$/
  // Two forms: 12 chars (compact) or 15 chars (dashed). Synthesize directly.
  isrc: (ctx) => {
    const country = ctx.faker.string.alpha({ length: 2, casing: `upper` });
    const registrant = ctx.faker.string.alphanumeric({ length: 3, casing: `upper` });
    const compact = `${country}${registrant}${ctx.faker.string.numeric({ length: 7 })}`;
    if (withinBounds(compact, ctx)) return compact;
    const dashed = `${country}-${registrant}-${ctx.faker.string.numeric({ length: 2 })}-${ctx.faker.string.numeric({ length: 5 })}`;
    return withinBounds(dashed, ctx) ? dashed : compact;
  },

  // JWS Compact (Valibot v1.3): three base64url-ish segments separated by dots.
  // /^segment\.segment?\.segment?$/ where segments are 2-3 chars or 4n+(0..3) of `[\w-]`.
  jws_compact: (ctx) => {
    const segment = (): string => ctx.faker.string.alphanumeric({ length: 8 });
    const candidate = `${segment()}.${segment()}.${segment()}`;
    if (withinBounds(candidate, ctx)) return candidate;
    // Minimal valid form: 2 chars per segment + 2 dots = 8 chars.
    return `aa.bb.cc`;
  },

  // Valibot's ISO regexes are strict; produce exactly what each one accepts.
  // These are all fixed-length so bounds either match or generation is unsatisfiable.
  // iso_date              : YYYY-MM-DD                       (10)
  // iso_date_time         : YYYY-MM-DDTHH:MM                 (16)
  // iso_date_time_second  : YYYY-MM-DDTHH:MM:SS              (19)   v1.4
  // iso_time              : HH:MM                            (5)
  // iso_time_second       : HH:MM:SS                         (8)
  // iso_timestamp         : YYYY-MM-DDTHH:MM:SS(.fff)?(Z|±HH:MM)  (24 typical)
  // iso_week              : YYYY-Www                         (8)
  iso_date: (ctx) => ctx.faker.date.recent().toISOString().slice(0, 10),
  iso_date_time: (ctx) => ctx.faker.date.recent().toISOString().slice(0, 16),
  iso_date_time_second: (ctx) => ctx.faker.date.recent().toISOString().slice(0, 19),
  iso_time: (ctx) => ctx.faker.date.recent().toISOString().slice(11, 16),
  iso_time_second: (ctx) => ctx.faker.date.recent().toISOString().slice(11, 19),
  iso_timestamp: (ctx) => ctx.faker.date.recent().toISOString(),
  iso_week: (ctx) => {
    const d = ctx.faker.date.recent();
    const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, `0`)}`;
  },

  mac: (ctx) => ctx.faker.internet.mac(),

  nanoid: (ctx) => ctx.faker.string.nanoid({ min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) }),

  octal: (ctx) =>
    ctx.faker.string.octal({
      prefix: ``,
      length: { min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) }
    }),

  ulid: (ctx) => ctx.faker.string.ulid(),

  url: (ctx) => {
    // faker.internet.url() typically produces 15-50 char URLs. Retry to fit
    // bounds; if no faker output works, synthesize a short valid URL.
    const candidate = retryUntil(
      () => ctx.faker.internet.url(),
      (v) => withinBounds(v, ctx)
    );
    if (withinBounds(candidate, ctx)) return candidate;
    // Synthesize: `http://<host>/<path>` where minimum valid is `http://a.bc` = 11 chars.
    const target = Math.max(11, Math.min(128, ctx.bounds.max));
    const prefix = `http://a.bc`;
    if (target <= prefix.length) return prefix;
    const padding = ctx.faker.string.alpha({ length: target - prefix.length - 1, casing: `lower` });
    return `${prefix}/${padding}`;
  },

  uuid: (ctx) => ctx.faker.string.uuid()
};
