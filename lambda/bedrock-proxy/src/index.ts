import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

import { chat } from "./api/chat";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/chat", chat);

export const handler = handle(app);
