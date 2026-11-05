import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiProvider } from "./gemini";

afterEach(() => {
  vi.unstubAllGlobals();
});

function reply(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

describe("GeminiProvider", () => {
  it("joins the text parts and reports usage", async () => {
    reply({
      candidates: [{ content: { parts: [{ text: "First " }, { text: "second" }] } }],
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 7 },
    });

    const provider = new GeminiProvider("test-key", "gemini-test");
    const completion = await provider.complete([{ role: "user", content: "hello" }], "system");

    expect(completion.text).toBe("First second");
    expect(completion.model).toBe("gemini-test");
    expect(completion.usage).toEqual({ promptTokens: 12, completionTokens: 7 });
  });

  it("maps the assistant role to the provider's model role", async () => {
    const captured: {
      body: {
        contents: Array<{ role: string }>;
        systemInstruction: { parts: Array<{ text: string }> };
      } | null;
    } = { body: null };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        captured.body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
          { status: 200 },
        );
      }),
    );

    const provider = new GeminiProvider("test-key", "gemini-test");
    await provider.complete(
      [
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ],
      "system",
    );

    expect(captured.body!.contents.map((entry) => entry.role)).toEqual(["user", "model"]);
    expect(captured.body!.systemInstruction.parts[0]!.text).toBe("system");
  });

  it("throws the provider message on an error response", async () => {
    reply({ error: { message: "API key not valid" } }, 400);
    const provider = new GeminiProvider("bad-key", "gemini-test");

    await expect(provider.complete([{ role: "user", content: "hi" }], "system")).rejects.toThrow(
      "API key not valid",
    );
  });

  it("throws when the reply has no text", async () => {
    reply({ candidates: [{ content: { parts: [] } }] });
    const provider = new GeminiProvider("test-key", "gemini-test");

    await expect(provider.complete([{ role: "user", content: "hi" }], "system")).rejects.toThrow(
      "empty reply",
    );
  });
});
