import { BaseModel } from "../base";
import OpenAI from "openai";
import type { ChatRequest } from "../../schema/request/chat";
import type { StreamingApi } from "hono/utils/stream";

export class OpenAIModel extends BaseModel {
  async chat(chatRequest: ChatRequest) {
    const client = new OpenAI();
    const response = await client.chat.completions.create(chatRequest);
    return response;
  }
  async chatStream(chatRequest: ChatRequest, stream: StreamingApi) {
    const client = new OpenAI();
    const response = await client.chat.completions.create({
      ...chatRequest,
      stream: true,
    });
    const encoder = new TextEncoder();
    for await (const chunk of response) {
      console.log(chunk);
      await stream.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
    return response;
  }
}
