import Link from "next/link";
import { Callout, Card, LinkButton, Stat, Window } from "@edubuf/ui";

const PILLARS = [
  {
    title: "Requirements, not vibes",
    body: "Eligibility is decided by a deterministic rules engine. The AI can explain a result; it never invents one.",
  },
  {
    title: "Your grades stay yours",
    body: "Records keep their original scale and session. No forced GPA, no silent conversion between exam boards.",
  },
  {
    title: "Every claim has a source",
    body: "Catalogue rows carry a source link, a last-checked date and a verification state you can see on the page.",
  },
  {
    title: "A next step, not a wall",
    body: "When a requirement is not met, you get the reason, the missing piece and realistic alternative routes.",
  },
];

const STEPS = [
  {
    title: "Record what you actually have",
    detail: "Qualifications, subjects, achieved and predicted grades, language tests — in their own scale.",
  },
  {
    title: "Compare real requirements",
    detail: "Each programme or scholarship is checked against your profile, requirement by requirement.",
  },
  {
    title: "See the gap",
    detail: "Met, not met, unknown or unverified — with the official link for each condition.",
  },
  {
    title: "Take one honest step",
    detail: "Save it, start a tracker entry, or look at a foundation or transfer route that fits.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid gap-8 pt-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="stagger-in">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            global · source-traceable · open source
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
            Know what you <em className="not-italic text-plum">actually</em> qualify for.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
            EduBuf is a study-planning workspace for students everywhere. Bring your real
            qualifications — however uneven — and compare them with programmes and scholarships that
            document what they ask for.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/register" size="lg">
              Start with your qualifications
            </LinkButton>
            <LinkButton href="/universities" variant="secondary" size="lg">
              Browse the catalogue
            </LinkButton>
          </div>

          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Eligibility" value="Rule-based" hint="explainable by design" />
            <Stat label="Grades" value="Original" hint="scale preserved" />
            <Stat label="Provenance" value="Per row" hint="source + check date" />
          </dl>
        </div>

        <Window
          title="readme.txt"
          meta="about this place"
          tone="plum"
          className="self-start lg:mt-4"
        >
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Most study-abroad sites tell you what to feel: dream big, apply everywhere. This one
              tries to tell you what is true, and where the uncertainty is.
            </p>
            <p className="text-paper/80">
              If a requirement has not been verified against its source, the platform says so instead
              of scoring you against it. If two sources disagree, it flags the conflict instead of
              picking a winner.
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-paper/70">
              no probabilities · no fabricated deadlines · no auto-submissions
            </p>
          </div>
        </Window>
      </section>

      <section aria-labelledby="pillars-heading">
        <h2 id="pillars-heading" className="font-display text-2xl text-ink">
          What this platform is built to protect
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} as="article">
              <h3 className="font-display text-lg text-ink">{pillar.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{pillar.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-heading" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 id="how-heading" className="font-display text-2xl text-ink">
            How a check works
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Four steps, all visible. Nothing is hidden behind a score.
          </p>
          <ol className="mt-5 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-panel font-mono text-xs text-ink-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{step.title}</p>
                  <p className="text-sm text-ink-soft">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <Callout tone="info" title="Where the catalogue stands">
            <p>
              The university, programme and scholarship catalogue is being built from official sources.
              Anything that has not been through review is labelled <strong>Not verified</strong> and is
              excluded from confident eligibility statements.
            </p>
          </Callout>
          <Callout tone="warning" title="What EduBuf will never do">
            <p>
              It will not submit an application, sign a declaration, pay a fee, invent a deadline, or
              tell you that you are certain to be admitted. Those decisions stay with you and the
              institution.
            </p>
          </Callout>
          <div className="rounded-[var(--radius-window)] border border-line bg-panel/70 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
              start somewhere small
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              A profile with one qualification and one language test is already enough to see
              meaningful requirement checks on programmes that have verified data.
            </p>
            <p className="mt-3 text-sm">
              <Link href="/register" className="quiet-link">
                Create an account
              </Link>{" "}
              or{" "}
              <Link href="/qualifications" className="quiet-link">
                look at the qualification editor
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
