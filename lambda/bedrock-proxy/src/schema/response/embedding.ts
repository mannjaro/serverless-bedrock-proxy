import { z } from "zod";

const EmbeddingSchema = z.object({
  object: z.literal("embedding"),
  embedding: z.array(z.number()),
  index: z.number(),
});
export const EmbeddingResponseSchema = z.object({
  object: z.literal("list"),
  data: z.array(
    z.object({
      object: z.literal("embedding"),
      index: z.number(),
      embedding: z.array(z.number()),
    }),
  ),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export type Embedding = z.infer<typeof EmbeddingSchema>;
export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>;
