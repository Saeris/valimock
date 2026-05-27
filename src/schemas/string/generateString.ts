import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../../types.js";
import type { MockeryMapper } from "./keyNameGenerators.js";
import { collectConstraints, enforce, ENFORCE_RETRY_BUDGET, generate, satisfies } from "./phases.js";
import { DEFAULT_MAX_LENGTH, type StringContext } from "./types.js";

export interface GenerateStringOptions {
  faker: Faker;
  keyName?: string;
  /** User-supplied per-key overrides. If a key matches, this wins over format/key-name generators. */
  stringMap?: Record<string, (...args: unknown[]) => string>;
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
export type StringSchemaInput = SchemaMaybeWithPipe<v.StringSchema<v.ErrorMessage<v.StringIssue> | undefined>>;

export const generateString = (schema: StringSchemaInput, options: GenerateStringOptions): string => {
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
    warnings: []
  };

  collectConstraints(ctx);

  // Exact-value pin wins over everything else.
  if (ctx.exactValue !== undefined) {
    flushWarnings(ctx, options.onWarn);
    return ctx.exactValue;
  }
  // Allow-list: pick a value, falling back to a non-forbidden one if any of
  // the allowed values were ALSO marked forbidden.
  if (ctx.allowedValues && ctx.allowedValues.length > 0) {
    const allowed = ctx.allowedValues.filter((v) => !ctx.forbiddenValues.has(v));
    flushWarnings(ctx, options.onWarn);
    return ctx.faker.helpers.arrayElement(allowed.length > 0 ? allowed : ctx.allowedValues);
  }

  // User-supplied stringMap takes precedence over internal generators, but
  // only when there's a keyName to look up.
  const userOverride =
    options.keyName !== undefined && options.stringMap ? options.stringMap[options.keyName] : undefined;

  const extras = {
    mockeryMapper: options.mockeryMapper,
    onDeprecatedMapper: options.onDeprecatedMapper
  };

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

const flushWarnings = (ctx: StringContext, onWarn: ((m: string) => void) | undefined): void => {
  if (!onWarn) return;
  for (const w of ctx.warnings) onWarn(w);
};
