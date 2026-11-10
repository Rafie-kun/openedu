"use client";

import { useId } from "react";
import { Checkbox, Field, Input, Select, Textarea } from "@openedu/ui";
import {
  ChildForm,
  COVERAGE,
  FUNDING_COMPONENTS,
  REQUIREMENT_KINDS,
  SourceField,
  type Option,
  type StateAction,
} from "./catalogue-child-forms";

function toLocalInput(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function UniversityEditForm({
  action,
  university,
  countries,
}: {
  action: StateAction;
  university: {
    id: string;
    name: string;
    officialName: string | null;
    countryId: string;
    city: string;
    websiteUrl: string;
    type: string;
    sourceUrl: string | null;
  };
  countries: Option[];
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={university.id} />

          <Field label="Name" htmlFor={`${uid}-name`} required error={state.fieldErrors?.name}>
            <Input
              id={`${uid}-name`}
              name="name"
              required
              defaultValue={university.name}
              maxLength={300}
            />
          </Field>

          <Field
            label="Official name"
            htmlFor={`${uid}-officialName`}
            error={state.fieldErrors?.officialName}
          >
            <Input
              id={`${uid}-officialName`}
              name="officialName"
              defaultValue={university.officialName ?? ""}
              maxLength={400}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Country"
              htmlFor={`${uid}-countryId`}
              required
              error={state.fieldErrors?.countryId}
            >
              <Select
                id={`${uid}-countryId`}
                name="countryId"
                required
                defaultValue={university.countryId}
              >
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="City" htmlFor={`${uid}-city`} required error={state.fieldErrors?.city}>
              <Input
                id={`${uid}-city`}
                name="city"
                required
                defaultValue={university.city}
                maxLength={120}
              />
            </Field>

            <Field
              label="Website"
              htmlFor={`${uid}-websiteUrl`}
              required
              error={state.fieldErrors?.websiteUrl}
            >
              <Input
                id={`${uid}-websiteUrl`}
                name="websiteUrl"
                type="url"
                required
                defaultValue={university.websiteUrl}
              />
            </Field>

            <Field label="Type" htmlFor={`${uid}-type`} required error={state.fieldErrors?.type}>
              <Select id={`${uid}-type`} name="type" required defaultValue={university.type}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
          </div>

          <Field
            label="Source URL"
            htmlFor={`${uid}-sourceUrl`}
            error={state.fieldErrors?.sourceUrl}
          >
            <Input
              id={`${uid}-sourceUrl`}
              name="sourceUrl"
              type="url"
              defaultValue={university.sourceUrl ?? ""}
            />
          </Field>
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipProviderEditForm({
  action,
  provider,
  countries,
}: {
  action: StateAction;
  provider: {
    id: string;
    name: string;
    type: string;
    countryId: string | null;
    websiteUrl: string | null;
    sourceUrl: string | null;
  };
  countries: Option[];
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save provider">
      {(state) => (
        <>
          <input type="hidden" name="id" value={provider.id} />

          <Field label="Name" htmlFor={`${uid}-name`} required error={state.fieldErrors?.name}>
            <Input
              id={`${uid}-name`}
              name="name"
              required
              defaultValue={provider.name}
              maxLength={300}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor={`${uid}-type`} required error={state.fieldErrors?.type}>
              <Select id={`${uid}-type`} name="type" required defaultValue={provider.type}>
                <option value="GOVERNMENT">Government</option>
                <option value="UNIVERSITY">University</option>
                <option value="PRIVATE">Private</option>
                <option value="FOUNDATION">Foundation</option>
                <option value="CHARITY">Charity</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>

            <Field
              label="Country"
              htmlFor={`${uid}-countryId`}
              error={state.fieldErrors?.countryId}
            >
              <Select
                id={`${uid}-countryId`}
                name="countryId"
                defaultValue={provider.countryId ?? ""}
              >
                <option value="">Not country-specific</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Website"
            htmlFor={`${uid}-websiteUrl`}
            error={state.fieldErrors?.websiteUrl}
          >
            <Input
              id={`${uid}-websiteUrl`}
              name="websiteUrl"
              type="url"
              defaultValue={provider.websiteUrl ?? ""}
            />
          </Field>

          <Field
            label="Source URL"
            htmlFor={`${uid}-sourceUrl`}
            error={state.fieldErrors?.sourceUrl}
          >
            <Input
              id={`${uid}-sourceUrl`}
              name="sourceUrl"
              type="url"
              defaultValue={provider.sourceUrl ?? ""}
            />
          </Field>
        </>
      )}
    </ChildForm>
  );
}

export function ProgrammeEditForm({
  action,
  programme,
  universities,
}: {
  action: StateAction;
  programme: {
    id: string;
    universityId: string;
    title: string;
    degreeLevel: string;
    durationMonths: number | null;
    officialUrl: string;
    sourceUrl: string | null;
    tuitionSummary: string | null;
  };
  universities: Option[];
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={programme.id} />

          <Field
            label="University"
            htmlFor={`${uid}-universityId`}
            required
            error={state.fieldErrors?.universityId}
          >
            <Select
              id={`${uid}-universityId`}
              name="universityId"
              required
              defaultValue={programme.universityId}
            >
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Title" htmlFor={`${uid}-title`} required error={state.fieldErrors?.title}>
            <Input
              id={`${uid}-title`}
              name="title"
              required
              defaultValue={programme.title}
              maxLength={300}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Degree level"
              htmlFor={`${uid}-degreeLevel`}
              required
              error={state.fieldErrors?.degreeLevel}
            >
              <Select
                id={`${uid}-degreeLevel`}
                name="degreeLevel"
                required
                defaultValue={programme.degreeLevel}
              >
                <option value="FOUNDATION">Foundation</option>
                <option value="UNDERGRADUATE">Undergraduate</option>
                <option value="POSTGRADUATE">Postgraduate</option>
              </Select>
            </Field>

            <Field
              label="Duration (months)"
              htmlFor={`${uid}-durationMonths`}
              error={state.fieldErrors?.durationMonths}
            >
              <Input
                id={`${uid}-durationMonths`}
                name="durationMonths"
                type="number"
                min={1}
                max={144}
                defaultValue={programme.durationMonths ?? ""}
              />
            </Field>
          </div>

          <Field
            label="Official URL"
            htmlFor={`${uid}-officialUrl`}
            required
            error={state.fieldErrors?.officialUrl}
          >
            <Input
              id={`${uid}-officialUrl`}
              name="officialUrl"
              type="url"
              required
              defaultValue={programme.officialUrl}
            />
          </Field>

          <Field
            label="Tuition summary"
            htmlFor={`${uid}-tuitionSummary`}
            error={state.fieldErrors?.tuitionSummary}
          >
            <Textarea
              id={`${uid}-tuitionSummary`}
              name="tuitionSummary"
              rows={2}
              maxLength={300}
              defaultValue={programme.tuitionSummary ?? ""}
            />
          </Field>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipEditForm({
  action,
  scholarship,
  providers,
  countries,
}: {
  action: StateAction;
  scholarship: {
    id: string;
    name: string;
    providerId: string;
    hostCountryId: string | null;
    degreeLevels: string[];
    officialUrl: string;
    sourceUrl: string | null;
    description: string | null;
  };
  providers: Option[];
  countries: Option[];
}) {
  const uid = useId();
  const levels: Array<[string, string]> = [
    ["FOUNDATION", "Foundation"],
    ["UNDERGRADUATE", "Undergraduate"],
    ["POSTGRADUATE", "Postgraduate"],
  ];
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={scholarship.id} />

          <Field label="Name" htmlFor={`${uid}-name`} required error={state.fieldErrors?.name}>
            <Input
              id={`${uid}-name`}
              name="name"
              required
              defaultValue={scholarship.name}
              maxLength={300}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Provider"
              htmlFor={`${uid}-providerId`}
              required
              error={state.fieldErrors?.providerId}
            >
              <Select
                id={`${uid}-providerId`}
                name="providerId"
                required
                defaultValue={scholarship.providerId}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Host country"
              htmlFor={`${uid}-hostCountryId`}
              error={state.fieldErrors?.hostCountryId}
            >
              <Select
                id={`${uid}-hostCountryId`}
                name="hostCountryId"
                defaultValue={scholarship.hostCountryId ?? ""}
              >
                <option value="">Not country-specific</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Degree levels"
            htmlFor={`${uid}-degreeLevels`}
            error={state.fieldErrors?.degreeLevels}
          >
            <select
              id={`${uid}-degreeLevels`}
              name="degreeLevels"
              multiple
              defaultValue={scholarship.degreeLevels}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
            >
              {levels.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Official URL"
            htmlFor={`${uid}-officialUrl`}
            required
            error={state.fieldErrors?.officialUrl}
          >
            <Input
              id={`${uid}-officialUrl`}
              name="officialUrl"
              type="url"
              required
              defaultValue={scholarship.officialUrl}
            />
          </Field>

          <Field
            label="Description"
            htmlFor={`${uid}-description`}
            error={state.fieldErrors?.description}
          >
            <Textarea
              id={`${uid}-description`}
              name="description"
              rows={3}
              maxLength={1000}
              defaultValue={scholarship.description ?? ""}
            />
          </Field>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function AdmissionRequirementEditForm({
  action,
  requirement,
  qualificationTypes,
  subjects,
  gradeScales,
}: {
  action: StateAction;
  requirement: {
    id: string;
    kind: string;
    label: string;
    description: string | null;
    qualificationTypeId: string | null;
    subjectId: string | null;
    gradeScaleId: string | null;
    minimumGradeLabel: string | null;
    minimumGradeRank: number | null;
    isMandatory: boolean;
    sourceUrl: string | null;
  };
  qualificationTypes: Option[];
  subjects: Option[];
  gradeScales: Option[];
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={requirement.id} />

          <Field label="Kind" htmlFor={`${uid}-kind`} required error={state.fieldErrors?.kind}>
            <Select id={`${uid}-kind`} name="kind" required defaultValue={requirement.kind}>
              {REQUIREMENT_KINDS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="How the source words it"
            htmlFor={`${uid}-label`}
            required
            error={state.fieldErrors?.label}
          >
            <Input
              id={`${uid}-label`}
              name="label"
              required
              maxLength={200}
              defaultValue={requirement.label}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Qualification type"
              htmlFor={`${uid}-qualificationTypeId`}
              error={state.fieldErrors?.qualificationTypeId}
            >
              <Select
                id={`${uid}-qualificationTypeId`}
                name="qualificationTypeId"
                defaultValue={requirement.qualificationTypeId ?? ""}
              >
                <option value="">Not tied to one</option>
                {qualificationTypes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Subject"
              htmlFor={`${uid}-subjectId`}
              error={state.fieldErrors?.subjectId}
            >
              <Select
                id={`${uid}-subjectId`}
                name="subjectId"
                defaultValue={requirement.subjectId ?? ""}
              >
                <option value="">Not tied to one</option>
                {subjects.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Grade scale"
              htmlFor={`${uid}-gradeScaleId`}
              error={state.fieldErrors?.gradeScaleId}
            >
              <Select
                id={`${uid}-gradeScaleId`}
                name="gradeScaleId"
                defaultValue={requirement.gradeScaleId ?? ""}
              >
                <option value="">Not tied to one</option>
                {gradeScales.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Minimum grade as written"
              htmlFor={`${uid}-minimumGradeLabel`}
              error={state.fieldErrors?.minimumGradeLabel}
            >
              <Input
                id={`${uid}-minimumGradeLabel`}
                name="minimumGradeLabel"
                maxLength={40}
                defaultValue={requirement.minimumGradeLabel ?? ""}
              />
            </Field>

            <Field
              label="Minimum grade rank"
              htmlFor={`${uid}-minimumGradeRank`}
              error={state.fieldErrors?.minimumGradeRank}
            >
              <Input
                id={`${uid}-minimumGradeRank`}
                name="minimumGradeRank"
                type="number"
                min={0}
                max={1000}
                defaultValue={requirement.minimumGradeRank ?? ""}
              />
            </Field>
          </div>

          <Field
            label="Notes"
            htmlFor={`${uid}-description`}
            error={state.fieldErrors?.description}
          >
            <Textarea
              id={`${uid}-description`}
              name="description"
              rows={2}
              maxLength={1000}
              defaultValue={requirement.description ?? ""}
            />
          </Field>

          <Checkbox
            id={`${uid}-isMandatory`}
            name="isMandatory"
            label="Mandatory"
            description="Untick only if the source says this condition is optional."
            defaultChecked={requirement.isMandatory}
          />

          <Field
            label="Source URL"
            htmlFor={`${uid}-sourceUrl`}
            error={state.fieldErrors?.sourceUrl}
          >
            <Input
              id={`${uid}-sourceUrl`}
              name="sourceUrl"
              type="url"
              required
              defaultValue={requirement.sourceUrl ?? ""}
            />
          </Field>
        </>
      )}
    </ChildForm>
  );
}

export function LanguageRequirementEditForm({
  action,
  requirement,
}: {
  action: StateAction;
  requirement: {
    id: string;
    testCode: string;
    minimumScore: string;
    scaleNote: string | null;
    isMandatory: boolean;
    sourceUrl: string | null;
  };
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={requirement.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Test code"
              htmlFor={`${uid}-testCode`}
              required
              error={state.fieldErrors?.testCode}
            >
              <Input
                id={`${uid}-testCode`}
                name="testCode"
                required
                maxLength={20}
                defaultValue={requirement.testCode}
              />
            </Field>

            <Field
              label="Minimum score"
              htmlFor={`${uid}-minimumScore`}
              required
              error={state.fieldErrors?.minimumScore}
            >
              <Input
                id={`${uid}-minimumScore`}
                name="minimumScore"
                required
                maxLength={20}
                defaultValue={requirement.minimumScore}
              />
            </Field>
          </div>

          <Field
            label="Scale note"
            htmlFor={`${uid}-scaleNote`}
            error={state.fieldErrors?.scaleNote}
          >
            <Input
              id={`${uid}-scaleNote`}
              name="scaleNote"
              maxLength={120}
              defaultValue={requirement.scaleNote ?? ""}
            />
          </Field>

          <Checkbox
            id={`${uid}-isMandatory`}
            name="isMandatory"
            label="Mandatory"
            description="Untick when the source offers a waiver or alternative."
            defaultChecked={requirement.isMandatory}
          />

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function ProgrammeDeadlineEditForm({
  action,
  deadline,
}: {
  action: StateAction;
  deadline: {
    id: string;
    label: string;
    intake: string | null;
    opensAt: Date | string | null;
    closesAt: Date | string | null;
    timezone: string;
    sourceUrl: string | null;
  };
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={deadline.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" htmlFor={`${uid}-label`} required error={state.fieldErrors?.label}>
              <Input
                id={`${uid}-label`}
                name="label"
                required
                maxLength={160}
                defaultValue={deadline.label}
              />
            </Field>

            <Field label="Intake" htmlFor={`${uid}-intake`} error={state.fieldErrors?.intake}>
              <Input
                id={`${uid}-intake`}
                name="intake"
                maxLength={80}
                defaultValue={deadline.intake ?? ""}
              />
            </Field>

            <Field label="Opens" htmlFor={`${uid}-opensAt`} error={state.fieldErrors?.opensAt}>
              <Input
                id={`${uid}-opensAt`}
                name="opensAt"
                type="datetime-local"
                defaultValue={toLocalInput(deadline.opensAt)}
              />
            </Field>

            <Field label="Closes" htmlFor={`${uid}-closesAt`} error={state.fieldErrors?.closesAt}>
              <Input
                id={`${uid}-closesAt`}
                name="closesAt"
                type="datetime-local"
                defaultValue={toLocalInput(deadline.closesAt)}
              />
            </Field>

            <Field label="Timezone" htmlFor={`${uid}-timezone`} error={state.fieldErrors?.timezone}>
              <Input
                id={`${uid}-timezone`}
                name="timezone"
                maxLength={60}
                defaultValue={deadline.timezone}
              />
            </Field>
          </div>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function TuitionFeeEditForm({
  action,
  fee,
}: {
  action: StateAction;
  fee: {
    id: string;
    amount: number | string | { toString(): string } | null;
    currencyCode: string;
    period: string;
    isInternational: boolean;
    notes: string | null;
    sourceUrl: string | null;
  };
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={fee.id} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Amount" htmlFor={`${uid}-amount`} error={state.fieldErrors?.amount}>
              <Input
                id={`${uid}-amount`}
                name="amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={fee.amount?.toString() ?? ""}
              />
            </Field>

            <Field
              label="Currency"
              htmlFor={`${uid}-currencyCode`}
              required
              error={state.fieldErrors?.currencyCode}
            >
              <Input
                id={`${uid}-currencyCode`}
                name="currencyCode"
                required
                maxLength={3}
                defaultValue={fee.currencyCode}
              />
            </Field>

            <Field label="Period" htmlFor={`${uid}-period`} error={state.fieldErrors?.period}>
              <Input id={`${uid}-period`} name="period" maxLength={20} defaultValue={fee.period} />
            </Field>
          </div>

          <Checkbox
            id={`${uid}-isInternational`}
            name="isInternational"
            label="International rate"
            description="Untick when this is the home or EU rate."
            defaultChecked={fee.isInternational}
          />

          <Field label="Notes" htmlFor={`${uid}-notes`} error={state.fieldErrors?.notes}>
            <Textarea
              id={`${uid}-notes`}
              name="notes"
              rows={2}
              maxLength={300}
              defaultValue={fee.notes ?? ""}
            />
          </Field>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipEligibilityRuleEditForm({
  action,
  rule,
}: {
  action: StateAction;
  rule: {
    id: string;
    kind: string;
    label: string;
    valueString: string | null;
    minValue: number | null;
    isMandatory: boolean;
    sourceUrl: string | null;
  };
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={rule.id} />

          <Field label="Kind" htmlFor={`${uid}-kind`} required error={state.fieldErrors?.kind}>
            <Select id={`${uid}-kind`} name="kind" required defaultValue={rule.kind}>
              {REQUIREMENT_KINDS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="How the source words it"
            htmlFor={`${uid}-label`}
            required
            error={state.fieldErrors?.label}
          >
            <Input
              id={`${uid}-label`}
              name="label"
              required
              maxLength={200}
              defaultValue={rule.label}
            />
          </Field>

          <Field
            label="Value"
            htmlFor={`${uid}-valueString`}
            error={state.fieldErrors?.valueString}
          >
            <Input
              id={`${uid}-valueString`}
              name="valueString"
              maxLength={300}
              defaultValue={rule.valueString ?? ""}
            />
          </Field>

          <Field
            label="Minimum value"
            htmlFor={`${uid}-minValue`}
            error={state.fieldErrors?.minValue}
          >
            <Input
              id={`${uid}-minValue`}
              name="minValue"
              type="number"
              step="1"
              defaultValue={rule.minValue ?? ""}
            />
          </Field>

          <Checkbox
            id={`${uid}-isMandatory`}
            name="isMandatory"
            label="Mandatory"
            description="Untick when the source describes a preference rather than a condition."
            defaultChecked={rule.isMandatory}
          />

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipFundingComponentEditForm({
  action,
  component,
}: {
  action: StateAction;
  component: {
    id: string;
    component: string;
    coverage: string;
    amount: number | string | { toString(): string } | null;
    currencyCode: string | null;
    description: string | null;
    isSpecified: boolean;
    sourceUrl: string | null;
  };
}) {
  const uid = useId();
  const label =
    FUNDING_COMPONENTS.find(([value]) => value === component.component)?.[1] ?? component.component;
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={component.id} />
          <p className="text-xs text-ink-soft">
            Component: <span className="font-medium text-ink">{label}</span> (archive and recreate
            to change which component this is)
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Coverage" htmlFor={`${uid}-coverage`} error={state.fieldErrors?.coverage}>
              <Select id={`${uid}-coverage`} name="coverage" defaultValue={component.coverage}>
                {COVERAGE.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Amount" htmlFor={`${uid}-amount`} error={state.fieldErrors?.amount}>
              <Input
                id={`${uid}-amount`}
                name="amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={component.amount?.toString() ?? ""}
              />
            </Field>

            <Field
              label="Currency"
              htmlFor={`${uid}-currencyCode`}
              error={state.fieldErrors?.currencyCode}
            >
              <Input
                id={`${uid}-currencyCode`}
                name="currencyCode"
                maxLength={3}
                defaultValue={component.currencyCode ?? ""}
              />
            </Field>
          </div>

          <Field
            label="Notes"
            htmlFor={`${uid}-description`}
            error={state.fieldErrors?.description}
          >
            <Textarea
              id={`${uid}-description`}
              name="description"
              rows={2}
              maxLength={300}
              defaultValue={component.description ?? ""}
            />
          </Field>

          <Field
            label="Source URL"
            htmlFor={`${uid}-sourceUrl`}
            error={state.fieldErrors?.sourceUrl}
          >
            <Input
              id={`${uid}-sourceUrl`}
              name="sourceUrl"
              type="url"
              defaultValue={component.sourceUrl ?? ""}
            />
          </Field>

          <Checkbox
            id={`${uid}-isSpecified`}
            name="isSpecified"
            label="The source states this component"
            description="Leave unticked when the page is silent. An unspecified component is not money."
            defaultChecked={component.isSpecified}
          />
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipDeadlineEditForm({
  action,
  deadline,
}: {
  action: StateAction;
  deadline: {
    id: string;
    label: string;
    opensAt: Date | string | null;
    closesAt: Date | string | null;
    timezone: string;
    sourceUrl: string | null;
  };
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Save changes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={deadline.id} />

          <Field label="Label" htmlFor={`${uid}-label`} required error={state.fieldErrors?.label}>
            <Input
              id={`${uid}-label`}
              name="label"
              required
              maxLength={160}
              defaultValue={deadline.label}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opens" htmlFor={`${uid}-opensAt`} error={state.fieldErrors?.opensAt}>
              <Input
                id={`${uid}-opensAt`}
                name="opensAt"
                type="datetime-local"
                defaultValue={toLocalInput(deadline.opensAt)}
              />
            </Field>

            <Field label="Closes" htmlFor={`${uid}-closesAt`} error={state.fieldErrors?.closesAt}>
              <Input
                id={`${uid}-closesAt`}
                name="closesAt"
                type="datetime-local"
                defaultValue={toLocalInput(deadline.closesAt)}
              />
            </Field>

            <Field label="Timezone" htmlFor={`${uid}-timezone`} error={state.fieldErrors?.timezone}>
              <Input
                id={`${uid}-timezone`}
                name="timezone"
                maxLength={60}
                defaultValue={deadline.timezone}
              />
            </Field>
          </div>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}
