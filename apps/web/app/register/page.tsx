import type { Metadata } from "next";
import { Window } from "@edubuf/ui";
import { registerAction } from "@/app/actions/auth";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 py-8 md:grid-cols-[1fr_0.9fr]">
      <Window title="new account" meta="step 1 of 2">
        <h1 className="font-display text-2xl text-ink">Start your workspace</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Name, email, password. That is all we ask for before you see anything.
        </p>
        <div className="mt-5">
          <RegisterForm action={registerAction} />
        </div>
      </Window>

      <aside className="space-y-4 text-sm text-ink-soft">
        <div className="rounded-[var(--radius-window)] border border-line bg-panel/70 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
            What happens next
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Add your country, nationality and intended study level.</li>
            <li>Add one qualification and its subjects.</li>
            <li>Open a programme and read the requirement-by-requirement check.</li>
          </ol>
        </div>
        <div className="rounded-[var(--radius-window)] border border-line bg-panel/70 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
            Data you can delete
          </p>
          <p className="mt-2">
            Grades, documents, notes and applications belong to you. Account deletion removes your
            profile and application records; the audit trail keeps the action, not your identity.
          </p>
        </div>
      </aside>
    </div>
  );
}
