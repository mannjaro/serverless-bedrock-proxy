import { Hono } from "hono";
import { CohereEmbeddingModel } from "../model/bedrock/embedding";
import { zValidator } from "@hono/zod-validator";

import { EmbeddingRequestSchema } from "../schema/request/embedding";

const embedding = new Hono();

embedding.post(
  "",
  zValidator("json", EmbeddingRequestSchema, async (result, c) => {
    if (!result.success) {
      console.log(await c.req.text());
      return c.json({ message: "Validation failed" });
    }
  }),
  async (c) => {
    const model = new CohereEmbeddingModel();
    const embeddingRequest = await c.req.valid("json");
    const response = await model.embed(embeddingRequest);
    return c.json(response);
  },
);

export { embedding };
