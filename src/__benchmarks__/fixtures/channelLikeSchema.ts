import * as v from "valibot";

/**
 * Realistic-shape: `intersect([commonBase, variant(...)])`. The canonical
 * discriminated-union-with-shared-fields pattern. discordkit uses this for
 * Channel, Webhook, Integration. v1.5.2 silently dropped the discriminator
 * in ~80% of mocked outputs before the deepMerge key-level recovery fix.
 */
export const channelLikeSchema = v.intersect([
  v.object({
    id: v.string(),
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
    description: v.nullish(v.string()),
    position: v.pipe(v.number(), v.integer(), v.minValue(0)),
    permissionOverwrites: v.array(
      v.object({
        id: v.string(),
        type: v.picklist([`role`, `member`] as const),
        allow: v.string(),
        deny: v.string()
      })
    )
  }),
  v.variant(`type`, [
    v.object({
      type: v.literal(`text`),
      topic: v.nullish(v.string()),
      lastMessageId: v.nullish(v.string()),
      rateLimitPerUser: v.nullish(v.pipe(v.number(), v.integer()))
    }),
    v.object({
      type: v.literal(`voice`),
      bitrate: v.pipe(v.number(), v.integer(), v.minValue(8000)),
      userLimit: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(99)),
      rtcRegion: v.nullish(v.string())
    }),
    v.object({
      type: v.literal(`category`),
      parentId: v.nullish(v.string())
    }),
    v.object({
      type: v.literal(`forum`),
      defaultReactionEmoji: v.nullish(v.object({ id: v.nullish(v.string()), name: v.nullish(v.string()) })),
      availableTags: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          moderated: v.boolean()
        })
      )
    })
  ])
]);
