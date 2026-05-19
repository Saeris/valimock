import type * as v from "valibot";
import type { NumberActionHandler, NumberContext } from "./types.js";

/**
 * Registry of action handlers keyed by Valibot's action `type`. Adding support
 * for a new number action is one entry here.
 *
 * Two action shapes are handled:
 *   - actions with a `requirement` value (min_value, max_value, multiple_of, ...)
 *     read `action.requirement` directly
 *   - flag actions (`integer`, `safe_integer`, `finite`) carry a function
 *     requirement; their presence alone signals the constraint is active
 */
export const numberActionHandlers: Record<string, NumberActionHandler> = {
  value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) ctx.exactValue = req;
  },
  values: (ctx, action) => {
    const req = (action as { requirement?: unknown }).requirement;
    if (Array.isArray(req)) {
      const allowed = req.filter((v): v is number => typeof v === `number`);
      if (allowed.length > 0) ctx.allowedValues = allowed;
    }
  },
  not_value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) ctx.forbidden.add(req);
  },
  not_values: (ctx, action) => {
    const req = (action as { requirement?: unknown }).requirement;
    if (Array.isArray(req)) {
      for (const v of req) if (typeof v === `number`) ctx.forbidden.add(v);
    }
  },
  min_value: (ctx, action) => {
    const req = readNumber(action);
    if (req === undefined) return;
    ctx.min = ctx.minSet ? Math.max(ctx.min, req) : req;
    ctx.minSet = true;
  },
  max_value: (ctx, action) => {
    const req = readNumber(action);
    if (req === undefined) return;
    ctx.max = ctx.maxSet ? Math.min(ctx.max, req) : req;
    ctx.maxSet = true;
  },
  gt_value: (ctx, action) => {
    const req = readNumber(action);
    if (req === undefined) return;
    // Strict lower bound. Re-resolved against the integer flag after collection.
    const next = req + Number.EPSILON;
    ctx.min = ctx.minSet ? Math.max(ctx.min, next) : next;
    ctx.minSet = true;
  },
  lt_value: (ctx, action) => {
    const req = readNumber(action);
    if (req === undefined) return;
    const next = req - Number.EPSILON;
    ctx.max = ctx.maxSet ? Math.min(ctx.max, next) : next;
    ctx.maxSet = true;
  },
  multiple_of: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined && req > 0) ctx.multipleOf = req;
  },
  integer: (ctx) => {
    ctx.isInteger = true;
  },
  safe_integer: (ctx) => {
    ctx.isInteger = true;
  },
  finite: (ctx) => {
    ctx.isFinite = true;
  }
};

export const knownNumberActionTypes = new Set<string>(Object.keys(numberActionHandlers));

function readNumber(action: v.GenericPipeItem): number | undefined {
  const req = (action as { requirement?: unknown }).requirement;
  return typeof req === `number` && Number.isFinite(req) ? req : undefined;
}

/**
 * After collection, reconcile bounds:
 *   1. If only `min` was set above the default ceiling (5), widen `max` to
 *      `max(min + 1, default)` so the range is non-empty.
 *   2. If only `max` was set below the default floor (0), lower `min` similarly.
 *   3. Snap to integer grid when the integer flag is set.
 */
export const resolveBounds = (ctx: NumberContext): void => {
  if (ctx.minSet && !ctx.maxSet && ctx.min >= ctx.max) {
    ctx.max = ctx.min + (ctx.isInteger ? 1 : 1);
  }
  if (ctx.maxSet && !ctx.minSet && ctx.max <= ctx.min) {
    ctx.min = ctx.max - (ctx.isInteger ? 1 : 1);
  }
  if (ctx.isInteger) {
    ctx.min = Math.ceil(ctx.min);
    ctx.max = Math.floor(ctx.max);
  }
};
