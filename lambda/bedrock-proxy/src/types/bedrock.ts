interface Model {
  id: string;
  created: number;
  object?: string;
  owned_by?: string;
}

interface Models {
  object?: string;
  data: Model[];
}

interface ResponseFunction {
  name?: string;
  arguments: string;
}

interface ToolCall {
  index?: number;
  id?: string;
  type: "function";
  function: ResponseFunction;
}

interface TextContent {
  text: string;
}

interface ImageUrl {
  url: string;
  detail?: string;
}

interface ImageContent {
  image_url: ImageUrl;
}

interface SystemMessage {
  name?: string;
  role: "system";
  content: string;
}

interface UserMessage {
  name?: string;
  role: "user";
  content: string | Array<TextContent | ImageContent>;
}

interface AssistantMessage {
  name?: string;
  role: "assistant";
  content?: string;
  tool_calls?: ToolCall[];
}

interface ToolMessage {
  role: "tool";
  content: string;
  tool_call_id: string;
}

interface Func {
  name: string;
  description?: string;
  parameters: string;
}

interface StreamOptions {
  include_usage: boolean;
}

interface ToolChoise {
  function: Func;
}

interface ChatRequest {
  messages: Array<SystemMessage | UserMessage | AssistantMessage | ToolMessage>;
  model: string;
  frequency_penalty?: number; // Optional
  presence_penalty?: number; // Optional
  stream?: boolean;
  stream_options?: StreamOptions;
  temperature?: number;
  top_p?: number;
  user?: string;
  max_tokens?: number;
  n?: number; // Optional
  tools?: ToolInput[];
  tool_choice?: string | ToolChoise;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface ToolInput {
  type: "function";
  function: Func;
}

interface ChatResponseMessage {
  role?: "assistant";
  content?: string;
  tool_calls?: ToolCall[];
}

interface BaseChoice {
  index?: number;
  finish_reason?: string;
  logprobs?: object;
}

interface Choice extends BaseChoice {
  message: ChatResponseMessage;
}

interface ChoiceDelta extends BaseChoice {
  delta: ChatResponseMessage;
}

interface BaseChatResponse {
  id: string;
  created: number;
  model: string;
  system_fingerprint: string;
}

interface ChatResponse extends BaseChatResponse {
  choices: Choice[];
  object: "chat.completion";
  usage: Usage;
}

interface ChatStreamResponse extends BaseChatResponse {
  choices: ChoiceDelta[];
  object: "chat.completion.chunk";
  usage?: Usage;
}

interface EmbeddingsRequest {
  input: string | string[] | Iterable<number | Iterable<number>>;
  model: string;
  encoding_format: "float" | "base64";
  dimensions?: number; // Optional
  user?: string;
}

interface Embedding {
  object: "embedding";
  embedding: number[] | Uint8Array;
  index: number;
}

interface EmbeddingsUsage {
  prompt_tokens: number;
  total_tokens: number;
}

interface EmbeddingsResponse {
  object: "list";
  data: Embedding[];
  model: string;
  usage: EmbeddingsUsage;
}
