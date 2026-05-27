import { tightenMax, tightenMin, reconcileBounds } from "../../utils/bounds.js";
import { readArray, readNumber } from "../../utils/readRequirement.js";
import type { NumberActionHandler, NumberContext } from "./types.js";

/**
 * Registry of action handlers keyed by Valibot's action `type`. Adding support
 * for a new number action is one entry here. Two action shapes:
 *   - actions with a numeric requirement (min_value, max_value, multiple_of, ...)
 *   - flag actions (integer, safe_integer, finite) — presence signals the constraint
 */
export const numberActionHandlers: Record<string, NumberActionHandler> = {
  value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) ctx.exactValue = req;
  },
  values: (ctx, action) => {
    const allowed = readArray(action, (x): x is number => typeof x === `number`);
    if (allowed) ctx.allowedValues = allowed;
  },
  not_value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) ctx.forbidden.add(req);
  },
  not_values: (ctx, action) => {
    const allowed = readArray(action, (x): x is number => typeof x === `number`);
    if (allowed) for (const v of allowed) ctx.forbidden.add(v);
  },
  min_value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) tightenMin(ctx.bounds, req);
  },
  max_value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) tightenMax(ctx.bounds, req);
  },
  gt_value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) tightenMin(ctx.bounds, req + Number.EPSILON);
  },
  lt_value: (ctx, action) => {
    const req = readNumber(action);
    if (req !== undefined) tightenMax(ctx.bounds, req - Number.EPSILON);
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

/** Reconcile bounds after collection — snap to integer grid when flagged. */
export const resolveBounds = (ctx: NumberContext): void => {
  reconcileBounds(ctx.bounds, { isInteger: ctx.isInteger });
};
