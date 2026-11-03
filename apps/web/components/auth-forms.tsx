"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input, Checkbox, Callout } from "@openedu/ui";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function RegisterForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}

      <Field
        label="Name"
        htmlFor="displayName"
        required
        error={state.fieldErrors?.displayName}
        hint="How you want to be addressed in your workspace."
      >
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          required
          maxLength={80}
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
        />
      </Field>

      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        error={state.fieldErrors?.password}
        hint="At least 10 characters. A passphrase of a few words works well."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      <div className="space-y-3 rounded-md border border-line bg-paper/60 p-3">
        <Checkbox
          id="acceptTerms"
          name="acceptTerms"
          label="I accept the terms of service"
          description="Read them first — they are short and honest about what this platform cannot do."
        />
        <Checkbox
          id="acceptPrivacy"
          name="acceptPrivacy"
          label="I have read the privacy notice"
          description="Your grades and profile stay private to your account."
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating your account…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="quiet-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ action, next }: { action: Action; next?: string }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-ink-soft">
        New here?{" "}
        <Link href="/register" className="quiet-link">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}
