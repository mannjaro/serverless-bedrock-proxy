import { z } from "zod";

const ResponseFunctionSchema = z.object({
  name: z.string(),
  arguments: z.string(),
});

const ToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: ResponseFunctionSchema,
});

const TextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ImageUrlSchema = z.object({
  url: z.string(),
  detail: z
    .union([z.literal("auto"), z.literal("low"), z.literal("high")])
    .optional(),
});

const ImageContentSchema = z.object({
  type: z.literal("image_url"),
  image_url: ImageUrlSchema,
});

const SystemMessageSchema = z.object({
  name: z.string().optional(),
  role: z.literal("system"),
  content: z.union([z.string(), z.array(TextContentSchema)]),
});

const UserMessageSchema = z.object({
  name: z.string().optional(),
  role: z.literal("user"),
  content: z.union([
    z.string(),
    z.array(z.union([TextContentSchema, ImageContentSchema])),
  ]),
});

const AssistantMessageSchema = z.object({
  name: z.string().optional(),
  role: z.literal("assistant"),
  content: z.string().nullable(),
  tool_calls: z.array(ToolCallSchema).optional(),
});

const ToolMessageSchema = z.object({
  role: z.literal("tool"),
  content: z.string(),
  tool_call_id: z.string(),
});

const MessageSchema = z.union([
  SystemMessageSchema,
  UserMessageSchema,
  AssistantMessageSchema,
  ToolMessageSchema,
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
    .union([
      z.literal("auto"),
      z.literal("none"),
      z.literal("required"),
      z.object({ type: z.literal("function"), function: FunctionSchema }),
    ])
    .optional(),
});

export type FunctionInput = z.infer<typeof FunctionSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
