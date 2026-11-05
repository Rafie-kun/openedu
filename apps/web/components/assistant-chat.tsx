"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, Checkbox, Textarea } from "@openedu/ui";

interface Citation {
  index: number;
  kind: string;
  title: string;
  url: string | null;
  verificationStatus: string;
}

export function AssistantChat({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [includeProfile, setIncludeProfile] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || message.trim().length < 2) return;

    setPending(true);
    setError(null);
    setCitations([]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, includeProfile }),
      });

      const body = (await response.json().catch(() => null)) as {
        reply?: string;
        citations?: Citation[];
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "The assistant could not answer just now.");
        return;
      }

      setMessage("");
      setCitations(body?.citations ?? []);
      router.refresh();
    } catch {
      setError("The assistant could not be reached. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (!configured) {
    return (
      <Callout tone="warning" title="The assistant is off">
        No AI provider key is configured, so this page stays read-only. Search, eligibility checks,
        saved items, the tracker and the budget planner all work without it.
      </Callout>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="assistant-message" className="block text-sm font-medium text-ink">
          Your question
        </label>
        <Textarea
          id="assistant-message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          maxLength={2000}
          required
          placeholder="e.g. Which of these programmes accept my qualification, and what is missing?"
        />

        <Checkbox
          id="includeProfile"
          name="includeProfile"
          label="Include my academic summary"
          description="Sends your nationality, qualifications, grades, language tests and intended level with this message. Off by default. Documents are never sent."
          checked={includeProfile}
          onChange={(event) => setIncludeProfile(event.target.checked)}
        />

        {error ? <Callout tone="error">{error}</Callout> : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Thinking…" : "Ask"}
        </Button>
      </form>

      {citations.length > 0 ? (
        <div className="rounded-md border border-line bg-paper/60 px-3 py-2 text-xs text-ink-soft">
          <p className="font-mono uppercase tracking-[0.12em]">Records used</p>
          <ul className="mt-1 space-y-1">
            {citations.map((citation) => (
              <li key={`${citation.kind}-${citation.index}`}>
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
    </div>
  );
}
