"use client";

import { useActionState } from "react";
import { Button, Callout, Field, Input, Select, Textarea, Checkbox } from "@openedu/ui";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_ORDER } from "@openedu/shared";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

type StateAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function NewApplicationForm({
  action,
  programmes,
  scholarships,
  defaultProgrammeId = "",
  defaultScholarshipId = "",
}: {
  action: StateAction;
  programmes: Array<{ id: string; label: string }>;
  scholarships: Array<{ id: string; label: string }>;
  defaultProgrammeId?: string;
  defaultScholarshipId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}

      <Field
        label="What are you tracking?"
        htmlFor="title"
        required
        hint="Your own label. It stays private."
      >
        <Input
          id="title"
          name="title"
          required
          maxLength={160}
          placeholder="e.g. BSc CS at ETH — main round"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Programme (optional)" htmlFor="programmeId">
          <Select id="programmeId" name="programmeId" defaultValue={defaultProgrammeId}>
            <option value="">Not linked</option>
            {programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Scholarship (optional)" htmlFor="scholarshipId">
          <Select id="scholarshipId" name="scholarshipId" defaultValue={defaultScholarshipId}>
            <option value="">Not linked</option>
            {scholarships.map((scholarship) => (
              <option key={scholarship.id} value={scholarship.id}>
                {scholarship.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Deadline"
          htmlFor="deadline"
          hint="Only as you understand it. OpenEdu does not invent one."
        >
          <Input id="deadline" name="deadline" type="date" />
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue="INTERESTED">
            {APPLICATION_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Application fee" htmlFor="feeAmount">
          <Input
            id="feeAmount"
            name="feeAmount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
          />
        </Field>

        <Field label="Fee currency" htmlFor="feeCurrency">
          <Input
            id="feeCurrency"
            name="feeCurrency"
            maxLength={3}
            placeholder="e.g. EUR"
            defaultValue=""
          />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add to tracker"}
      </Button>
    </form>
  );
}

export function StatusForm({
  action,
  applicationId,
  current,
}: {
  action: (formData: FormData) => Promise<void>;
  applicationId: string;
  current: string;
}) {
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div>
        <label htmlFor="status" className="mb-1 block text-xs font-medium text-ink-soft">
          Move to
        </label>
        <Select id="status" name="status" defaultValue={current} className="w-52">
          {APPLICATION_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary">
        Update status
      </Button>
    </form>
  );
}

export function NoteForm({
  action,
  applicationId,
}: {
  action: (formData: FormData) => Promise<void>;
  applicationId: string;
}) {
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <label htmlFor="body" className="block text-xs font-medium text-ink-soft">
        Private note
      </label>
      <Textarea id="body" name="body" required minLength={2} maxLength={4000} rows={3} />
      <Button type="submit" variant="secondary" size="sm">
        Add note
      </Button>
    </form>
  );
}

export function PasswordChangeForm({ action }: { action: StateAction }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}
      <Field label="Current password" htmlFor="currentPassword" required>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field label="New password" htmlFor="newPassword" required hint="At least 10 characters.">
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </Field>
      <Field label="Repeat new password" htmlFor="confirmPassword" required>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Changing…" : "Change password"}
      </Button>
      <p className="text-xs text-ink-soft">Changing your password signs out every other session.</p>
    </form>
  );
}

export function DeleteAccountForm({ action }: { action: StateAction }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field label="Type DELETE to confirm" htmlFor="confirmation" required>
        <Input id="confirmation" name="confirmation" required pattern="DELETE" autoComplete="off" />
      </Field>
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Deleting…" : "Delete my account"}
      </Button>
      <p className="text-xs text-ink-soft">
        This removes your profile, qualifications, saved items, applications and notes. Audit
        entries keep the action but no longer point at your account.
      </p>
    </form>
  );
}

export function NotificationPreferencesForm({
  action,
  initial,
}: {
  action: StateAction;
  initial: { email: boolean; deadlineReminders: boolean; dataChangeAlerts: boolean };
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  return (
    <form action={formAction} className="space-y-3">
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      <Checkbox
        id="email"
        name="email"
        label="Email notifications"
        description="Requires a configured email provider. In-app notifications always work."
        defaultChecked={initial.email}
      />
      <Checkbox
        id="deadlineReminders"
        name="deadlineReminders"
        label="Deadline reminders"
        description="Only for deadlines you entered yourself."
        defaultChecked={initial.deadlineReminders}
      />
      <Checkbox
        id="dataChangeAlerts"
        name="dataChangeAlerts"
        label="Saved-record changes"
        description="When a saved programme or scholarship is rechecked or reclassified."
        defaultChecked={initial.dataChangeAlerts}
      />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
