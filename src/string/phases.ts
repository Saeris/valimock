import type * as v from "valibot";
import RandExp from "randexp";
import { actionHandlers, knownActionTypes } from "./actionHandlers.js";
import { formatGenerators } from "./formatGenerators.js";
import { keyNameGenerators, findFakerForKeyName, type MockeryMapper } from "./keyNameGenerators.js";
import { DEFAULT_MAX_LENGTH, ENFORCE_RETRY_BUDGET, type Phase, type StringContext } from "./types.js";

/** Extra context the `generate` phase needs but Context shouldn't expose to handlers. */
export interface GenerateExtras {
  mockeryMapper?: MockeryMapper;
  onDeprecatedMapper?: () => void;
}

/**
 * Phase 1 — walk the schema's pipe and accumulate constraint state.
 * Each action's handler reads the action's `requirement` field and mutates
 * the Context. Unknown action types are recorded as warnings.
 */
export const collectConstraints: Phase = (ctx) => {
  const pipe = (`pipe` in ctx.schema ? ctx.schema.pipe : []) as readonly v.GenericPipeItem[];
  for (const action of pipe) {
    if (action.kind === `schema`) continue; // the first pipe entry is the string schema itself
    const handler = actionHandlers[action.type];
    if (handler) {
      handler(ctx, action);
    } else if (action.kind === `validation` && !knownActionTypes.has(action.type)) {
      ctx.warnings.push(`Unhandled string validation: ${action.type}`);
    }
  }
  return undefined;
};

/**
 * Phase 2 — produce a candidate string. Selection order:
 *   1. `forceEmpty` → ""
 *   2. Examples metadata → pick one at random
 *   3. Format (email/uuid/ip/...) → format generator
 *   4. Regex → RandExp with bounded length
 *   5. Custom `stringMap` keyed by keyName (handled by Valimock.options.stringMap; see generateString)
 *   6. Named generator by keyName (e.g. `firstName`, `username`)
 *   7. Faker key-name autodiscovery (consulting the deprecated mockeryMapper first if present)
 *   8. Default lorem word
 */
export const generate = (ctx: StringContext, extras: GenerateExtras = {}): string => {
  if (ctx.forceEmpty) return ``;

  if (ctx.examples && ctx.examples.length > 0) {
    return ctx.faker.helpers.arrayElement(ctx.examples);
  }

  if (ctx.format && ctx.format in formatGenerators) {
    return formatGenerators[ctx.format](ctx);
  }

  if (ctx.regex) {
    const generator = new RandExp(ctx.regex);
    generator.randInt = (min: number, max: number): number => ctx.faker.number.int({ min, max });
    if (ctx.bounds.max < DEFAULT_MAX_LENGTH) generator.max = ctx.bounds.max;
    return generator.gen();
  }

  if (ctx.keyName !== undefined) {
    const lowerKey = ctx.keyName.toLowerCase();
    const namedKey = Object.keys(keyNameGenerators).find((k) => k.toLowerCase() === lowerKey);
    if (namedKey) return keyNameGenerators[namedKey](ctx);
    const autoDiscovered = findFakerForKeyName(ctx.keyName, ctx.faker, extras.mockeryMapper, extras.onDeprecatedMapper);
    if (autoDiscovered) return String(autoDiscovered());
  }

  return ctx.faker.lorem.word();
};

/**
 * Phase 3 — make the candidate satisfy the resolved bounds.
 * Below min: pad with alpha. Above max: truncate, preserving startsWith /
 * endsWith requirements where possible. Required substrings get prepended /
 * appended / injected before length normalization. Re-run after a fresh
 * `generate()` when the first candidate is unsalvageable.
 *
 * When `ctx.format` is set we *skip* truncation and substring injection:
 * mutating a format-generated value (e.g. an email or UUID) almost always
 * breaks the regex. The retry loop will regenerate instead, and if no
 * generation satisfies the constraint set, the orchestrator surfaces a
 * warning rather than emitting an invalid value.
 */
export const enforce = (value: string, ctx: StringContext): string => {
  if (ctx.format !== undefined) return value;

  let out = value;

  if (ctx.startsWith !== undefined && !out.startsWith(ctx.startsWith)) {
    out = ctx.startsWith + out;
  }
  if (ctx.endsWith !== undefined && !out.endsWith(ctx.endsWith)) {
    out = out + ctx.endsWith;
  }
  for (const required of ctx.includes) {
    if (!out.includes(required)) out += required;
  }

  if (out.length < ctx.bounds.min) {
    out += ctx.faker.string.alpha(ctx.bounds.min - out.length);
  }
  if (out.length > ctx.bounds.max) {
    // Truncate while preserving startsWith / endsWith requirements where possible.
    if (ctx.endsWith !== undefined && out.endsWith(ctx.endsWith)) {
      const keepTail = ctx.endsWith;
      const room = Math.max(0, ctx.bounds.max - keepTail.length);
      out = out.slice(0, room) + keepTail;
    } else {
      out = out.slice(0, ctx.bounds.max);
    }
  }

  return out;
};

/** True iff `value` satisfies every constraint encoded in `ctx`. */
export const satisfies = (value: string, ctx: StringContext): boolean => {
  if (value.length < ctx.bounds.min || value.length > ctx.bounds.max) return false;
  if (ctx.regex && !ctx.regex.test(value)) return false;
  if (ctx.startsWith !== undefined && !value.startsWith(ctx.startsWith)) return false;
  if (ctx.endsWith !== undefined && !value.endsWith(ctx.endsWith)) return false;
  for (const required of ctx.includes) if (!value.includes(required)) return false;
  for (const banned of ctx.excludes) if (value.includes(banned)) return false;
  return true;
};

export { ENFORCE_RETRY_BUDGET };
