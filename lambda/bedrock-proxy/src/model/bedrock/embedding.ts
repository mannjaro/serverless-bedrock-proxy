import {
  BedrockRuntime,
  type InvokeModelCommandInput,
  ValidationException,
} from "@aws-sdk/client-bedrock-runtime";
import type { EmbeddingRequest } from "../../schema/request/embedding";
import type {
  Embedding,
  EmbeddingResponse,
} from "../../schema/response/embedding";

interface InvokeModelArgs {
  texts: Array<string>;
  input_type: "search_document";
  truncate: "END";
}

class BedrockEmbeddingModel {
  _invokeModel(args: InvokeModelArgs, modelId: string) {
    const bedrockRuntime = new BedrockRuntime({ region: "us-east-1" });
    const input: InvokeModelCommandInput = {
      modelId: modelId,
      body: JSON.stringify(args),
      accept: "application/json",
      contentType: "application/json",
    };
    try {
      const response = bedrockRuntime.invokeModel(input);
      return response;
    } catch (error) {
      if (error instanceof ValidationException) {
        throw new Error(`HTTPException: ${error.message}`);
      }
      throw error;
    }
  }
  _createEmbeddingResponse(
    embeddings: Array<number>,
    model: string,
    inputTokens: number,
    outputTokens: number,
    encodingFormat: "float" | "base64",
  ): EmbeddingResponse {
    const data: Array<Embedding> = [];
    data.push({
      object: "embedding",
      index: 0,
      embedding: embeddings,
    });
    return {
      object: "list",
      data: data,
      model: model,
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
    };
  }
}

class CohereEmbeddingModel extends BedrockEmbeddingModel {
  _parseRequest(embeddingRequest: EmbeddingRequest): InvokeModelArgs {
    const input = embeddingRequest.input;
    const texts = (): Array<string> => {
      if (typeof input === "string") {
        return [input];
      }
      if (Array.isArray(input)) {
        return input;
      }
      throw new Error("Invalid input type");
    };
    return {
      texts: texts(),
      input_type: "search_document",
      truncate: "END",
    };
  }
  async embed(embeddingRequest: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await this._invokeModel(
      this._parseRequest(embeddingRequest),
      embeddingRequest.model,
    );
    const body = JSON.parse(new TextDecoder().decode(response.body));
    console.log(body);
    return this._createEmbeddingResponse(
      body.embeddings,
      embeddingRequest.model,
      0,
      0,
      "float",
    );
  }
}

export { CohereEmbeddingModel };
