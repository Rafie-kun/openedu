import { db, Prisma } from "@openedu/database";
import { assistantMessageSchema } from "@openedu/validation";
import { audit } from "@/lib/audit";
import { ASSISTANT_SYSTEM_PROMPT, getAiProvider } from "@/lib/ai";
import { retrieveContext } from "@/lib/ai/context";
import type { ChatMessage } from "@/lib/ai/types";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { getOrCreateProfile } from "@/lib/student";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to use the assistant." }, { status: 401 });
  }

  const parsed = assistantMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "That message could not be read." },
      { status: 400 },
    );
  }

  const limited = await rateLimit(`assistant:${user.id}`, 20, 3600);
  if (!limited.allowed) {
    return Response.json(
      { error: "Too many messages in a short time. Try again later." },
      { status: 429 },
    );
  }

  const provider = getAiProvider();
  if (!provider) {
    return Response.json(
      {
        error:
          "The assistant is not configured on this deployment. Everything else on OpenEdu still works.",
      },
      { status: 503 },
    );
  }

  const profile = await getOrCreateProfile(user.id);

  const conversation =
    (await db.aIConversation.findFirst({
      where: { profileId: profile.id },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 10 } },
    })) ??
    (await db.aIConversation.create({
      data: { profileId: profile.id, title: parsed.data.message.slice(0, 60) },
      include: { messages: true },
    }));

  const history: ChatMessage[] = [...conversation.messages]
    .reverse()
    .filter((message) => message.role === "USER" || message.role === "ASSISTANT")
    .map((message) => ({
      role: message.role === "ASSISTANT" ? "assistant" : "user",
      content: message.content,
    }));

  await db.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: parsed.data.message,
    },
  });

  let context;
  try {
    context = await retrieveContext(parsed.data.message, profile.id, parsed.data.includeProfile);
  } catch (error) {
    console.error("assistant-context-failed", { error });
    return Response.json(
      { error: "The catalogue could not be read just now. Try again." },
      { status: 500 },
    );
  }

  const system = `${ASSISTANT_SYSTEM_PROMPT}

Records available for this answer (use only these for platform claims):
${context.text || "No matching records were found in the catalogue."}`;

  const startedAt = Date.now();

  try {
    const completion = await provider.complete(
      [...history, { role: "user", content: parsed.data.message }],
      system,
    );

    await db.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: completion.text,
        citations: context.citations as unknown as Prisma.InputJsonValue,
        tokenCount: completion.usage?.completionTokens ?? null,
      },
    });

    await db.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    await db.aIUsageRecord.create({
      data: {
        profileId: profile.id,
        provider: provider.name,
        model: completion.model,
        promptTokens: completion.usage?.promptTokens ?? 0,
        completionTokens: completion.usage?.completionTokens ?? 0,
        latencyMs: Date.now() - startedAt,
        succeeded: true,
      },
    });

    await audit({
      actorId: user.id,
      action: "assistant.message",
      entityType: "AIConversation",
      entityId: conversation.id,
      metadata: { provider: provider.name, model: completion.model },
    });

    return Response.json({
      reply: completion.text,
      citations: context.citations,
      model: completion.model,
    });
  } catch (error) {
    await db.aIUsageRecord.create({
      data: {
        profileId: profile.id,
        provider: provider.name,
        model: provider.model,
        latencyMs: Date.now() - startedAt,
        succeeded: false,
      },
    });

    console.error("assistant-completion-failed", { error });

    return Response.json(
      { error: "The assistant could not answer just now. Try again, or use the catalogue pages." },
      { status: 502 },
    );
  }
}
