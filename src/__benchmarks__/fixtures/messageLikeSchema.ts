import * as v from "valibot";

/**
 * Realistic-shape: recursive-via-lazy nested inside nullish + arrays of nested
 * objects with many string fields. Patterned after discordkit's Message schema,
 * which was the dominant driver of the v1.5.0 perf regression — the
 * self-referencing `referencedMessage` field combined with eager wrapper
 * recursion produced ~26s per mock until v1.5.3 lazified the wrappers.
 *
 * Used by both the benchmark suite and the call-count regression specs.
 */

interface Message {
  id: string;
  channelId: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
    email?: string | null;
  };
  mentions: Array<{ id: string; name: string }>;
  attachments: Array<{
    id: string;
    url: string;
    proxyUrl?: string | null;
    height?: number | null;
    width?: number | null;
  }>;
  embeds: Array<{
    title?: string | null;
    description?: string | null;
    footer?: { text: string; iconUrl?: string | null } | null;
    author?: { name: string; url?: string | null } | null;
    fields: Array<{ name: string; value: string }>;
  }>;
  referencedMessage?: Message | null;
}

export const messageLikeSchema: v.GenericSchema<Message> = v.object({
  id: v.string(),
  channelId: v.string(),
  content: v.string(),
  author: v.object({
    id: v.string(),
    name: v.string(),
    avatar: v.nullish(v.string()),
    email: v.nullish(v.string())
  }),
  mentions: v.array(v.object({ id: v.string(), name: v.string() })),
  attachments: v.array(
    v.object({
      id: v.string(),
      url: v.string(),
      proxyUrl: v.nullish(v.string()),
      height: v.nullish(v.number()),
      width: v.nullish(v.number())
    })
  ),
  embeds: v.array(
    v.object({
      title: v.nullish(v.string()),
      description: v.nullish(v.string()),
      footer: v.nullish(v.object({ text: v.string(), iconUrl: v.nullish(v.string()) })),
      author: v.nullish(v.object({ name: v.string(), url: v.nullish(v.string()) })),
      fields: v.array(v.object({ name: v.string(), value: v.string() }))
    })
  ),
  referencedMessage: v.nullish(v.lazy(() => messageLikeSchema))
}) as unknown as v.GenericSchema<Message>;
