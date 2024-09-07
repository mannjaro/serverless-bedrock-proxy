import { z } from "zod";

const ResponseFunction = z.object({
  name: z.string().optional(),
  arguments: z.string(),
});

const ToolCall = z.object({
  index: z.number().optional(),
  id: z.string().optional(),
  type: z.literal("function"),
  function: ResponseFunction,
});

const TextContentSchema = z.object({
  text: z.string(),
});

const ImageUrlSchema = z.object({
  url: z.string(),
  detail: z.string().optional(),
});

const ImageContentSchema = z.object({
  image_url: ImageUrlSchema,
});

const UserMessageSchema = z.object({
  name: z.string().optional(),
  role: z.literal("user"),
  content: z.union([
    z.string(),
    z.array(z.union([TextContentSchema, ImageContentSchema])),
  ]),
});

const MessageSchema = z.union([
  z.object({
    name: z.string().optional(),
    role: z.literal("system"),
    content: z.string(),
  }),
  z.object({
    name: z.string().optional(),
    role: z.literal("user"),
    content: z.string(),
  }),
  z.object({
    name: z.string().optional(),
    role: z.literal("assistant"),
    content: z.string().nullable(),
    tool_calls: z.array(ToolCall).optional(),
  }),
  z.object({
    role: z.literal("tool"),
    content: z.string(),
    tool_call_id: z.string(),
  }),
]);

const StreamOptionsSchema = z.object({
  include_usage: z.boolean(),
});

const FunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.any(),
});

const ToolInputSchema = z.object({
  type: z.literal("function"),
  function: FunctionSchema,
});

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  model: z.string(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
  stream: z.boolean().optional(),
  stream_options: StreamOptionsSchema.optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  user: z.string().optional(),
  max_tokens: z.number().optional(),
  n: z.number().optional(),
  tools: z.array(ToolInputSchema).optional(),
  tool_choice: z
    .union([z.string(), z.object({ function: FunctionSchema })])
    .optional(),
});

export type FunctionInput = z.infer<typeof FunctionSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
