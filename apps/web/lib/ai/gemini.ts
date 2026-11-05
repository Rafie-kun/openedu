import type { AiCompletion, AiProvider, ChatMessage } from "./types";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: { message?: string };
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async complete(messages: ChatMessage[], system: string): Promise<AiCompletion> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const body = (await response.json().catch(() => null)) as GeminiResponse | null;

    if (!response.ok) {
      const detail = body?.error?.message ?? `HTTP ${response.status}`;
      throw new Error(`The AI provider rejected the request: ${detail}`);
    }

    const text = body?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("The AI provider returned an empty reply.");
    }

    return {
      text,
      model: this.model,
      usage: body?.usageMetadata
        ? {
            promptTokens: body.usageMetadata.promptTokenCount ?? 0,
            completionTokens: body.usageMetadata.candidatesTokenCount ?? 0,
          }
        : null,
    };
  }
}
