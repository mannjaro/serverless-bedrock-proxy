import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { BedrockModel } from "./parse";
import { zValidator } from "@hono/zod-validator";

import { ChatRequestSchema } from "./schema";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post(
  "/chat/completions",
  zValidator("json", ChatRequestSchema, async (result, c) => {
    if (!result.success) {
      console.log(await c.req.text());
      console.log("Validation failed", result.error);
      return c.json({ message: "Validation failed" });
    }
  }),
  async (c) => {
    const model = new BedrockModel();
    const parsed_req = await model._parseRequest(await c.req.valid("json"));
    console.log(parsed_req);
    return c.json(c.req.json());
  },
);

// export const handler = handle(app);
export default app;
