/** A value that may be absent. */
export type Maybe<T> = T | null | undefined;

/**
 * Test whether a `Maybe`-typed value is neither `null` nor `undefined`,
 * narrowing it to `NonNullable<T>` when true.
 *
 * ### Example Usage:
 *
 * ```ts
 * const fn = (str: Maybe<string>) => {
 *   if (!isNonNullable(str)) {
 *     // typeof str = null | undefined
 *     return;
 *   }
 *   // typeof str = string
 * };
 * ```
 */
export const isNonNullable = <T extends Maybe<unknown>>(
  val?: T
): val is NonNullable<T> => typeof val !== `undefined` && val !== null;

/**
 * Test whether a value is a plain object (constructed by `Object`, so not an
 * array, `Date`, `Map`, or class instance), narrowing it to a string-keyed
 * record so callers can index it without unsafe assertions.
 */
export const isObject = (val: unknown): val is Record<string, unknown> =>
  isNonNullable(val) && typeof val === `object` && val.constructor === Object;
