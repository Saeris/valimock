import * as v from "valibot";

/**
 * Realistic-shape: wide-flat object with many string fields. No self-
 * references, no deep nesting — exercises the string-pipeline and
 * keyName-based generator routing. Patterned after discordkit's
 * Application schema (40+ fields, mostly leaf primitives and pipes).
 */
export const applicationLikeSchema = v.object({
  id: v.string(),
  name: v.pipe(v.string(), v.minLength(2), v.maxLength(100)),
  icon: v.nullish(v.string()),
  description: v.pipe(v.string(), v.maxLength(400)),
  rpcOrigins: v.optional(v.array(v.string())),
  botPublic: v.boolean(),
  botRequireCodeGrant: v.boolean(),
  botRequireMfa: v.optional(v.boolean()),
  termsOfServiceUrl: v.optional(v.pipe(v.string(), v.url())),
  privacyPolicyUrl: v.optional(v.pipe(v.string(), v.url())),
  owner: v.optional(
    v.object({
      id: v.string(),
      username: v.string(),
      discriminator: v.pipe(v.string(), v.digits(), v.length(4)),
      avatar: v.nullish(v.string())
    })
  ),
  verifyKey: v.string(),
  team: v.nullish(
    v.object({
      id: v.string(),
      name: v.string(),
      icon: v.nullish(v.string()),
      ownerUserId: v.string()
    })
  ),
  guildId: v.optional(v.string()),
  primarySkuId: v.optional(v.string()),
  slug: v.optional(v.pipe(v.string(), v.slug())),
  coverImage: v.nullish(v.string()),
  flags: v.optional(v.pipe(v.number(), v.integer())),
  tags: v.optional(v.array(v.pipe(v.string(), v.maxLength(20)))),
  installParams: v.optional(
    v.object({
      scopes: v.array(v.string()),
      permissions: v.string()
    })
  ),
  customInstallUrl: v.optional(v.pipe(v.string(), v.url())),
  roleConnectionsVerificationUrl: v.optional(v.pipe(v.string(), v.url()))
});
