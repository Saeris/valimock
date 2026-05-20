import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const snowflake = v.pipe(v.string(), v.uuid());

const userSchema = v.object({
  username: v.pipe(v.string(), v.minLength(1)),
  discriminator: v.union([v.pipe(v.string(), v.digits(), v.length(4)), v.literal(`0`)]),
  globalName: v.exactOptional(v.string()),
  avatar: v.exactOptional(v.pipe(v.string(), v.minLength(1))),
  bot: v.nullish(v.boolean()),
  system: v.nullish(v.boolean()),
  mfaEnabled: v.nullish(v.boolean()),
  banner: v.nullish(v.pipe(v.string(), v.minLength(1))),
  accentColor: v.nullish(v.pipe(v.number(), v.integer())),
  verified: v.nullish(v.boolean()),
  email: v.nullish(v.pipe(v.string(), v.email())),
  flags: v.nullish(v.pipe(v.number(), v.integer())),
  publicFlags: v.nullish(v.pipe(v.number(), v.integer())),
  avatarDecoration: v.nullish(v.string())
});

const guildSchema = v.object({
  id: snowflake,
  name: v.pipe(v.string(), v.minLength(2), v.maxLength(100)),
  icon: v.nullable(v.pipe(v.string(), v.nonEmpty())),
  iconHash: v.nullish(v.pipe(v.string(), v.nonEmpty())),
  splash: v.nullable(v.pipe(v.string(), v.nonEmpty())),
  discoverySplash: v.nullable(v.pipe(v.string(), v.nonEmpty())),
  owner: v.exactOptional(v.boolean()),
  ownerId: snowflake,
  permissions: v.exactOptional(v.string()),
  region: v.nullish(v.pipe(v.string(), v.nonEmpty())),
  afkChannelId: v.nullable(snowflake),
  afkTimeout: v.pipe(v.number(), v.integer(), v.minValue(0)),
  widgetEnabled: v.exactOptional(v.boolean()),
  widgetChannelId: v.nullish(snowflake),
  applicationId: v.nullable(snowflake),
  systemChannelId: v.nullable(snowflake),
  systemChannelFlags: v.pipe(v.number(), v.integer()),
  rulesChannelId: v.nullable(snowflake),
  maxPresences: v.nullish(v.pipe(v.number(), v.integer(), v.minValue(0))),
  maxMembers: v.exactOptional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  vanityUrlCode: v.nullable(v.pipe(v.string(), v.nonEmpty())),
  description: v.nullable(v.string()),
  banner: v.nullable(v.pipe(v.string(), v.nonEmpty())),
  premiumSubscriptionCount: v.exactOptional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  publicUpdatesChannelId: v.nullable(snowflake),
  maxVideoChannelUsers: v.exactOptional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  maxStageVideoChannelUsers: v.exactOptional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  approximateMemberCount: v.exactOptional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  approximatePresenceCount: v.exactOptional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  premiumProgressBarEnabled: v.boolean(),
  safetyAlertsChannelId: v.nullable(snowflake)
});

const guildTemplateSchema = v.object({
  code: v.string(),
  name: v.string(),
  description: v.exactOptional(v.string()),
  usageCount: v.pipe(v.number(), v.integer()),
  creatorId: snowflake,
  creator: userSchema,
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
  sourceGuildId: snowflake,
  serializedSourceGuild: v.partial(guildSchema),
  isDirty: v.exactOptional(v.boolean())
});

enum ApplicationCommandType {
  CHAT_INPUT = 1,
  USER = 2,
  MESSAGE = 3,
  PRIMARY_ENTRY_POINT = 4
}

const applicationCommandTypeSchema = v.enum_(ApplicationCommandType);

const localesSchema = v.picklist([`de`, `en-GB`, `en-US`, `es-ES`, `fr`]);

const applicationCommandSchema = v.intersect([
  v.object({
    id: snowflake,
    applicationId: snowflake,
    guildId: v.exactOptional(snowflake),
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(32)),
    nameLocalizations: v.nullish(v.record(localesSchema, v.pipe(v.string(), v.minLength(1), v.maxLength(32)))),
    description: v.exactOptional(v.pipe(v.string(), v.minLength(0), v.maxLength(100))),
    descriptionLocalizations: v.nullish(v.record(localesSchema, v.pipe(v.string(), v.minLength(0), v.maxLength(100)))),
    defaultMemberPermissions: v.nullable(v.string()),
    dmPermission: v.exactOptional(v.boolean()),
    defaultPermission: v.exactOptional(v.boolean()),
    nsfw: v.exactOptional(v.boolean()),
    version: snowflake
  }),
  v.union([
    v.object({
      type: v.exactOptional(applicationCommandTypeSchema)
    }),
    v.variant(`type`, [
      v.object({
        type: v.literal(ApplicationCommandType.CHAT_INPUT),
        options: v.exactOptional(
          v.pipe(
            v.array(
              v.object({
                name: v.pipe(v.string(), v.minLength(1), v.maxLength(32)),
                nameLocalizations: v.nullish(
                  v.record(localesSchema, v.pipe(v.string(), v.minLength(1), v.maxLength(32)))
                ),
                description: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
                descriptionLocalizations: v.nullish(
                  v.record(localesSchema, v.pipe(v.string(), v.minLength(1), v.maxLength(100)))
                ),
                required: v.nullish(v.boolean(), false),
                autocomplete: v.nullish(v.boolean())
              })
            ),
            v.maxLength(25)
          )
        )
      }),
      v.object({
        type: v.literal(ApplicationCommandType.PRIMARY_ENTRY_POINT)
      })
    ])
  ])
]);

const mockSchema = new Valimock().mock;

describe(`discordkit`, () => {
  it.concurrent.each([userSchema, guildTemplateSchema, applicationCommandSchema])(
    `should generate valid mock data`,
    { repeats: 5 },
    (schema) => {
      const result = mockSchema(schema); //?
      expect(v.parse(schema, result)).toStrictEqual(result);
    }
  );
});
