import { z } from "zod";

const EmbeddingRequestSchema = z.object({
  input: z.string(),
  model: z.string(),
});

export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;
