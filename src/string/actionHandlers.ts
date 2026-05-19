import type * as v from "valibot";
import type { ActionHandler, StringContext } from "./types.js";

/**
 * Registry of action handlers keyed by Valibot action `type`.
 *
 * Adding support for a new Valibot string action means adding one entry here.
 * Handlers mutate the Context to record the constraint they encode. Format-
 * selecting actions (e.g. `email`) record themselves as `ctx.format` so the
 * `selectGenerator` phase can route generation through the right faker call.
 *
 * Actions not present in this registry are not silently skipped — the
 * `collectConstraints` phase appends a warning to `ctx.warnings`.
 */
export const actionHandlers: Record<string, ActionHandler> = {
  // ── Length / size constraints ─────────────────────────────────────────
  length: (ctx, action) => {
    const len = readNumberRequirement(action);
    if (len === undefined) return;
    ctx.bounds = { min: len, max: len };
  },
  min_length: (ctx, action) => {
    const min = readNumberRequirement(action);
    if (min === undefined) return;
    ctx.bounds = { min: Math.max(ctx.bounds.min, min), max: ctx.bounds.max };
    // If we already had an upper bound below the new minimum, raise it.
    if (ctx.bounds.max < ctx.bounds.min) ctx.bounds.max = ctx.bounds.min;
  },
  max_length: (ctx, action) => {
    const max = readNumberRequirement(action);
    if (max === undefined) return;
    ctx.bounds = { min: ctx.bounds.min, max: Math.min(ctx.bounds.max, max) };
    // If the new ceiling drops below the floor, lower the floor.
    if (ctx.bounds.min > ctx.bounds.max) ctx.bounds.min = ctx.bounds.max;
  },
  non_empty: (ctx) => {
    if (ctx.bounds.min < 1) ctx.bounds.min = 1;
  },
  empty: (ctx) => {
    ctx.forceEmpty = true;
  },

  // ── Pattern constraints ───────────────────────────────────────────────
  regex: (ctx, action) => {
    const req = (action as { requirement?: unknown }).requirement;
    if (req instanceof RegExp) ctx.regex = req;
  },
  includes: (ctx, action) => {
    const req = readStringRequirement(action);
    if (req !== undefined) ctx.includes = [...ctx.includes, req];
  },
  starts_with: (ctx, action) => {
    const req = readStringRequirement(action);
    if (req !== undefined) ctx.startsWith = req;
  },
  ends_with: (ctx, action) => {
    const req = readStringRequirement(action);
    if (req !== undefined) ctx.endsWith = req;
  },
  excludes: (ctx, action) => {
    const req = readStringRequirement(action);
    if (req !== undefined) ctx.excludes = [...ctx.excludes, req];
  },

  // ── Metadata ──────────────────────────────────────────────────────────
  examples: (ctx, action) => {
    const req = (action as { requirement?: unknown }).requirement;
    if (Array.isArray(req) && req.every((v): v is string => typeof v === `string`)) {
      ctx.examples = req;
    }
  },

  // ── Format selectors ──────────────────────────────────────────────────
  // These don't constrain length; they pick the named format used by
  // `selectGenerator` to find a matching faker call.
  base64: setFormat(`base64`),
  bic: setFormat(`bic`),
  credit_card: setFormat(`credit_card`),
  cuid2: setFormat(`cuid2`),
  decimal: setFormat(`decimal`),
  digits: setFormat(`digits`),
  email: setFormat(`email`),
  emoji: setFormat(`emoji`),
  hex_color: setFormat(`hex_color`),
  hexadecimal: setFormat(`hexadecimal`),
  imei: setFormat(`imei`),
  ip: setFormat(`ip`),
  ipv4: setFormat(`ipv4`),
  ipv6: setFormat(`ipv6`),
  iso_date: setFormat(`iso_date`),
  iso_date_time: setFormat(`iso_date_time`),
  iso_time: setFormat(`iso_time`),
  iso_time_second: setFormat(`iso_time_second`),
  iso_timestamp: setFormat(`iso_timestamp`),
  iso_week: setFormat(`iso_week`),
  mac: setFormat(`mac`),
  nanoid: setFormat(`nanoid`),
  octal: setFormat(`octal`),
  ulid: setFormat(`ulid`),
  url: setFormat(`url`),
  uuid: setFormat(`uuid`)
};

/** Returns the set of action types currently handled by the registry. */
export const knownActionTypes = new Set<string>(Object.keys(actionHandlers));

function setFormat(name: string): ActionHandler {
  return (ctx: StringContext): void => {
    ctx.format = name;
  };
}

function readNumberRequirement(action: v.GenericPipeItem): number | undefined {
  const req = (action as { requirement?: unknown }).requirement;
  return typeof req === `number` && Number.isFinite(req) ? req : undefined;
}

function readStringRequirement(action: v.GenericPipeItem): string | undefined {
  const req = (action as { requirement?: unknown }).requirement;
  return typeof req === `string` ? req : undefined;
}
