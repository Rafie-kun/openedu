"use client";

import { useActionState, useState } from "react";
import { Button, Callout, Field, Input, Select } from "@openedu/ui";
import { DEGREE_LEVEL_LABELS } from "@openedu/shared";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

interface Option {
  id: string;
  name: string;
}

export interface ProfileFormValues {
  displayName: string;
  dateOfBirth: string;
  countryOfResidenceId: string;
  nationalityCountryId: string;
  intendedDegreeLevel: string;
  intendedSubjectId: string;
  financialNeedLevel: string;
  preferredCountryIds: string[];
}

export function ProfileForm({
  action,
  countries,
  subjects,
  initial,
  next,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  countries: Option[];
  subjects: Option[];
  initial: ProfileFormValues;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const [preferred, setPreferred] = useState<string[]>(initial.preferredCountryIds);

  function toggleCountry(id: string) {
    setPreferred((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 5) return current;
      return [...current, id];
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Name in your workspace"
          htmlFor="displayName"
          hint="Optional. Used only for greetings."
        >
          <Input
            id="displayName"
            name="displayName"
            defaultValue={initial.displayName}
            maxLength={80}
          />
        </Field>

        <Field
          label="Date of birth"
          htmlFor="dateOfBirth"
          hint="Only needed for opportunities with age conditions."
        >
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={initial.dateOfBirth}
          />
        </Field>

        <Field label="Nationality" htmlFor="nationalityCountryId">
          <Select
            id="nationalityCountryId"
            name="nationalityCountryId"
            defaultValue={initial.nationalityCountryId}
          >
            <option value="">Prefer not to say</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Country of residence" htmlFor="countryOfResidenceId">
          <Select
            id="countryOfResidenceId"
            name="countryOfResidenceId"
            defaultValue={initial.countryOfResidenceId}
          >
            <option value="">Prefer not to say</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Intended degree level" htmlFor="intendedDegreeLevel">
          <Select
            id="intendedDegreeLevel"
            name="intendedDegreeLevel"
            defaultValue={initial.intendedDegreeLevel}
          >
            <option value="">Not decided</option>
            {Object.entries(DEGREE_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Intended subject" htmlFor="intendedSubjectId">
          <Select
            id="intendedSubjectId"
            name="intendedSubjectId"
            defaultValue={initial.intendedSubjectId}
          >
            <option value="">Not decided</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Financial need"
          htmlFor="financialNeedLevel"
          hint="Only used for need-based funding checks. Nothing here is shared publicly."
        >
          <Select
            id="financialNeedLevel"
            name="financialNeedLevel"
            defaultValue={initial.financialNeedLevel}
          >
            <option value="">Prefer not to say</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Preferred study destinations</legend>
        <p className="text-xs text-ink-soft">
          Up to five. These only shape recommendations; they do not hide anything.
        </p>
        <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto rounded-md border border-line bg-paper/60 p-3 sm:grid-cols-2">
          {countries.map((country) => {
            const checked = preferred.includes(country.id);
            return (
              <label key={country.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="preferredCountryIds"
                  value={country.id}
                  checked={checked}
                  onChange={() => toggleCountry(country.id)}
                  className="h-4 w-4 rounded border-line text-plum"
                />
                <span>{country.name}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-1 font-mono text-[11px] text-ink-soft">{preferred.length}/5 selected</p>
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
