"use client";

import { useActionState } from "react";
import { Button, Callout, Checkbox, Field, Input, Select, Textarea } from "@openedu/ui";
import { DEGREE_LEVEL_LABELS } from "@openedu/shared";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

type StateAction = (state: FormState, formData: FormData) => Promise<FormState>;

const LEVELS = Object.entries(DEGREE_LEVEL_LABELS) as Array<[string, string]>;

export function ProgrammeForm({
  action,
  universities,
}: {
  action: StateAction;
  universities: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  if (universities.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Add an institution first. A programme has to belong to one.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}

      <Field
        label="Institution"
        htmlFor="universityId"
        required
        error={state.fieldErrors?.universityId}
      >
        <Select id="universityId" name="universityId" required defaultValue="">
          <option value="" disabled>
            Pick one
          </option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
              {university.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Programme title" htmlFor="title" required error={state.fieldErrors?.title}>
        <Input id="title" name="title" required maxLength={300} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Degree level"
          htmlFor="degreeLevel"
          required
          error={state.fieldErrors?.degreeLevel}
        >
          <Select id="degreeLevel" name="degreeLevel" required defaultValue="UNDERGRADUATE">
            {LEVELS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Duration in months"
          htmlFor="durationMonths"
          error={state.fieldErrors?.durationMonths}
          hint="Leave empty if the page does not say."
        >
          <Input id="durationMonths" name="durationMonths" type="number" min={1} max={144} />
        </Field>
      </div>

      <Field
        label="Official programme page"
        htmlFor="officialUrl"
        required
        error={state.fieldErrors?.officialUrl}
      >
        <Input id="officialUrl" name="officialUrl" type="url" required placeholder="https://" />
      </Field>

      <Field
        label="Source you checked"
        htmlFor="sourceUrl"
        required
        error={state.fieldErrors?.sourceUrl}
        hint="The page the facts came from. It is shown next to the record."
      >
        <Input id="sourceUrl" name="sourceUrl" type="url" required placeholder="https://" />
      </Field>

      <Field
        label="Tuition summary"
        htmlFor="tuitionSummary"
        error={state.fieldErrors?.tuitionSummary}
        hint="Quote the page briefly. Leave empty rather than guessing."
      >
        <Input id="tuitionSummary" name="tuitionSummary" maxLength={300} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add programme for review"}
      </Button>
    </form>
  );
}

export function ScholarshipForm({
  action,
  countries,
}: {
  action: StateAction;
  countries: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}

      <Field label="Scholarship name" htmlFor="name" required error={state.fieldErrors?.name}>
        <Input id="name" name="name" required maxLength={300} />
      </Field>

      <Field
        label="Provider"
        htmlFor="providerName"
        required
        error={state.fieldErrors?.providerName}
        hint="Government, university, foundation or company. An existing provider is reused."
      >
        <Input id="providerName" name="providerName" required maxLength={300} />
      </Field>

      <Field label="Host country" htmlFor="hostCountryId" error={state.fieldErrors?.hostCountryId}>
        <Select id="hostCountryId" name="hostCountryId" defaultValue="">
          <option value="">Not country-specific</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Degree levels</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEVELS.map(([value, label]) => (
            <Checkbox
              key={value}
              id={`level-${value}`}
              name="degreeLevels"
              value={value}
              label={label}
            />
          ))}
        </div>
      </fieldset>

      <Field
        label="Official scholarship page"
        htmlFor="officialUrl"
        required
        error={state.fieldErrors?.officialUrl}
      >
        <Input id="officialUrl" name="officialUrl" type="url" required placeholder="https://" />
      </Field>

      <Field
        label="Source you checked"
        htmlFor="sourceUrl"
        required
        error={state.fieldErrors?.sourceUrl}
        hint="The page the eligibility and funding facts came from."
      >
        <Input id="sourceUrl" name="sourceUrl" type="url" required placeholder="https://" />
      </Field>

      <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
        <Textarea id="description" name="description" rows={3} maxLength={1000} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add scholarship for review"}
      </Button>
    </form>
  );
}
