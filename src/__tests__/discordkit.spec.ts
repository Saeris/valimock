import {
  pipe,
  object,
  string,
  minLength,
  union,
  length,
  literal,
  nullish,
  boolean,
  number,
  integer,
  email,
  parse,
  digits,
  uuid,
  isoTimestamp,
  partial,
  minValue,
  nonEmpty,
  maxLength,
  nullable,
  enum_,
  intersect,
  exactOptional,
  record,
  variant,
  picklist,
  array
} from "valibot";
import { Valimock } from "../Valimock.js";

const snowflake = pipe(string(), uuid());

const userSchema = object({
  username: pipe(string(), minLength(1)),
  discriminator: union([pipe(string(), digits(), length(4)), literal(`0`)]),
  globalName: exactOptional(string()),
  avatar: exactOptional(pipe(string(), minLength(1))),
  bot: nullish(boolean()),
  system: nullish(boolean()),
  mfaEnabled: nullish(boolean()),
  banner: nullish(pipe(string(), minLength(1))),
  accentColor: nullish(pipe(number(), integer())),
  verified: nullish(boolean()),
  email: nullish(pipe(string(), email())),
  flags: nullish(pipe(number(), integer())),
  publicFlags: nullish(pipe(number(), integer())),
  avatarDecoration: nullish(string())
});

const guildSchema = object({
  id: snowflake,
  name: pipe(string(), minLength(2), maxLength(100)),
  icon: nullable(pipe(string(), nonEmpty())),
  iconHash: nullish(pipe(string(), nonEmpty())),
  splash: nullable(pipe(string(), nonEmpty())),
  discoverySplash: nullable(pipe(string(), nonEmpty())),
  owner: exactOptional(boolean()),
  ownerId: snowflake,
  permissions: exactOptional(string()),
  region: nullish(pipe(string(), nonEmpty())),
  afkChannelId: nullable(snowflake),
  afkTimeout: pipe(number(), integer(), minValue(0)),
  widgetEnabled: exactOptional(boolean()),
  widgetChannelId: nullish(snowflake),
  applicationId: nullable(snowflake),
  systemChannelId: nullable(snowflake),
  systemChannelFlags: pipe(number(), integer()),
  rulesChannelId: nullable(snowflake),
  maxPresences: nullish(pipe(number(), integer(), minValue(0))),
  maxMembers: exactOptional(pipe(number(), integer(), minValue(0))),
  vanityUrlCode: nullable(pipe(string(), nonEmpty())),
  description: nullable(string()),
  banner: nullable(pipe(string(), nonEmpty())),
  premiumSubscriptionCount: exactOptional(pipe(number(), integer(), minValue(0))),
  publicUpdatesChannelId: nullable(snowflake),
  maxVideoChannelUsers: exactOptional(pipe(number(), integer(), minValue(0))),
  maxStageVideoChannelUsers: exactOptional(pipe(number(), integer(), minValue(0))),
  approximateMemberCount: exactOptional(pipe(number(), integer(), minValue(0))),
  approximatePresenceCount: exactOptional(pipe(number(), integer(), minValue(0))),
  premiumProgressBarEnabled: boolean(),
  safetyAlertsChannelId: nullable(snowflake)
});

const guildTemplateSchema = object({
  code: string(),
  name: string(),
  description: exactOptional(string()),
  usageCount: pipe(number(), integer()),
  creatorId: snowflake,
  creator: userSchema,
  createdAt: pipe(string(), isoTimestamp()),
  updatedAt: pipe(string(), isoTimestamp()),
  sourceGuildId: snowflake,
  serializedSourceGuild: partial(guildSchema),
  isDirty: exactOptional(boolean())
});

enum ApplicationCommandType {
  CHAT_INPUT = 1,
  USER = 2,
  MESSAGE = 3,
  PRIMARY_ENTRY_POINT = 4
}

const applicationCommandTypeSchema = enum_(ApplicationCommandType);

const localesSchema = picklist([`de`, `en-GB`, `en-US`, `es-ES`, `fr`]);

const applicationCommandSchema = intersect([
  object({
    id: snowflake,
    applicationId: snowflake,
    guildId: exactOptional(snowflake),
    name: pipe(string(), minLength(1), maxLength(32)),
    nameLocalizations: nullish(record(localesSchema, pipe(string(), minLength(1), maxLength(32)))),
    description: exactOptional(pipe(string(), minLength(0), maxLength(100))),
    descriptionLocalizations: nullish(record(localesSchema, pipe(string(), minLength(0), maxLength(100)))),
    defaultMemberPermissions: nullable(string()),
    dmPermission: exactOptional(boolean()),
    defaultPermission: exactOptional(boolean()),
    nsfw: exactOptional(boolean()),
    version: snowflake
  }),
  union([
    object({
      type: exactOptional(applicationCommandTypeSchema)
    }),
    variant(`type`, [
      object({
        type: literal(ApplicationCommandType.CHAT_INPUT),
        options: exactOptional(
          pipe(
            array(
              object({
                name: pipe(string(), minLength(1), maxLength(32)),
                nameLocalizations: nullish(record(localesSchema, pipe(string(), minLength(1), maxLength(32)))),
                description: pipe(string(), minLength(1), maxLength(100)),
                descriptionLocalizations: nullish(record(localesSchema, pipe(string(), minLength(1), maxLength(100)))),
                required: nullish(boolean(), false),
                autocomplete: nullish(boolean())
              })
            ),
            maxLength(25)
          )
        )
      }),
      object({
        type: literal(ApplicationCommandType.PRIMARY_ENTRY_POINT)
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
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );
});
