import { streamHandle } from "hono/aws-lambda";

import app from "./src/app";

export const handler = streamHandle(app);
