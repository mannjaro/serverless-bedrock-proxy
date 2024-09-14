import type { ChatStreamResponse } from "../schema/response/chat";
export class BaseModel {
  streamResponseToBytes(
    streamResponse: ChatStreamResponse | undefined,
  ): Uint8Array {
    if (streamResponse) {
      streamResponse.system_fingerprint = "fp";
      streamResponse.object = "chat.completion.chunk";
      streamResponse.created = Date.now();
      return new TextEncoder().encode(
        `data: ${JSON.stringify(streamResponse)}\n\n`,
      );
    }
    return new TextEncoder().encode("data: [DONE]\n\n");
  }
}
