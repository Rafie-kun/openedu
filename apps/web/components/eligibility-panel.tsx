import Link from "next/link";
import { Badge, Callout, Card } from "@edubuf/ui";
import {
  MATCH_OUTCOME_EXPLANATIONS,
  MATCH_OUTCOME_LABELS,
  REQUIREMENT_KIND_LABELS,
  REQUIREMENT_STATUS_LABELS,
  matchOutcomeTone,
  type MatchOutcomeValue,
  type RequirementStatusValue,
  type RequirementKindValue,
} from "@edubuf/shared";
import type { MatchEvaluation, RequirementEvaluation } from "@edubuf/matching";

const STATUS_TONE: Record<RequirementStatusValue, "success" | "warning" | "neutral" | "info"> = {
  MET: "success",
  NOT_MET: "warning",
  UNKNOWN: "neutral",
  NEEDS_CONFIRMATION: "info",
  NOT_APPLICABLE: "neutral",
};

function RequirementRow({ item }: { item: RequirementEvaluation }) {
  return (
    <li className="border-t border-line/60 px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {item.label}
            {!item.isMandatory ? (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
                optional
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {REQUIREMENT_KIND_LABELS[item.kind as RequirementKindValue] ?? item.kind}
            {item.lastCheckedAt ? ` · source checked ${item.lastCheckedAt.slice(0, 10)}` : " · source never checked"}
          </p>
          <p className="mt-1 text-sm text-ink">{item.evidence}</p>
        </div>
        <Badge tone={STATUS_TONE[item.status]}>{REQUIREMENT_STATUS_LABELS[item.status]}</Badge>
      </div>
      {item.sourceUrl ? (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-1 inline-block text-xs quiet-link"
        >
          Requirement source
        </a>
      ) : null}
    </li>
  );
}

export function EligibilityPanel({
  evaluation,
  opportunityKind,
  signedIn,
  profileIncomplete,
}: {
  evaluation: MatchEvaluation | null;
  opportunityKind: "programme" | "scholarship";
  signedIn: boolean;
  profileIncomplete?: string[];
}) {
  if (!signedIn) {
    return (
      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
          your eligibility
        </p>
        <p className="mt-2 text-sm text-ink">
          Sign in and add your qualifications to see a requirement-by-requirement check against this{" "}
          {opportunityKind}.
        </p>
        <div className="mt-3 flex gap-3 text-sm">
          <Link href="/login" className="quiet-link">
            Sign in
          </Link>
          <Link href="/register" className="quiet-link">
            Create an account
          </Link>
        </div>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Callout tone="warning" title="No check available">
        Your profile could not be compared with this record. Try reloading; if the problem continues,
        the record may be incomplete.
      </Callout>
    );
  }

  const outcome = evaluation.outcome as MatchOutcomeValue;

  return (
    <Card className="p-0">
      <div className="border-b border-line px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
          your eligibility · engine {evaluation.engineVersion}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={matchOutcomeTone(outcome)}>{MATCH_OUTCOME_LABELS[outcome]}</Badge>
          <span className="font-mono text-[11px] text-ink-soft">
            {Math.round(evaluation.completeness * 100)}% of mandatory requirements confirmed met
          </span>
        </div>
        <p className="mt-2 text-sm text-ink">{MATCH_OUTCOME_EXPLANATIONS[outcome]}</p>
      </div>

      {profileIncomplete && profileIncomplete.length > 0 ? (
        <div className="border-b border-line bg-brass/5 px-4 py-2 text-xs text-ink-soft">
          Your profile is missing: {profileIncomplete.join(", ")}.{" "}
          <Link href="/profile" className="quiet-link">
            Add it
          </Link>
        </div>
      ) : null}

      {evaluation.results.length === 0 ? (
        <p className="px-4 py-4 text-sm text-ink-soft">
          This record has no requirement rows yet, so no comparison is possible. That is a data gap, not
          a pass.
        </p>
      ) : (
        <ul>
          {evaluation.results.map((item) => (
            <RequirementRow key={`${item.key}-${item.kind}`} item={item} />
          ))}
        </ul>
      )}

      {evaluation.nextSteps.length > 0 ? (
        <div className="border-t border-line bg-paper/60 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
            sensible next steps
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {evaluation.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="border-t border-line px-4 py-3 text-xs text-ink-soft">
        Eligibility is not competitiveness. Meeting every recorded requirement does not guarantee an
        offer, a scholarship or a visa, and this panel is not advice from the provider.
      </p>
    </Card>
  );
}
