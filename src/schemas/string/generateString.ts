import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../../types.js";
import type { MockeryMapper } from "./keyNameGenerators.js";
import {
  collectConstraints,
  enforce,
  ENFORCE_RETRY_BUDGET,
  generate,
  satisfies
} from "./phases.js";
import {
  type ActionHandler,
  DEFAULT_MAX_LENGTH,
  type FormatGenerator,
  type StringContext
} from "./types.js";

/**
 * A context is "trivially satisfiable" when `generate()` alone is guaranteed
 * to produce a value that passes `satisfies()` without needing to enforce or
 * retry. Skipping the loop avoids a per-string `enforce()` + `satisfies()`
 * round-trip — measurable on hot paths because plain `v.string()` is the
 * most common string shape in real schemas.
 */
const isTriviallySatisfiable = (ctx: StringContext): boolean =>
  !ctx.forceEmpty &&
  !ctx.format &&
  !ctx.regex &&
  ctx.includes.length === 0 &&
  ctx.excludes.length === 0 &&
  ctx.startsWith === undefined &&
  ctx.endsWith === undefined &&
  ctx.forbiddenLengths.size === 0 &&
  ctx.forbiddenValues.size === 0 &&
  !ctx.wordCountSet &&
  ctx.bounds.min === 0 &&
  ctx.bounds.max >= DEFAULT_MAX_LENGTH;

export interface GenerateStringOptions {
  faker: Faker;
  keyName?: string;
  /** User-supplied per-key overrides. If a key matches, this wins over format/key-name generators. */
  stringMap?: Record<string, (...args: unknown[]) => string>;
  /**
   * Action handlers keyed by action `type`, consulted instead of the built-in
   * registry. Callers merge their additions over the built-ins once, so this
   * is a complete table rather than an overlay.
   */
  actionHandlers?: Record<string, ActionHandler>;
  /** Format generators keyed by format name; a complete table like `actionHandlers`. */
  formatGenerators?: Record<string, FormatGenerator>;
  /** Deprecated user-supplied faker resolver; consulted before auto-discovery if present. */
  mockeryMapper?: MockeryMapper;
  /** Called once if `mockeryMapper` is actually invoked during this call. */
  onDeprecatedMapper?: () => void;
  /** Called with diagnostic messages collected during constraint resolution. */
  onWarn?: (message: string) => void;
}

/**
 * Generate a mock string for a Valibot string schema (with or without a pipe).
 *
 * Pipeline:
 *   1. collectConstraints — walk the pipe, populate Context
 *   2. user `stringMap[keyName]` — if present, runs ahead of internal generators
 *   3. generate — pick a candidate via format / regex / keyName / default
 *   4. enforce — pad / truncate / inject required substrings
 *   5. validate — if it still violates a constraint, regenerate up to
 *      ENFORCE_RETRY_BUDGET times, then surface the failure as a warning
 *      and return the best-effort value (never recurses past budget)
 */
export type StringSchemaInput = SchemaMaybeWithPipe<
  v.StringSchema<v.ErrorMessage<v.StringIssue> | undefined>
>;

export const generateString = (
  schema: StringSchemaInput,
  options: GenerateStringOptions
): string => {
  const ctx: StringContext = {
    schema,
    keyName: options.keyName,
    faker: options.faker,
    bounds: { min: 0, max: DEFAULT_MAX_LENGTH },
    forceEmpty: false,
    format: undefined,
    regex: undefined,
    examples: undefined,
    includes: [],
    startsWith: undefined,
    endsWith: undefined,
    excludes: [],
    forbiddenLengths: new Set(),
    exactValue: undefined,
    allowedValues: undefined,
    forbiddenValues: new Set(),
    wordBounds: { min: 0, max: Number.MAX_SAFE_INTEGER },
    forbiddenWordCounts: new Set(),
    wordCountSet: false,
    custom: {},
    warnings: []
  };

  collectConstraints(ctx, options.actionHandlers);

  // Exact-value pin wins over everything else.
  if (ctx.exactValue !== undefined) {
    flushWarnings(ctx, options.onWarn);
    return ctx.exactValue;
  }
  // Allow-list: pick a value, falling back to a non-forbidden one if any of
  // the allowed values were ALSO marked forbidden.
  if (ctx.allowedValues && ctx.allowedValues.length > 0) {
    const allowed = ctx.allowedValues.filter(
      (v) => !ctx.forbiddenValues.has(v)
    );
    flushWarnings(ctx, options.onWarn);
    return ctx.faker.helpers.arrayElement(
      allowed.length > 0 ? allowed : ctx.allowedValues
    );
  }

  // User-supplied stringMap takes precedence over internal generators, but
  // only when there's a keyName to look up.
  const userOverride =
    options.keyName !== undefined && options.stringMap
      ? options.stringMap[options.keyName]
      : undefined;

  const extras = {
    formatGenerators: options.formatGenerators,
    mockeryMapper: options.mockeryMapper,
    onDeprecatedMapper: options.onDeprecatedMapper
  };

  // Fast path: when no constraints are present, faker's default output
  // (lorem.word or a keyName generator) is always valid. Skip the retry
  // loop entirely — `enforce` is a no-op without required substrings or
  // tight bounds, and `satisfies` is trivially true. The one thing a
  // key-name generator can still violate is the upper bound: auto-discovered
  // generators like `faker.lorem.text()` for a `text` key run past
  // DEFAULT_MAX_LENGTH, so an explicit `maxLength`/`maxGraphemes` on that
  // field would be silently exceeded. A single length check keeps the fast
  // path honest without paying for the full retry loop.
  if (!userOverride && isTriviallySatisfiable(ctx)) {
    flushWarnings(ctx, options.onWarn);
    const candidate = generate(ctx, extras);
    return candidate.length > ctx.bounds.max
      ? enforce(candidate, ctx)
      : candidate;
  }

  for (let attempt = 0; attempt < ENFORCE_RETRY_BUDGET; attempt++) {
    const candidate = userOverride ? userOverride() : generate(ctx, extras);
    const enforced = enforce(candidate, ctx);
    if (satisfies(enforced, ctx)) {
      flushWarnings(ctx, options.onWarn);
      return enforced;
    }
  }

  // Budget exhausted — surface the failure but still return *something* so a
  // single bad schema doesn't fail the entire mock tree. The warning lets a
  // user opt into stricter behavior if they care.
  ctx.warnings.push(
    `Could not satisfy all string constraints within ${ENFORCE_RETRY_BUDGET} attempts (bounds=${JSON.stringify(
      ctx.bounds
    )}, format=${String(ctx.format)}, regex=${String(ctx.regex)})`
  );
  flushWarnings(ctx, options.onWarn);
  return enforce(generate(ctx, extras), ctx);
};

const flushWarnings = (
  ctx: StringContext,
  onWarn: ((m: string) => void) | undefined
): void => {
  if (!onWarn) return;
  for (const w of ctx.warnings) onWarn(w);
};
