import type { Metadata } from "next";
import Link from "next/link";
import { Window } from "@openedu/ui";
import { loginAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md py-8">
      <Window title="sign-in" meta="workspace access">
        <h1 className="font-display text-2xl text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Your qualifications, matches and application notes are waiting where you left them.
        </p>
        <div className="mt-5">
          <LoginForm action={loginAction} next={next} />
        </div>
      </Window>
      <p className="mt-4 text-center text-xs text-ink-soft">
        Trouble signing in? Check that cookies are enabled for this site. Password reset needs an
        email provider, which this deployment may not have configured.{" "}
        <Link href="/legal/privacy" className="quiet-link">
          Privacy notice
        </Link>
      </p>
    </div>
  );
}
