import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: {
    default: "EduBuf — find study options you can actually use",
    template: "%s · EduBuf",
  },
  description:
    "A source-traceable workspace for comparing universities, programmes and scholarships worldwide, understanding eligibility, and planning your next step.",
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("session-lookup-failed", error);
  }

  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-plum focus:bg-panel focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6">
          <SiteHeader user={user} />
          <main id="main" className="flex-1 pb-16 pt-6">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
