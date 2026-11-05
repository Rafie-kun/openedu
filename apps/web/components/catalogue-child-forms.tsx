"use client";

import { useActionState, useId, type ReactNode } from "react";
import { Button, Callout, Checkbox, Field, Input, Select, Textarea } from "@openedu/ui";
import { FUNDING_COMPONENT_LABELS, REQUIREMENT_KIND_LABELS } from "@openedu/shared";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

type StateAction = (state: FormState, formData: FormData) => Promise<FormState>;
type Option = { id: string; name: string };

const REQUIREMENT_KINDS = Object.entries(REQUIREMENT_KIND_LABELS) as Array<[string, string]>;
const FUNDING_COMPONENTS = Object.entries(FUNDING_COMPONENT_LABELS) as Array<[string, string]>;
const COVERAGE = [
  ["FULL", "Full"],
  ["PARTIAL", "Partial"],
  ["FIXED_AMOUNT", "Fixed amount"],
  ["UNSPECIFIED", "Not specified"],
] as const;

function ChildForm({
  action,
  submitLabel,
  children,
}: {
  action: StateAction;
  submitLabel: string;
  children: (state: FormState) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}
      {children(state)}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function SourceField({ id, error }: { id: string; error: string | undefined }) {
  return (
    <Field
      label="Source you checked"
      htmlFor={id}
      required
      error={error}
      hint="The page that states this. It is shown next to the record."
    >
      <Input id={id} name="sourceUrl" type="url" required placeholder="https://" />
    </Field>
  );
}

export function AdmissionRequirementForm({
  action,
  programmeId,
  qualificationTypes,
  subjects,
  gradeScales,
}: {
  action: StateAction;
  programmeId: string;
  qualificationTypes: Option[];
  subjects: Option[];
  gradeScales: Option[];
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Add requirement">
      {(state) => (
        <>
          <input type="hidden" name="programmeId" value={programmeId} />

          <Field label="Kind" htmlFor={`${uid}-kind`} required error={state.fieldErrors?.kind}>
            <Select id={`${uid}-kind`} name="kind" required defaultValue="QUALIFICATION">
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
            hint="Shown to students. Do not paraphrase into something stronger."
          >
            <Input id={`${uid}-label`} name="label" required maxLength={200} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Qualification type"
              htmlFor={`${uid}-qualificationTypeId`}
              error={state.fieldErrors?.qualificationTypeId}
            >
              <Select id={`${uid}-qualificationTypeId`} name="qualificationTypeId" defaultValue="">
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
              <Select id={`${uid}-subjectId`} name="subjectId" defaultValue="">
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
              <Select id={`${uid}-gradeScaleId`} name="gradeScaleId" defaultValue="">
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
              <Input id={`${uid}-minimumGradeLabel`} name="minimumGradeLabel" maxLength={40} />
            </Field>

            <Field
              label="Minimum grade rank"
              htmlFor={`${uid}-minimumGradeRank`}
              error={state.fieldErrors?.minimumGradeRank}
              hint="The scale's own rank for that grade. Leave empty if you cannot map it."
            >
              <Input
                id={`${uid}-minimumGradeRank`}
                name="minimumGradeRank"
                type="number"
                min={0}
                max={1000}
              />
            </Field>
          </div>

          <Field
            label="Notes"
            htmlFor={`${uid}-description`}
            error={state.fieldErrors?.description}
          >
            <Textarea id={`${uid}-description`} name="description" rows={2} maxLength={1000} />
          </Field>

          <Checkbox
            id={`${uid}-isMandatory`}
            name="isMandatory"
            label="Mandatory"
            description="Untick only if the source says this condition is optional."
            defaultChecked
          />

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function LanguageRequirementForm({
  action,
  programmeId,
}: {
  action: StateAction;
  programmeId: string;
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Add language condition">
      {(state) => (
        <>
          <input type="hidden" name="programmeId" value={programmeId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Test code"
              htmlFor={`${uid}-testCode`}
              required
              error={state.fieldErrors?.testCode}
              hint="IELTS, TOEFL, PTE, Duolingo, or the institution's own test name."
            >
              <Input id={`${uid}-testCode`} name="testCode" required maxLength={20} />
            </Field>

            <Field
              label="Minimum score"
              htmlFor={`${uid}-minimumScore`}
              required
              error={state.fieldErrors?.minimumScore}
              hint="Exactly as written, for example 6.5 or 90."
            >
              <Input id={`${uid}-minimumScore`} name="minimumScore" required maxLength={20} />
            </Field>
          </div>

          <Field
            label="Scale note"
            htmlFor={`${uid}-scaleNote`}
            error={state.fieldErrors?.scaleNote}
            hint="Anything the source adds, such as no band below 6.0."
          >
            <Input id={`${uid}-scaleNote`} name="scaleNote" maxLength={120} />
          </Field>

          <Checkbox
            id={`${uid}-isMandatory`}
            name="isMandatory"
            label="Mandatory"
            description="Untick when the source offers a waiver or alternative."
            defaultChecked
          />

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function ProgrammeDeadlineForm({
  action,
  programmeId,
}: {
  action: StateAction;
  programmeId: string;
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Add deadline">
      {(state) => (
        <>
          <input type="hidden" name="programmeId" value={programmeId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Label"
              htmlFor={`${uid}-label`}
              required
              error={state.fieldErrors?.label}
              hint="Round 1, autumn intake, scholarship consideration."
            >
              <Input id={`${uid}-label`} name="label" required maxLength={160} />
            </Field>

            <Field label="Intake" htmlFor={`${uid}-intake`} error={state.fieldErrors?.intake}>
              <Input id={`${uid}-intake`} name="intake" maxLength={80} />
            </Field>

            <Field label="Opens" htmlFor={`${uid}-opensAt`} error={state.fieldErrors?.opensAt}>
              <Input id={`${uid}-opensAt`} name="opensAt" type="datetime-local" />
            </Field>

            <Field label="Closes" htmlFor={`${uid}-closesAt`} error={state.fieldErrors?.closesAt}>
              <Input id={`${uid}-closesAt`} name="closesAt" type="datetime-local" />
            </Field>

            <Field
              label="Timezone"
              htmlFor={`${uid}-timezone`}
              error={state.fieldErrors?.timezone}
              hint="IANA name, for example Europe/London."
            >
              <Input id={`${uid}-timezone`} name="timezone" defaultValue="UTC" maxLength={60} />
            </Field>
          </div>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function TuitionFeeForm({
  action,
  programmeId,
}: {
  action: StateAction;
  programmeId: string;
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Add fee">
      {(state) => (
        <>
          <input type="hidden" name="programmeId" value={programmeId} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Amount"
              htmlFor={`${uid}-amount`}
              error={state.fieldErrors?.amount}
              hint="Leave empty when only a range is published."
            >
              <Input id={`${uid}-amount`} name="amount" type="number" min={0} step="0.01" />
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
                placeholder="GBP"
              />
            </Field>

            <Field
              label="Period"
              htmlFor={`${uid}-period`}
              error={state.fieldErrors?.period}
              hint="YEAR, SEMESTER, MONTH or TOTAL."
            >
              <Input id={`${uid}-period`} name="period" defaultValue="YEAR" maxLength={20} />
            </Field>
          </div>

          <Checkbox
            id={`${uid}-isInternational`}
            name="isInternational"
            label="International rate"
            description="Untick when this is the home or EU rate."
            defaultChecked
          />

          <Field label="Notes" htmlFor={`${uid}-notes`} error={state.fieldErrors?.notes}>
            <Textarea id={`${uid}-notes`} name="notes" rows={2} maxLength={300} />
          </Field>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipEligibilityRuleForm({
  action,
  scholarshipId,
}: {
  action: StateAction;
  scholarshipId: string;
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Add eligibility condition">
      {(state) => (
        <>
          <input type="hidden" name="scholarshipId" value={scholarshipId} />

          <Field label="Kind" htmlFor={`${uid}-kind`} required error={state.fieldErrors?.kind}>
            <Select id={`${uid}-kind`} name="kind" required defaultValue="NATIONALITY">
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
            <Input id={`${uid}-label`} name="label" required maxLength={200} />
          </Field>

          <Field
            label="Value"
            htmlFor={`${uid}-valueString`}
            error={state.fieldErrors?.valueString}
            hint="Comma-separated ISO country codes for nationality or residence, a degree level, or a financial-need band."
          >
            <Input id={`${uid}-valueString`} name="valueString" maxLength={300} />
          </Field>

          <Field
            label="Minimum value"
            htmlFor={`${uid}-minValue`}
            error={state.fieldErrors?.minValue}
            hint="Only for a grade condition, using the scale's own rank."
          >
            <Input id={`${uid}-minValue`} name="minValue" type="number" step="1" />
          </Field>

          <Checkbox
            id={`${uid}-isMandatory`}
            name="isMandatory"
            label="Mandatory"
            description="Untick when the source describes a preference rather than a condition."
            defaultChecked
          />

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipFundingForm({
  action,
  scholarshipId,
}: {
  action: StateAction;
  scholarshipId: string;
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Add funding component">
      {(state) => (
        <>
          <input type="hidden" name="scholarshipId" value={scholarshipId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Component"
              htmlFor={`${uid}-component`}
              required
              error={state.fieldErrors?.component}
            >
              <Select id={`${uid}-component`} name="component" required defaultValue="TUITION">
                {FUNDING_COMPONENTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Coverage" htmlFor={`${uid}-coverage`} error={state.fieldErrors?.coverage}>
              <Select id={`${uid}-coverage`} name="coverage" defaultValue="UNSPECIFIED">
                {COVERAGE.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Amount" htmlFor={`${uid}-amount`} error={state.fieldErrors?.amount}>
              <Input id={`${uid}-amount`} name="amount" type="number" min={0} step="0.01" />
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
                placeholder="EUR"
              />
            </Field>
          </div>

          <Field
            label="Notes"
            htmlFor={`${uid}-description`}
            error={state.fieldErrors?.description}
          >
            <Textarea id={`${uid}-description`} name="description" rows={2} maxLength={300} />
          </Field>

          <Checkbox
            id={`${uid}-isSpecified`}
            name="isSpecified"
            label="The source states this component"
            description="Leave unticked when the page is silent. An unspecified component is not money."
          />
        </>
      )}
    </ChildForm>
  );
}

export function ScholarshipDeadlineForm({
  action,
  scholarshipId,
}: {
  action: StateAction;
  scholarshipId: string;
}) {
  const uid = useId();
  return (
    <ChildForm action={action} submitLabel="Add deadline">
      {(state) => (
        <>
          <input type="hidden" name="scholarshipId" value={scholarshipId} />

          <Field label="Label" htmlFor={`${uid}-label`} required error={state.fieldErrors?.label}>
            <Input id={`${uid}-label`} name="label" required maxLength={160} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opens" htmlFor={`${uid}-opensAt`} error={state.fieldErrors?.opensAt}>
              <Input id={`${uid}-opensAt`} name="opensAt" type="datetime-local" />
            </Field>

            <Field label="Closes" htmlFor={`${uid}-closesAt`} error={state.fieldErrors?.closesAt}>
              <Input id={`${uid}-closesAt`} name="closesAt" type="datetime-local" />
            </Field>

            <Field
              label="Timezone"
              htmlFor={`${uid}-timezone`}
              error={state.fieldErrors?.timezone}
              hint="IANA name, for example Europe/Berlin."
            >
              <Input id={`${uid}-timezone`} name="timezone" defaultValue="UTC" maxLength={60} />
            </Field>
          </div>

          <SourceField id={`${uid}-sourceUrl`} error={state.fieldErrors?.sourceUrl} />
        </>
      )}
    </ChildForm>
  );
}
