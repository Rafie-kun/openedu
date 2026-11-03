"use client";

import { useActionState } from "react";
import { Button, Callout, Field, Input, Select } from "@edubuf/ui";
import { COST_CATEGORY_LABELS } from "@edubuf/shared";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms";

type StateAction = (state: FormState, formData: FormData) => Promise<FormState>;

const FREQUENCIES = [
  ["MONTHLY", "Per month"],
  ["YEARLY", "Per year"],
  ["ONE_TIME", "One time"],
] as const;

export function NewBudgetPlanForm({
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
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}

      <Field label="Plan name" htmlFor="plan-title" required hint="Private to you.">
        <Input id="plan-title" name="title" required maxLength={120} placeholder="e.g. Netherlands, BSc year one" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Destination (optional)" htmlFor="plan-country">
          <Select id="plan-country" name="targetCountryId" defaultValue="">
            <option value="">Not set</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Plan currency" htmlFor="plan-currency" hint="ISO 4217, e.g. EUR">
          <Input id="plan-currency" name="currencyCode" maxLength={3} defaultValue="USD" required />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create plan"}
      </Button>
    </form>
  );
}

export function AddBudgetItemForm({
  action,
  budgetPlanId,
  defaultCurrency,
}: {
  action: StateAction;
  budgetPlanId: string;
  defaultCurrency: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="budgetPlanId" value={budgetPlanId} />
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      {state.success ? <Callout tone="success">{state.success}</Callout> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor={`item-category-${budgetPlanId}`} required>
          <Select id={`item-category-${budgetPlanId}`} name="category" defaultValue="TUITION">
            {Object.entries(COST_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Label" htmlFor={`item-label-${budgetPlanId}`} required>
          <Input
            id={`item-label-${budgetPlanId}`}
            name="label"
            required
            maxLength={120}
            placeholder="e.g. Room in shared flat"
          />
        </Field>

        <Field label="Amount" htmlFor={`item-amount-${budgetPlanId}`} required>
          <Input
            id={`item-amount-${budgetPlanId}`}
            name="amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            required
          />
        </Field>

        <Field label="Currency" htmlFor={`item-currency-${budgetPlanId}`} required>
          <Input
            id={`item-currency-${budgetPlanId}`}
            name="currencyCode"
            maxLength={3}
            defaultValue={defaultCurrency}
            required
          />
        </Field>

        <Field label="How often" htmlFor={`item-frequency-${budgetPlanId}`} required>
          <Select id={`item-frequency-${budgetPlanId}`} name="frequency" defaultValue="MONTHLY">
            {FREQUENCIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Adding…" : "Add cost"}
      </Button>
    </form>
  );
}
