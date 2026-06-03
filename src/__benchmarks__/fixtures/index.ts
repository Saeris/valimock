/**
 * Realistic-shape schema fixtures used by performance benchmarks and the
 * call-count regression specs. Each schema models a recurring pattern from
 * the discordkit codebase, the library that drove the original v1.5.0
 * regression investigation.
 *
 * Not exported from the public API — internal to the test/bench surface.
 */
export { applicationLikeSchema } from "./applicationLikeSchema.js";
export { channelLikeSchema } from "./channelLikeSchema.js";
export { interactionLikeSchema } from "./interactionLikeSchema.js";
export { messageLikeSchema } from "./messageLikeSchema.js";
