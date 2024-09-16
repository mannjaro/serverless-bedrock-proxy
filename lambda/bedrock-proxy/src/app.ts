import { Hono } from "hono";

import type { LambdaEvent } from "hono/aws-lambda";

import { chat } from "./api/chat";
import { embedding } from "./api/embedding";
type Bindings = {
  event: LambdaEvent;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("ok");
});

app.route("/chat", chat);
app.route("/embeddings", embedding);
export default app;
