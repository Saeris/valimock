import type * as v from "valibot";

/**
 * Iterate over the validation actions in a Valibot schema's pipe, dispatching
 * each to its handler by `action.type`. Unknown validation actions trigger
 * `onUnknown(type)` so callers can surface diagnostics. The leading `schema`
 * pipe item is always skipped.
 *
 * The dispatch order matches Valibot's own action order on the pipe, which
 * matters when later actions narrow or override earlier ones (e.g. `length`
 * coming after `minLength`).
 */
export const walkPipe = <Ctx>(
  schema: { pipe?: readonly (v.GenericPipeItem | v.GenericPipeItemAsync)[] },
  ctx: Ctx,
  handlers: Record<string, (ctx: Ctx, action: v.GenericPipeItem | v.GenericPipeItemAsync) => void>,
  onUnknown?: (type: string) => void
): Ctx => {
  const pipe = schema.pipe ?? [];
  for (const action of pipe) {
    if (action.kind === `schema`) continue;
    const handler = handlers[action.type];
    if (handler) {
      handler(ctx, action);
    } else if (action.kind === `validation` && onUnknown) {
      onUnknown(action.type);
    }
  }
  return ctx;
};
