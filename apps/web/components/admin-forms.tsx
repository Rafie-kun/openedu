"use client";

import { useActionState } from "react";
import { Button, Callout, Field, Input, Textarea } from "@openedu/ui";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

type StateAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function PromoteCandidateForm({
  action,
  reviewId,
  draft,
}: {
  action: StateAction;
  reviewId: string;
  draft: { name: string; city: string; countryCode: string; websiteUrl: string };
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const values = state.values ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reviewId" value={reviewId} />
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}

      <Field
        label="Institution name"
        htmlFor="name"
        required
        error={state.fieldErrors?.name}
        hint="As it appears on the institution's own site."
      >
        <Input
          id="name"
          name="name"
          required
          maxLength={400}
          defaultValue={values.name ?? draft.name}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="city" required error={state.fieldErrors?.city}>
          <Input
            id="city"
            name="city"
            required
            maxLength={120}
            defaultValue={values.city ?? draft.city}
          />
        </Field>

        <Field
          label="Country code"
          htmlFor="countryCode"
          required
          error={state.fieldErrors?.countryCode}
          hint="Two letters, and it has to be in the country table already."
        >
          <Input
            id="countryCode"
            name="countryCode"
            required
            maxLength={2}
            defaultValue={values.countryCode ?? draft.countryCode}
          />
        </Field>
      </div>

      <Field
        label="Official website"
        htmlFor="websiteUrl"
        required
        error={state.fieldErrors?.websiteUrl}
        hint="Also used to catch duplicates."
      >
        <Input
          id="websiteUrl"
          name="websiteUrl"
          required
          type="url"
          defaultValue={values.websiteUrl ?? draft.websiteUrl}
        />
      </Field>

      <Field label="Note" htmlFor="note" hint="Stored on the review item.">
        <Textarea id="note" name="note" rows={2} maxLength={1000} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add as unverified institution"}
      </Button>
    </form>
  );
}

export function ReviewDecisionForm({
  action,
  reviewId,
  label,
  variant = "secondary",
  placeholder,
}: {
  action: StateAction;
  reviewId: string;
  label: string;
  variant?: "primary" | "secondary";
  placeholder?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}
      <Field label="Note" htmlFor={`note-${reviewId}`} hint={placeholder}>
        <Textarea id={`note-${reviewId}`} name="note" rows={2} maxLength={1000} />
      </Field>
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? "Saving..." : label}
      </Button>
    </form>
  );
}
