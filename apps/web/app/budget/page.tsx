import type { Metadata } from "next";
import {
  Badge,
  Callout,
  Card,
  EmptyState,
  LinkButton,
  Provenance,
  SectionHeading,
  Window,
} from "@openedu/ui";
import { COST_BASIS_LABELS, COST_CATEGORY_LABELS, formatDate, formatMoney } from "@openedu/shared";
import { db } from "@openedu/database";
import {
  addBudgetItemAction,
  copyCostEstimateAction,
  createBudgetPlanAction,
  deleteBudgetItemAction,
  deleteBudgetPlanAction,
} from "@/app/actions/budget";
import { AddBudgetItemForm, NewBudgetPlanForm } from "@/components/budget-forms";
import { getOrCreateProfile, listCountries } from "@/lib/student";
import { requireUser } from "@/lib/session";
import { toVerificationStatus } from "@/lib/display";
import { convertAmount, getRates, SUPPORTED_CURRENCIES } from "@/lib/exchange-rates";

export const metadata: Metadata = { title: "Budget planner" };
export const dynamic = "force-dynamic";

const FREQUENCY_LABELS = {
  MONTHLY: "per month",
  YEARLY: "per year",
  ONE_TIME: "one time",
} as const;

const PERIOD_LABELS: Record<string, string> = {
  MONTH: "per month",
  YEAR: "per year",
  ONE_TIME: "one time",
};

interface Totals {
  monthly: number;
  yearly: number;
  oneTime: number;
}

function addToTotals(totals: Totals, amount: number, frequency: string) {
  if (frequency === "MONTHLY") {
    totals.monthly += amount;
    totals.yearly += amount * 12;
  } else if (frequency === "YEARLY") {
    totals.yearly += amount;
  } else {
    totals.oneTime += amount;
  }
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ display?: string }>;
}) {
  const user = await requireUser("/budget");
  const profile = await getOrCreateProfile(user.id);
  const requested = (await searchParams).display?.toUpperCase();
  const displayCode =
    requested && (SUPPORTED_CURRENCIES as readonly string[]).includes(requested)
      ? requested
      : "USD";

  const [plans, countries, publishedCosts, rates] = await Promise.all([
    db.budgetPlan.findMany({
      where: { profileId: profile.id },
      include: {
        items: { orderBy: [{ frequency: "asc" }, { category: "asc" }] },
        programme: { select: { title: true, university: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    listCountries(),
    db.costEstimate.findMany({
      where: { verificationStatus: { not: "ARCHIVED" } },
      include: { country: { select: { name: true } } },
      orderBy: [{ country: { name: "asc" } }, { category: "asc" }],
      take: 100,
    }),
    getRates(displayCode),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="workspace"
        title="Budget planner"
        actions={
          <LinkButton href="/visas" variant="secondary" size="sm">
            Visa costs
          </LinkButton>
        }
      >
        Your own numbers, kept separate from published ones. Totals stay in the currency you entered
        and can be shown in another currency using a dated reference rate. A conversion is an
        estimate, not the rate your bank will use.
      </SectionHeading>

      <Callout tone="info" title="Three kinds of number">
        A university-published fee, a government cost-of-living estimate and your own guess are not
        the same evidence. Each line records which one it is, and a published figure keeps its
        source link.
      </Callout>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-lg text-ink">Reference exchange rates</h2>
            {rates ? (
              <p className="mt-1 text-sm text-ink-soft">
                {rates.source} · {rates.base} · rate date{" "}
                {formatDate(`${rates.rateDate}T00:00:00Z`)}
                {rates.stale ? " · the latest fetch failed, so these may be older" : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">
                No rate is available right now. Totals stay in their original currency.
              </p>
            )}
          </div>
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="display" className="mb-1 block text-xs font-medium text-ink-soft">
                Show conversions in
              </label>
              <select
                id="display"
                name="display"
                defaultValue={displayCode}
                className="rounded border border-line bg-panel px-2 py-1.5 text-sm"
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink/40 hover:text-ink"
            >
              Convert
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Rates come from the European Central Bank reference set published by Frankfurter. They are
          not a quote and do not include bank or card fees.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Window title="new plan" meta="private to you">
          <NewBudgetPlanForm action={createBudgetPlanAction} countries={countries} />
        </Window>

        <Card>
          <h2 className="font-display text-lg text-ink">Before you trust a total</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>Tuition is usually published per year, not per month.</li>
            <li>A monthly living estimate covers term time more reliably than holidays.</li>
            <li>Flights, visa fees and deposits hit once, often before you arrive.</li>
            <li>A scholarship reduces a cost only after it is awarded, not when you apply.</li>
          </ul>
        </Card>
      </div>

      {plans.length === 0 ? (
        <EmptyState title="No plans yet">
          Create one above, then add the costs you actually expect. If the catalogue has published
          costs for a destination, you can copy a line from the reference table below into your
          plan.
        </EmptyState>
      ) : (
        <ul className="space-y-5">
          {plans.map((plan) => {
            const byCurrency = new Map<string, Totals>();
            for (const item of plan.items) {
              const amount = Number(item.amount.toString());
              if (!Number.isFinite(amount)) continue;
              const totals = byCurrency.get(item.currencyCode) ?? {
                monthly: 0,
                yearly: 0,
                oneTime: 0,
              };
              addToTotals(totals, amount, item.frequency);
              byCurrency.set(item.currencyCode, totals);
            }

            return (
              <Card as="li" key={plan.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl text-ink">{plan.title}</h2>
                    <p className="text-xs text-ink-soft">
                      {plan.programme
                        ? `${plan.programme.title} · ${plan.programme.university.name}`
                        : plan.targetCountryId
                          ? (countries.find((country) => country.id === plan.targetCountryId)
                              ?.name ?? "Destination set")
                          : "No destination set"}{" "}
                      · totals in {plan.currencyCode}
                    </p>
                  </div>
                  <form action={deleteBudgetPlanAction}>
                    <input type="hidden" name="budgetPlanId" value={plan.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:border-blush hover:text-blush"
                    >
                      Delete plan
                    </button>
                  </form>
                </div>

                {plan.items.length === 0 ? (
                  <p className="text-sm text-ink-soft">No costs in this plan yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[34rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                          <th scope="col" className="py-2 pr-3">
                            Cost
                          </th>
                          <th scope="col" className="py-2 pr-3">
                            Amount
                          </th>
                          <th scope="col" className="py-2 pr-3">
                            How often
                          </th>
                          <th scope="col" className="py-2 pr-3">
                            Source
                          </th>
                          <th scope="col" className="py-2 text-right">
                            Remove
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.items.map((item) => (
                          <tr key={item.id} className="border-b border-line/50 align-top">
                            <td className="py-2 pr-3">
                              <span className="block text-ink">{item.label}</span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                                {COST_CATEGORY_LABELS[item.category]}
                              </span>
                            </td>
                            <td className="py-2 pr-3 font-mono">
                              {formatMoney(item.amount, item.currencyCode)}
                            </td>
                            <td className="py-2 pr-3 text-ink-soft">
                              {FREQUENCY_LABELS[item.frequency]}
                            </td>
                            <td className="py-2 pr-3 text-xs text-ink-soft">
                              {item.isUserEntered || !item.sourceName ? (
                                "Your entry"
                              ) : (
                                <a
                                  href={item.sourceName}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="quiet-link"
                                >
                                  Published figure ↗
                                </a>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              <form action={deleteBudgetItemAction}>
                                <input type="hidden" name="budgetPlanId" value={plan.id} />
                                <input type="hidden" name="itemId" value={item.id} />
                                <button
                                  type="submit"
                                  className="text-xs text-ink-soft hover:text-blush hover:underline"
                                >
                                  Remove
                                </button>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {byCurrency.size > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {[...byCurrency.entries()].map(([currency, totals]) => {
                      const monthly = convertAmount(totals.monthly, currency, displayCode, rates);
                      const yearly = convertAmount(totals.yearly, currency, displayCode, rates);
                      const oneTime = convertAmount(totals.oneTime, currency, displayCode, rates);
                      const converted = monthly !== null && yearly !== null && oneTime !== null;

                      return (
                        <div
                          key={currency}
                          className="rounded-md border border-line bg-paper/70 px-3 py-2 text-xs text-ink-soft"
                        >
                          <p className="font-mono uppercase tracking-[0.12em]">{currency}</p>
                          <p className="mt-1 text-sm text-ink">
                            {formatMoney(totals.monthly, currency)} monthly ·{" "}
                            {formatMoney(totals.yearly, currency)} yearly
                          </p>
                          <p className="text-sm text-ink">
                            {formatMoney(totals.oneTime, currency)} one time
                          </p>
                          {currency !== displayCode ? (
                            converted ? (
                              <p className="mt-1 border-t border-line/60 pt-1 text-ink-soft">
                                ≈ {formatMoney(monthly, displayCode)} monthly ·{" "}
                                {formatMoney(yearly, displayCode)} yearly ·{" "}
                                {formatMoney(oneTime, displayCode)} one time
                              </p>
                            ) : (
                              <p className="mt-1 border-t border-line/60 pt-1 text-ink-soft">
                                No reference rate for {currency} → {displayCode}
                              </p>
                            )
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <details className="rounded-md border border-line/70 bg-paper/50 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-ink">
                    Add a cost
                  </summary>
                  <div className="mt-3">
                    <AddBudgetItemForm
                      action={addBudgetItemAction}
                      budgetPlanId={plan.id}
                      defaultCurrency={plan.currencyCode}
                    />
                  </div>
                </details>
              </Card>
            );
          })}
        </ul>
      )}

      <section aria-labelledby="published-heading" className="space-y-3">
        <h2 id="published-heading" className="font-display text-2xl text-ink">
          Published reference costs
        </h2>
        <p className="text-sm text-ink-soft">
          Only figures recorded from a university or government source appear here. When this table
          is empty, no source has been logged yet.
        </p>

        {publishedCosts.length === 0 ? (
          <EmptyState title="No published cost estimates recorded">
            The schema and the review workflow for cost estimates exist, but no country has recorded
            figures. Nothing has been estimated on its behalf.
          </EmptyState>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    <th scope="col" className="py-2 pr-3">
                      Where
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Category
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Amount
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Basis
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Checking
                    </th>
                    <th scope="col" className="py-2 text-right">
                      Plan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {publishedCosts.map((cost) => (
                    <tr key={cost.id} className="border-b border-line/50 align-top">
                      <td className="py-2 pr-3">
                        <span className="block text-ink">{cost.country.name}</span>
                        {cost.city ? (
                          <span className="text-xs text-ink-soft">{cost.city}</span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-3 text-ink-soft">
                        {COST_CATEGORY_LABELS[cost.category]}
                      </td>
                      <td className="py-2 pr-3 font-mono">
                        {formatMoney(cost.amount, cost.currencyCode)}
                        <span className="block text-xs text-ink-soft">
                          {PERIOD_LABELS[cost.period.toUpperCase()] ?? cost.period.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge>{COST_BASIS_LABELS[cost.basis]}</Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <Provenance
                          status={toVerificationStatus(cost.verificationStatus)}
                          sourceUrl={cost.sourceUrl}
                          lastCheckedAt={cost.lastCheckedAt}
                        />
                      </td>
                      <td className="py-2 text-right">
                        {plans.length === 0 ? (
                          <span className="text-xs text-ink-soft">Create a plan first</span>
                        ) : (
                          <form
                            action={copyCostEstimateAction}
                            className="flex items-center justify-end gap-2"
                          >
                            <input type="hidden" name="estimateId" value={cost.id} />
                            <label htmlFor={`plan-for-${cost.id}`} className="sr-only">
                              Add to plan
                            </label>
                            <select
                              id={`plan-for-${cost.id}`}
                              name="budgetPlanId"
                              className="rounded border border-line bg-panel px-2 py-1 text-xs"
                              defaultValue={plans[0]?.id}
                            >
                              {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.title}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:border-ink/40 hover:text-ink"
                            >
                              Add
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
