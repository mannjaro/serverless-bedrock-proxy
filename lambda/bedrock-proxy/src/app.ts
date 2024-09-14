import { Hono } from "hono";

import { chat } from "./api/chat";

const app = new Hono();

app.get("/", (c) => {
  return c.text("ok");
});

app.route("/chat", chat);

export default app;
