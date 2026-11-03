"use client";

import { useActionState, useMemo, useState } from "react";
import { Button, Callout, Field, Input, Select, Textarea } from "@edubuf/ui";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

export interface GradeBandOption {
  label: string;
  rank: number;
}

export interface QualificationTypeOption {
  id: string;
  name: string;
  level: string;
  scaleId: string | null;
  scaleName: string | null;
  bands: GradeBandOption[];
  awardingBodyIds: string[];
}

interface RowState {
  key: string;
  subjectId: string;
  gradeLabel: string;
  kind: "ACHIEVED" | "PREDICTED" | "ESTIMATED";
}

function newRow(): RowState {
  return {
    key: Math.random().toString(36).slice(2),
    subjectId: "",
    gradeLabel: "",
    kind: "ACHIEVED",
  };
}

export function QualificationForm({
  action,
  types,
  awardingBodies,
  subjects,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  types: QualificationTypeOption[];
  awardingBodies: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string; code: string }>;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [rows, setRows] = useState<RowState[]>([newRow()]);

  const type = useMemo(() => types.find((item) => item.id === typeId), [types, typeId]);
  const bands = type?.bands ?? [];
  const allowedBodies = useMemo(
    () => awardingBodies.filter((body) => type?.awardingBodyIds.includes(body.id)),
    [awardingBodies, type],
  );

  const payload = rows
    .filter((row) => row.subjectId && row.gradeLabel)
    .map((row) => ({
      subjectId: row.subjectId,
      gradeLabel: row.gradeLabel,
      kind: status === "IN_PROGRESS" ? row.kind : row.kind,
    }));

  function updateRow(key: string, patch: Partial<RowState>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}

      <input type="hidden" name="subjectResults" value={JSON.stringify(payload)} />
      <input type="hidden" name="gradeScaleId" value={type?.scaleId ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qualification" htmlFor="qualificationTypeId" required>
          <Select
            id="qualificationTypeId"
            name="qualificationTypeId"
            required
            value={typeId}
            onChange={(event) => setTypeId(event.target.value)}
          >
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.level.replace("_", " ").toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Awarding body" htmlFor="awardingBodyId" hint="Leave blank if unsure.">
          <Select id="awardingBodyId" name="awardingBodyId" defaultValue="">
            <option value="">Not specified</option>
            {allowedBodies.map((body) => (
              <option key={body.id} value={body.id}>
                {body.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status" required>
          <Select
            id="status"
            name="status"
            required
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIALLY_COMPLETED">Partly completed</option>
            <option value="AWARDED">Awarded</option>
            <option value="NOT_COMPLETED">Not completed</option>
          </Select>
        </Field>

        <Field label="Examination year" htmlFor="sessionYear" hint="For example 2026.">
          <Input id="sessionYear" name="sessionYear" type="number" min={1950} max={2100} inputMode="numeric" />
        </Field>

        <Field label="Session" htmlFor="sessionSeries" hint="For example June, November, or Semester 1.">
          <Input id="sessionSeries" name="sessionSeries" maxLength={40} />
        </Field>

        <Field
          label="Overall grade"
          htmlFor="overallGradeLabel"
          hint={type?.scaleName ? `Scale: ${type.scaleName}` : "No grade scale recorded for this qualification."}
        >
          <Select id="overallGradeLabel" name="overallGradeLabel" defaultValue="">
            <option value="">Not specified</option>
            {bands.map((band) => (
              <option key={band.label} value={band.label}>
                {band.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="rounded-md border border-line bg-paper/60 p-4">
        <legend className="px-1 text-sm font-medium text-ink">Subjects and grades</legend>
        <p className="text-xs text-ink-soft">
          Enter what is on your result slip. Predicted grades are stored separately from achieved ones.
        </p>

        <div className="mt-3 space-y-3">
          {rows.map((row, index) => (
            <div key={row.key} className="grid gap-2 sm:grid-cols-[1.4fr_0.8fr_1fr_auto]">
              <label className="sr-only" htmlFor={`subject-${row.key}`}>
                Subject {index + 1}
              </label>
              <Select
                id={`subject-${row.key}`}
                value={row.subjectId}
                onChange={(event) => updateRow(row.key, { subjectId: event.target.value })}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>

              <label className="sr-only" htmlFor={`grade-${row.key}`}>
                Grade {index + 1}
              </label>
              <Select
                id={`grade-${row.key}`}
                value={row.gradeLabel}
                onChange={(event) => updateRow(row.key, { gradeLabel: event.target.value })}
              >
                <option value="">Grade</option>
                {bands.map((band) => (
                  <option key={band.label} value={band.label}>
                    {band.label}
                  </option>
                ))}
              </Select>

              <label className="sr-only" htmlFor={`kind-${row.key}`}>
                Result type {index + 1}
              </label>
              <Select
                id={`kind-${row.key}`}
                value={row.kind}
                onChange={(event) =>
                  updateRow(row.key, { kind: event.target.value as RowState["kind"] })
                }
              >
                <option value="ACHIEVED">Achieved</option>
                <option value="PREDICTED">Predicted</option>
                <option value="ESTIMATED">Estimated</option>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                aria-label={`Remove subject row ${index + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => setRows((current) => [...current, newRow()])}
        >
          Add another subject
        </Button>
      </fieldset>

      <Field label="Notes" htmlFor="notes" hint="Anything that explains an unusual result. Visible only to you.">
        <Textarea id="notes" name="notes" maxLength={1000} rows={3} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add qualification"}
      </Button>
    </form>
  );
}

export function LanguageTestForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Test" htmlFor="testCode" required>
          <Select id="testCode" name="testCode" required defaultValue="IELTS">
            <option value="IELTS">IELTS</option>
            <option value="TOEFL">TOEFL iBT</option>
            <option value="PTE">PTE Academic</option>
            <option value="DUOLINGO">Duolingo English Test</option>
            <option value="CAMBRIDGE">Cambridge English</option>
            <option value="OTHER">Other</option>
          </Select>
        </Field>

        <Field label="Score" htmlFor="score" required hint="Overall score, exactly as reported.">
          <Input id="score" name="score" required maxLength={20} placeholder="e.g. 7.0" />
        </Field>

        <Field label="Test date" htmlFor="testDate">
          <Input id="testDate" name="testDate" type="date" />
        </Field>

        <Field label="Expiry date" htmlFor="expiresAt" hint="Most tests are valid for two years.">
          <Input id="expiresAt" name="expiresAt" type="date" />
        </Field>
      </div>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Add language test"}
      </Button>
    </form>
  );
}
