import { BaseModel } from "../base";
import OpenAI from "openai";
import type { ChatRequest } from "../../schema/request/chat";

export class OpenAIModel extends BaseModel {
  async _invokeOpenAI(chatRequest: ChatRequest) {
    const client = new OpenAI();
    return client.chat.completions.create(chatRequest);
  }
  async chat(chatRequest: ChatRequest) {
    const response = await this._invokeOpenAI(chatRequest);
    return response;
  }
  async chatStream(chatRequest: ChatRequest) {
    const response = await this._invokeOpenAI(chatRequest);
    return response;
  }
}
