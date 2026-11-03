import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Callout, Card, SectionHeading } from "@openedu/ui";
import { formatDate } from "@openedu/shared";
import { getLegalDocument, LEGAL_DOCUMENTS } from "@/lib/legal";

export const dynamic = "force-static";

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) return { title: "Not found" };
  return { title: document.title, description: document.summary };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        eyebrow={`legal · updated ${formatDate(document.updated)}`}
        title={document.title}
      >
        {document.summary}
      </SectionHeading>

      <Callout tone="warning" title="Draft for review">
        This page describes what the code actually does, but it has not been reviewed by a lawyer
        and the operator details are not filled in. Treat it as a working draft, not a compliance
        certificate.
      </Callout>

      <article className="space-y-6">
        {document.sections.map((section) => (
          <Card key={section.heading} as="section">
            <h2 className="font-display text-xl text-ink">{section.heading}</h2>
            {section.body?.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-ink-soft">
                {paragraph}
              </p>
            ))}
            {section.list ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </article>

      <nav aria-label="Other legal pages" className="border-t border-line pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          also worth reading
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LEGAL_DOCUMENTS.filter((item) => item.slug !== document.slug).map((item) => (
            <li key={item.slug}>
              <Link href={`/legal/${item.slug}`} className="quiet-link">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
