import { Hono } from "hono";

import type { LambdaEvent } from "hono/aws-lambda";

import { chat } from "./api/chat";
type Bindings = {
  event: LambdaEvent;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("ok");
});

app.route("/chat", chat);

export default app;
