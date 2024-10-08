import { z } from "zod";

const UsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});

const ResponseFunctionSchema = z.object({
  name: z.string().optional(),
  arguments: z.string(),
});

const ToolCallSchema = z.object({
  index: z.number().optional(),
  id: z.string().optional(),
  type: z.literal("function").default("function"),
  function: ResponseFunctionSchema,
});

const ChatResponseMessageSchema = z.object({
  role: z.literal("assistant").default("assistant"),
  content: z.string().optional(),
  tool_calls: z.array(ToolCallSchema).optional(),
});

const BaseChoiceSchema = z.object({
  index: z.number().optional().default(0),
  finish_reason: z.string().optional(),
  logprobs: z.any().optional(),
});

const ChoiceSchema = BaseChoiceSchema.merge(
  z.object({
    message: ChatResponseMessageSchema,
  }),
);

const ChoiceDeltaSchema = BaseChoiceSchema.merge(
  z.object({
    delta: ChatResponseMessageSchema,
  }),
);

const BaseChatResponseSchema = z.object({
  id: z.string(),
  created: z.number().default(Date.now()),
  model: z.string(),
  system_fingerprint: z.string().default("fp"),
});

const ChatResponseSchema = BaseChatResponseSchema.merge(
  z.object({
    choices: z.array(ChoiceSchema),
    object: z.literal("chat.completions"),
    usage: UsageSchema,
  }),
);

const ChatStreamResponseSchema = BaseChatResponseSchema.merge(
  z.object({
    choices: z.array(ChoiceDeltaSchema),
    object: z.literal("chat.completion.chunk"),
    usage: UsageSchema.optional(),
  }),
);

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type ChatStreamResponse = z.infer<typeof ChatStreamResponseSchema>;
export type ChatResponseMessage = z.infer<typeof ChatResponseMessageSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type ResponseFunction = z.infer<typeof ResponseFunctionSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type ChoiceDelta = z.infer<typeof ChoiceDeltaSchema>;
