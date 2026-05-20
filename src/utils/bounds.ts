import type { Faker } from "@faker-js/faker";

/**
 * Numeric bounds with tracking of which side(s) were explicitly set by a
 * schema action vs. left at the default. The flags drive bound reconciliation:
 * when only one side is set above/below the default range, the other side
 * widens to keep the range non-empty.
 */
export interface Bounds {
  min: number;
  max: number;
  /** True iff an action set the lower bound (i.e. not the original default). */
  minSet: boolean;
  /** True iff an action set the upper bound. */
  maxSet: boolean;
}

export const makeBounds = (defaults: { min: number; max: number }): Bounds => ({
  min: defaults.min,
  max: defaults.max,
  minSet: false,
  maxSet: false
});

/** Raise the lower bound to `value` (or take the max with the existing lower bound if already set). */
export const tightenMin = (b: Bounds, value: number): void => {
  b.min = b.minSet ? Math.max(b.min, value) : value;
  b.minSet = true;
};

/** Lower the upper bound to `value` (or take the min with the existing upper bound if already set). */
export const tightenMax = (b: Bounds, value: number): void => {
  b.max = b.maxSet ? Math.min(b.max, value) : value;
  b.maxSet = true;
};

/**
 * After collection, reconcile bounds so the range is non-empty:
 *   - only `min` was set above the default ceiling → widen `max` to `min + 1`
 *   - only `max` was set below the default floor → narrow `min` to `max - 1`
 * When `integer` is requested, snap to the integer grid afterwards.
 */
export const reconcileBounds = (b: Bounds, opts: { isInteger?: boolean } = {}): Bounds => {
  if (b.minSet && !b.maxSet && b.min >= b.max) b.max = b.min + 1;
  if (b.maxSet && !b.minSet && b.max <= b.min) b.min = b.max - 1;
  if (opts.isInteger) {
    b.min = Math.ceil(b.min);
    b.max = Math.floor(b.max);
  }
  return b;
};

/**
 * Pick a target within `b` that avoids the `forbidden` set. The `seed` arg
 * controls the starting pick:
 *   - a number: use it directly (e.g. an exact `size`/`length` action's value)
 *   - a Faker instance: random pick within bounds
 *   - undefined: use the midpoint of [min, max]
 * Nudges +1 then -1 to find a satisfying neighbour. If neither direction
 * works, returns the original pick (caller surfaces unsatisfiable cases).
 */
export const pickAvoiding = (b: Bounds, forbidden: ReadonlySet<number>, seed: number | Faker | undefined): number => {
  let target: number;
  if (typeof seed === `number`) target = seed;
  else if (seed === undefined) target = Math.floor((b.min + b.max) / 2);
  else target = seed.number.int({ min: b.min, max: b.max });
  while (forbidden.has(target) && target + 1 <= b.max) target += 1;
  while (forbidden.has(target) && target - 1 >= b.min) target -= 1;
  return target;
};
