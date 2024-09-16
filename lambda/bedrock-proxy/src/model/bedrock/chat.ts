import type {
  Message,
  Tool,
  ToolResultBlock,
  ToolUseBlock,
  ConverseCommandOutput,
  ConverseStreamCommandOutput,
  ConverseCommandInput,
  ConverseStreamCommandInput,
  ContentBlock,
  ImageFormat,
  ConverseStreamOutput,
  StopReason,
} from "@aws-sdk/client-bedrock-runtime";
import {
  BedrockRuntime,
  BedrockRuntimeServiceException,
} from "@aws-sdk/client-bedrock-runtime";

import { BaseModel } from "../base";

import type {
  ChatRequest,
  FunctionInput,
  UserMessage,
} from "../../schema/request/chat";
import type {
  ChatResponse,
  ChatStreamResponse,
  ChatResponseMessage,
  ToolCall,
} from "../../schema/response/chat";
import type { StreamingApi } from "hono/utils/stream";

export class BedrockModel extends BaseModel {
  async _invokeBedrock(
    chatRequest: ChatRequest,
    stream: boolean,
  ): Promise<ConverseCommandOutput | ConverseStreamCommandOutput | undefined> {
    // if (BedrockModel.DEBUG) {
    //   this.logger.info("Raw request: " + JSON.stringify(chatRequest));
    // }

    // Convert OpenAI chat request to Bedrock SDK request
    const args = await this._parseRequest(chatRequest);
    // if (BedrockModel.DEBUG) {
    //   this.logger.info("Bedrock request: " + JSON.stringify(args));
    // }
    const bedrockRuntime = new BedrockRuntime({ region: "us-east-1" });

    try {
      let response: Promise<
        ConverseCommandOutput | ConverseStreamCommandOutput
      >;
      if (stream) {
        response = bedrockRuntime.converseStream(args);
      } else {
        response = bedrockRuntime.converse(args);
      }
      return response;
    } catch (error) {
      if (error instanceof BedrockRuntimeServiceException) {
        // this.logger.error("Validation Error: " + error.message);
        throw new Error(`HTTPException: ${error.message}`);
      }
    }
  }

  async chat(chatRequest: ChatRequest) {
    const messageId = "";
    const response = (await this._invokeBedrock(
      chatRequest,
      false,
    )) as ConverseCommandOutput;
    const outputMessage = response.output?.message;
    const content = outputMessage?.content;
    const inputTokens = response.usage?.inputTokens;
    const outputTokens = response.usage?.outputTokens;
    const finishReason = response.stopReason;
    return this._createResponse(
      chatRequest.model,
      messageId,
      content,
      finishReason,
      inputTokens,
      outputTokens,
    );
  }

  async chatStream(chatRequest: ChatRequest, stream: StreamingApi) {
    const messageId = "";
    const response = (await this._invokeBedrock(
      chatRequest,
      true,
    )) as ConverseStreamCommandOutput;
    for await (const chunk of response?.stream || []) {
      const streamResponse = this._createStreamResponse(
        chatRequest.model,
        messageId,
        chunk,
      );
      if (!streamResponse) {
        continue;
      }
      if (streamResponse.choices) {
        console.log("streamResponse", streamResponse);
        await stream.write(this.streamResponseToBytes(streamResponse));
      } else if (chatRequest.stream_options?.include_usage) {
        await stream.write(this.streamResponseToBytes(streamResponse));
      }
    }
    await stream.write(this.streamResponseToBytes(undefined));
  }

  _createResponse(
    model: string,
    messageId: string,
    content: ContentBlock[] | undefined,
    finishReason: string | undefined,
    inputTokens: number | undefined,
    outputTokens: number | undefined,
  ): ChatResponse {
    const message: ChatResponseMessage = {
      role: "assistant",
    };
    if (finishReason === "tool_use") {
      const tool_calls = Array<ToolCall>();
      for (const contentBlock of content || []) {
        if ("toolUse" in contentBlock) {
          const tool = contentBlock.toolUse;
          tool_calls.push({
            id: tool?.toolUseId,
            type: "function",
            function: {
              name: tool?.name,
              arguments: JSON.stringify(tool?.input),
            },
          });
        }
      }
      message.tool_calls = tool_calls;
      message.content = undefined;
    } else if (content && content.length > 0) {
      message.content = content[0].text;
    }
    const response: ChatResponse = {
      id: messageId,
      model: model,
      choices: [
        {
          index: 0,
          message: message,
          finish_reason: this._convertFinishReason(finishReason),
        },
      ],
      usage: {
        prompt_tokens: inputTokens || 0,
        completion_tokens: outputTokens || 0,
        total_tokens: (inputTokens || 0) + (outputTokens || 0),
      },
      system_fingerprint: "fp",
      object: "chat.completions",
      created: Date.now(),
    };
    return response;
  }

  _createStreamResponse(
    model: string,
    messageId: string,
    chunk: ConverseStreamOutput,
  ): ChatStreamResponse | undefined {
    let message: ChatResponseMessage | undefined;
    let finishReason: StopReason | undefined;
    if ("messageStart" in chunk) {
      message = {
        role: "assistant",
        content: "",
      };
    }
    if ("contentBlockStart" in chunk) {
      const delta = chunk.contentBlockStart?.start;
      if (delta && "toolUse" in delta) {
        const index =
          chunk.contentBlockStart?.contentBlockIndex !== undefined
            ? chunk.contentBlockStart?.contentBlockIndex - 1
            : -1;
        message = {
          role: "assistant",
          tool_calls: [
            {
              index: index,
              type: "function",
              id: delta.toolUse?.toolUseId || "",
              function: {
                name: delta.toolUse?.name || "",
                arguments: "",
              },
            },
          ],
        };
      }
    }
    if ("contentBlockDelta" in chunk) {
      const delta = chunk.contentBlockDelta?.delta;
      if (delta && "text" in delta) {
        message = {
          role: "assistant",
          content: delta.text,
        };
      } else {
        const index =
          chunk.contentBlockDelta?.contentBlockIndex !== undefined
            ? chunk.contentBlockDelta?.contentBlockIndex - 1
            : -1;
        message = {
          role: "assistant",
          tool_calls: [
            {
              index: index,
              type: "function",
              function: {
                arguments: JSON.stringify(delta?.toolUse?.input),
              },
            },
          ],
        };
      }
    }
    if ("messageStop" in chunk) {
      message = {
        role: "assistant",
      };
      finishReason = chunk.messageStop?.stopReason;
    }
    if ("metadata" in chunk) {
      const metadata = chunk.metadata;
      if (metadata && "usage" in metadata) {
        const usage = metadata.usage;
        if (usage && "inputTokens" in usage) {
          return {
            id: messageId,
            object: "chat.completion.chunk",
            created: Date.now(),
            model: model,
            system_fingerprint: "fp",
            choices: [],
            usage: {
              prompt_tokens: usage.inputTokens || 0,
              completion_tokens: usage.outputTokens || 0,
              total_tokens:
                (usage.inputTokens || 0) + (usage.outputTokens || 0),
            },
          };
        }
      }
    }
    if (message) {
      return {
        id: messageId,
        model: model,
        system_fingerprint: "fp",
        choices: [
          {
            index: 0,
            delta: message,
            logprobs: undefined,
            finish_reason: this._convertFinishReason(finishReason),
          },
        ],
        created: Date.now(),
        object: "chat.completion.chunk",
      };
    }
    return undefined;
  }

  // Other methods and properties
  async _parseRequest(
    chatRequest: ChatRequest,
  ): Promise<ConverseCommandInput | ConverseStreamCommandInput> {
    // Parse messages and system prompts
    const messages = await this._parseMessages(chatRequest);
    const systemPrompts = this._parseSystemPrompts(chatRequest);

    // Base inference parameters
    const inferenceConfig = {
      temperature: chatRequest.temperature,
      maxTokens: chatRequest.max_tokens,
      topP: chatRequest.top_p,
    };

    // Base arguments
    const args: ConverseCommandInput | ConverseStreamCommandInput = {
      modelId: chatRequest.model,
      messages: messages,
      system: systemPrompts,
      inferenceConfig: inferenceConfig,
    };

    // Add tool configuration if tools are provided
    if (chatRequest.tools) {
      args.toolConfig = {
        tools: chatRequest.tools.map((t) => this._convertToolSpec(t.function)),
      };

      // Handle tool choice if it exists and does not start with "meta.llama3-1-"
      if (
        chatRequest.tool_choice &&
        !chatRequest.model.startsWith("meta.llama3-1-")
      ) {
        if (typeof chatRequest.tool_choice === "string") {
          // Map tool choice to the corresponding configuration
          if (chatRequest.tool_choice === "required") {
            args.toolConfig.toolChoice = { any: {} };
          } else {
            args.toolConfig.toolChoice = { auto: {} };
          }
        } else {
          // Specific tool to use
          if ("function" in chatRequest.tool_choice) {
            args.toolConfig.toolChoice = {
              tool: { name: chatRequest.tool_choice.function?.name || "" },
            };
          }
        }
      }
    }

    return args;
  }

  _parseSystemPrompts(chatRequest: ChatRequest): Array<{ text: string }> {
    const systemPrompts: Array<{ text: string }> = [];

    for (const message of chatRequest.messages) {
      if (message.role !== "system") {
        // Ignore non-system messages
        continue;
      }

      if (typeof message.content === "string") {
        systemPrompts.push({ text: message.content });
      }
    }

    return systemPrompts;
  }

  async _parseMessages(chatRequest: ChatRequest): Promise<Array<Message>> {
    const messages: Array<Message> = [];

    for (const message of chatRequest.messages) {
      if (message.role === "user") {
        messages.push({
          role: message.role,
          content: await this._parseContentParts(message, chatRequest.model),
        });
      } else if (message.role === "tool") {
        const result: ToolResultBlock = {
          toolUseId: message.tool_call_id,
          content: [{ text: message.content }],
        };
        messages.push({
          role: "user",
          content: [
            {
              toolResult: result,
            },
          ],
        });
      } else if (message.role === "assistant") {
        if (message.content) {
          messages.push({
            role: message.role,
            content: [{ text: message.content }],
          });
        } else if (message.tool_calls) {
          const toolUse: ToolUseBlock = {
            toolUseId: message.tool_calls[0].id,
            name: message.tool_calls[0].function.name,
            // TODO: Attention
            input: JSON.parse(message.tool_calls[0].function.arguments),
          };
          messages.push({
            role: message.role,
            content: [
              {
                toolUse: toolUse,
              },
            ],
          });
        }
      }
    }
    return messages;
  }

  async _parseImage(imageUrl: string): Promise<[Uint8Array, ImageFormat]> {
    const pattern = /^data:(image\/[a-z]*);base64,\s*/;
    const contentTypeMatch = imageUrl.match(pattern);

    // If the image URL is already base64 encoded
    if (contentTypeMatch) {
      const imageData = imageUrl.replace(pattern, "");
      const decodedImageData = this._base64ToArrayBuffer(imageData);
      const contentType = contentTypeMatch[1];
      const format: ImageFormat = contentType.replace(
        "image/",
        "",
      ) as ImageFormat;
      return [decodedImageData, format];
    }

    try {
      // Fetch the image data from the URL using the fetch API
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Unable to access the image URL");
      }
      const contentType = response.headers.get("Content-Type") || "image/jpeg";
      const arrayBuffer = await response.arrayBuffer();
      const decodedImageData = new Uint8Array(arrayBuffer);
      const format = contentType.replace("image/", "") as ImageFormat;
      return [decodedImageData, format];
    } catch (error) {
      throw new Error(`Unable to access the image URL: ${error}`);
    }
  }
  _base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async _parseContentParts(
    message: UserMessage,
    modelId: string,
  ): Promise<Array<ContentBlock>> {
    if (typeof message.content === "string") {
      return [{ text: message.content }];
    }

    const contentParts: Array<ContentBlock> = [];

    for (const part of message.content) {
      if ("text" in part) {
        contentParts.push({ text: part.text });
      } else if ("image" in part) {
        // Assume image processing happens here
        const [image, format] = await this._parseImage(part.image_url.url);
        contentParts.push({
          image: {
            format: format,
            source: {
              bytes: image,
            },
          },
        });
      }
    }

    return contentParts;
  }

  _convertToolSpec(func: FunctionInput): Tool {
    return {
      toolSpec: {
        name: func.name,
        description: func.description,
        inputSchema: {
          json: func.parameters,
        },
      },
    };
  }

  _convertFinishReason(finishReason: string | undefined): string {
    if (!finishReason) {
      return "stop";
    }
    switch (finishReason.toLowerCase()) {
      case "tool_use":
        return "tool_calls";
      case "finished":
        return "stop";
      case "end_turn":
        return "stop";
      case "max_tokens":
        return "length";
      case "stop_sequence":
        return "stop";
      case "content_filtered":
        return "content_filter";
      default:
        return "stop";
    }
  }
}
