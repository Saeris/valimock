import type * as v from "valibot";

/**
 * Iterate over the validation actions in a Valibot schema's pipe, dispatching
 * each to its handler by `action.type`. Unknown validation actions trigger
 * `onUnknown(type)` so callers can surface diagnostics. The leading `schema`
 * pipe item is always skipped.
 *
 * Nested pipes are flattened: `v.pipe(v.pipe(v.number(), v.integer()),
 * v.maxValue(10))` is a valid Valibot schema whose inner pipe carries the
 * `integer` action, so the walk descends into any pipe item that is itself
 * a piped schema. Actions are still visited in the order Valibot runs them.
 *
 * The dispatch order matches Valibot's own action order on the pipe, which
 * matters when later actions narrow or override earlier ones (e.g. `length`
 * coming after `minLength`).
 */
export const walkPipe = <Ctx>(
  schema: { pipe?: ReadonlyArray<v.GenericPipeItem | v.GenericPipeItemAsync> },
  ctx: Ctx,
  handlers: Record<
    string,
    (ctx: Ctx, action: v.GenericPipeItem | v.GenericPipeItemAsync) => void
  >,
  onUnknown?: (type: string) => void
): Ctx => {
  const visit = (
    pipe: ReadonlyArray<v.GenericPipeItem | v.GenericPipeItemAsync>
  ): void => {
    for (const action of pipe) {
      if (action.kind === `schema`) {
        if (`pipe` in action && Array.isArray(action.pipe)) {
          visit(action.pipe as typeof pipe);
        }
        continue;
      }
      if (action.type in handlers) {
        handlers[action.type](ctx, action);
      } else if (action.kind === `validation` && onUnknown) {
        onUnknown(action.type);
      }
    }
  };
  visit(schema.pipe ?? []);
  return ctx;
};
