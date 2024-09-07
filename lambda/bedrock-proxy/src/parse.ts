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
} from "@aws-sdk/client-bedrock-runtime";
import {
  BedrockRuntime,
  BedrockRuntimeServiceException,
} from "@aws-sdk/client-bedrock-runtime";

import type { ChatRequest, FunctionInput, UserMessage } from "./schema";

export class BedrockModel {
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
}
