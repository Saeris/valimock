import type { StringContext } from "./types.js";

/**
 * Generators keyed by the format name recorded in `ctx.format` during
 * `collectConstraints`. Keyed by Valibot's action `type` so the format selector
 * and the generator look up the same string.
 *
 * Adding a new format means: (1) add a `setFormat(name)` entry to
 * actionHandlers, and (2) add a matching generator here.
 */
export const formatGenerators: Record<string, (ctx: StringContext) => string> = {
  base64: (ctx) => ctx.faker.string.hexadecimal({ prefix: ``, length: 64 }),
  bic: (ctx) => {
    // Faker's BIC can include "00" in positions 7-8 (the location code), which
    // Valibot's regex rejects via a negative lookahead. Reject and retry on
    // the rare occurrence; falls back to an A-Z synthesizer after a few tries
    // so we never recurse on a long unlucky streak.
    for (let i = 0; i < 8; i++) {
      const candidate = ctx.faker.finance.bic();
      if (!/^.{6}00/.test(candidate)) return candidate;
    }
    // Last-resort synthesis: 6 uppercase letters + 2 non-"00" alphanumerics + optional 3 alphanumerics.
    const bank = ctx.faker.string.alpha({ length: 6, casing: `upper` });
    const location = `A${ctx.faker.string.alphanumeric({ length: 1, casing: `upper` })}`;
    const branch = ctx.faker.string.alphanumeric({ length: 3, casing: `upper` });
    return `${bank}${location}${branch}`;
  },
  credit_card: (ctx) =>
    ctx.faker.finance.creditCardNumber({
      issuer: ctx.faker.helpers.arrayElement([`american_express`, `diners_club`, `jcb`, `mastercard`])
    }),
  cuid2: (ctx) => {
    // Valibot's CUID2 regex requires /^[a-z][\da-z]*$/u — lowercase letter, then any lowercase alphanumerics.
    // Real CUID2s are 24+ chars; we honor bounds.min if higher.
    const length = Math.max(24, ctx.bounds.min);
    return (
      ctx.faker.string.alpha({ length: 1, casing: `lower` }) +
      ctx.faker.string.alphanumeric({ length: length - 1, casing: `lower` })
    );
  },
  decimal: (ctx) => ctx.faker.number.float().toString(),
  digits: (ctx) =>
    ctx.faker.string.numeric({
      allowLeadingZeros: true,
      length: { min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) }
    }),
  email: (ctx) => ctx.faker.internet.email(),
  emoji: (ctx) => ctx.faker.internet.emoji(),
  hex_color: (ctx) => ctx.faker.color.rgb(),
  hexadecimal: (ctx) =>
    ctx.faker.string.hexadecimal({
      prefix: ``,
      length: { min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) }
    }),
  imei: (ctx) => ctx.faker.phone.imei(),
  ip: (ctx) => ctx.faker.internet.ip(),
  ipv4: (ctx) => ctx.faker.internet.ipv4(),
  ipv6: (ctx) => ctx.faker.internet.ipv6(),
  // Valibot's ISO regexes are strict; produce exactly what each one accepts.
  // iso_date         : YYYY-MM-DD
  // iso_date_time    : YYYY-MM-DDTHH:MM (no seconds, no ms, no zone)
  // iso_time         : HH:MM
  // iso_time_second  : HH:MM:SS
  // iso_timestamp    : YYYY-MM-DDTHH:MM:SS(.fff)?(Z|±HH:MM)
  // iso_week         : YYYY-Www
  iso_date: (ctx) => ctx.faker.date.recent().toISOString().slice(0, 10),
  iso_date_time: (ctx) => ctx.faker.date.recent().toISOString().slice(0, 16),
  iso_time: (ctx) => ctx.faker.date.recent().toISOString().slice(11, 16),
  iso_time_second: (ctx) => ctx.faker.date.recent().toISOString().slice(11, 19),
  iso_timestamp: (ctx) => ctx.faker.date.recent().toISOString(),
  iso_week: (ctx) => {
    const d = ctx.faker.date.recent();
    const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, `0`)}`;
  },
  mac: (ctx) => ctx.faker.internet.mac(),
  nanoid: (ctx) => ctx.faker.string.nanoid(),
  octal: (ctx) =>
    ctx.faker.string.octal({
      prefix: ``,
      length: { min: Math.max(1, ctx.bounds.min), max: Math.max(1, ctx.bounds.max) }
    }),
  ulid: (ctx) => ctx.faker.string.ulid(),
  url: (ctx) => ctx.faker.internet.url(),
  uuid: (ctx) => ctx.faker.string.uuid()
};
