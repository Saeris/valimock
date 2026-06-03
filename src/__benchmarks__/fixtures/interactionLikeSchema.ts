import * as v from "valibot";

/**
 * Realistic-shape: multi-lazy union with cross-references between
 * sub-schemas. Patterned after discordkit's Interaction schema, which
 * lazy-imports Message / User / Channel / Guild. Exercises:
 *
 *  - Multiple `v.lazy(() => ...)` resolutions per mock
 *  - Union of distinct option shapes (the discriminator branch)
 *  - Nested optional/nullish wrappers around lazy refs
 */

interface UserRef {
  id: string;
  username: string;
  discriminator: string;
}

const userRefSchema: v.GenericSchema<UserRef> = v.object({
  id: v.string(),
  username: v.pipe(v.string(), v.minLength(2), v.maxLength(32)),
  discriminator: v.pipe(v.string(), v.digits(), v.length(4))
}) as unknown as v.GenericSchema<UserRef>;

interface ChannelRef {
  id: string;
  name: string;
  type: number;
}

const channelRefSchema: v.GenericSchema<ChannelRef> = v.object({
  id: v.string(),
  name: v.string(),
  type: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(15))
}) as unknown as v.GenericSchema<ChannelRef>;

export const interactionLikeSchema = v.object({
  id: v.string(),
  applicationId: v.string(),
  type: v.picklist([1, 2, 3, 4, 5] as const),
  data: v.nullish(
    v.object({
      id: v.string(),
      name: v.string(),
      options: v.optional(
        v.array(
          v.object({
            name: v.string(),
            type: v.pipe(v.number(), v.integer()),
            value: v.optional(v.union([v.string(), v.number(), v.boolean()]))
          })
        )
      )
    })
  ),
  guildId: v.nullish(v.string()),
  channel: v.nullish(v.lazy(() => channelRefSchema)),
  member: v.nullish(
    v.object({
      user: v.lazy(() => userRefSchema),
      roles: v.array(v.string()),
      joinedAt: v.pipe(v.string(), v.isoDateTime()),
      nick: v.nullish(v.string())
    })
  ),
  user: v.nullish(v.lazy(() => userRefSchema)),
  token: v.string(),
  version: v.literal(1),
  message: v.nullish(
    v.object({
      id: v.string(),
      content: v.string(),
      author: v.lazy(() => userRefSchema)
    })
  ),
  locale: v.optional(v.pipe(v.string(), v.minLength(2), v.maxLength(8))),
  guildLocale: v.optional(v.pipe(v.string(), v.minLength(2), v.maxLength(8)))
});
