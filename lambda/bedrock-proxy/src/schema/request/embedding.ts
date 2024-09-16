import { z } from "zod";

export const EmbeddingRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string(),
  encoding_format: z.enum(["float", "base64"]).default("float"),
  dimensions: z.number().optional(),
  user: z.string().optional(),
});

export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;
