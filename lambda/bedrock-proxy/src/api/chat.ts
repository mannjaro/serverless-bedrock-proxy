import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { BedrockModel } from "../model/bedrock/chat";
import { OpenAIModel } from "../model/openai/chat";

import { streamText } from "hono/streaming";
import { ChatRequestSchema } from "../schema/request/chat";

const chat = new Hono();

chat.post(
  "/completions",
  zValidator("json", ChatRequestSchema, async (result, c) => {
    if (!result.success) {
      console.log(await c.req.text());
      console.log("Validation failed", result.error);
      return c.json({ message: "Validation failed" });
    }
  }),
  async (c) => {
    const chatRequest = await c.req.valid("json");
    const model = (() => {
      return chatRequest.model.startsWith("gpt")
        ? new OpenAIModel()
        : new BedrockModel();
    })();
    if (chatRequest.stream) {
      return streamText(c, async (stream) => {
        await model.chatStream(chatRequest, stream);
      });
    }
    const response = await model.chat(chatRequest);
    return c.json(response);
  },
);

export { chat };
