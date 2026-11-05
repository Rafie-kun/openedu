import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Callout, Card, EmptyState, SectionHeading, Window } from "@openedu/ui";
import { formatDateTime } from "@openedu/shared";
import { db } from "@openedu/database";
import { AssistantChat } from "@/components/assistant-chat";
import { isAiConfigured } from "@/lib/env";
import { getOrCreateProfile } from "@/lib/student";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Assistant" };
export const dynamic = "force-dynamic";

interface Citation {
  index: number;
  kind: string;
  title: string;
  url: string | null;
}

function readCitations(value: unknown): Citation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.index !== "number" || typeof record.title !== "string") return [];
    return [
      {
        index: record.index,
        kind: typeof record.kind === "string" ? record.kind : "RECORD",
        title: record.title,
        url: typeof record.url === "string" ? record.url : null,
      },
    ];
  });
}

export default async function AssistantPage() {
  const user = await requireUser("/assistant");
  const profile = await getOrCreateProfile(user.id);
  const configured = isAiConfigured();

  const conversation = await db.aIConversation.findFirst({
    where: { profileId: profile.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="assistant" title="Ask about your options">
        The assistant reads the same records as the catalogue pages and cites them. It cannot change
        your profile, submit an application or decide eligibility.
      </SectionHeading>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Window title="conversation" meta={configured ? "Gemini" : "off"}>
          <AssistantChat configured={configured} />
        </Window>

        <Card>
          <h2 className="font-display text-lg text-ink">What it will not do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>Invent a university, scholarship, deadline or requirement.</li>
            <li>Call you eligible without a structured comparison on the platform.</li>
            <li>Read another student&apos;s profile or your documents.</li>
            <li>Submit, sign, pay or promise an admission or visa outcome.</li>
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            When a message leaves this page it goes to the configured AI provider. Do not paste
            passport numbers, application portals or other sensitive identifiers.
          </p>
        </Card>
      </div>

      <Callout tone="info" title="Use the catalogue for the final check">
        Eligibility pages show requirement-by-requirement reasons and source dates. The assistant
        can summarise them but the comparison itself is calculated, not generated.{" "}
        <Link href="/universities" className="quiet-link">
          Browse institutions
        </Link>
        .
      </Callout>

      <section aria-labelledby="history-heading" className="space-y-3">
        <h2 id="history-heading" className="font-display text-2xl text-ink">
          This conversation
        </h2>

        {!conversation || conversation.messages.length === 0 ? (
          <EmptyState title="No messages yet">
            Ask something specific, such as whether a programme records a language requirement, or
            which scholarships in the catalogue are open to your nationality.
          </EmptyState>
        ) : (
          <ol className="space-y-3">
            {conversation.messages.map((message) => {
              const citations = readCitations(message.citations);
              return (
                <Card as="li" key={message.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={message.role === "USER" ? "info" : "success"}>
                      {message.role === "USER" ? "you" : "assistant"}
                    </Badge>
                    <span className="font-mono text-[11px] text-ink-soft">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{message.content}</p>

                  {citations.length > 0 ? (
                    <div className="mt-3 border-t border-line/60 pt-2 text-xs text-ink-soft">
                      <p className="font-mono uppercase tracking-[0.12em]">Records used</p>
                      <ul className="mt-1 space-y-1">
                        {citations.map((citation) => (
                          <li key={`${message.id}-${citation.index}`}>
                            [{citation.index}] {citation.kind.toLowerCase()} · {citation.title}
                            {citation.url ? (
                              <>
                                {" · "}
                                <a
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="quiet-link"
                                >
                                  official page ↗
                                </a>
                              </>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
