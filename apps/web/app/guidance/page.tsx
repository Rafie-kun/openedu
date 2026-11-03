import type { Metadata } from "next";
import { Badge, Callout, Card, SectionHeading, Window } from "@openedu/ui";

export const metadata: Metadata = { title: "Application guidance" };

const SYSTEMS = [
  {
    name: "UCAS",
    region: "United Kingdom",
    what: "Centralised undergraduate applications for most UK universities, plus some conservatoire courses. You submit one application with up to five choices.",
    url: "https://www.ucas.com",
    note: "Postgraduate study is usually applied for directly with each university.",
  },
  {
    name: "Common App",
    region: "United States, plus some international universities",
    what: "One first-year application shared by a large group of US colleges. Each member can add its own questions and essays.",
    url: "https://www.commonapp.org",
    note: "Not every US institution uses it. Some use the Coalition app, some their own portal.",
  },
  {
    name: "Coalition for College",
    region: "United States",
    what: "An alternative shared application used by a smaller group of colleges, with a focus on access programmes.",
    url: "https://www.coalitionforcollegeaccess.org",
    note: "Check the college's own admissions page to see which application it accepts.",
  },
  {
    name: "uni-assist",
    region: "Germany",
    what: "A central service that checks international applications against German university requirements before forwarding them.",
    url: "https://www.uni-assist.de/en/",
    note: "Not all German universities use it, and some programmes require a direct application.",
  },
  {
    name: "OUAC",
    region: "Ontario, Canada",
    what: "The Ontario Universities' Application Centre handles undergraduate applications to Ontario universities.",
    url: "https://www.ouac.on.ca",
    note: "Other Canadian provinces use their own systems or direct applications.",
  },
  {
    name: "Studielink",
    region: "Netherlands",
    what: "The national registration system for Dutch higher education programmes.",
    url: "https://www.studielink.nl",
    note: "Registration is not the same as admission; the institution still decides.",
  },
  {
    name: "CAO",
    region: "Ireland",
    what: "The Central Applications Office processes undergraduate applications to Irish institutions.",
    url: "https://www.cao.ie",
    note: "Some postgraduate and mature-entry routes are handled directly.",
  },
  {
    name: "Campus France",
    region: "France",
    what: "The national agency for promoting French higher education and supporting international applications.",
    url: "https://www.campusfrance.org/en",
    note: "Some programmes use the Études en France procedure; others are direct.",
  },
  {
    name: "Universityadmissions.se",
    region: "Sweden",
    what: "The national application portal for Swedish university programmes and courses.",
    url: "https://www.universityadmissions.se",
    note: "Deadlines are strict and usually early in the calendar year.",
  },
  {
    name: "Direct application",
    region: "Everywhere",
    what: "Many universities — especially for postgraduate study — run their own application portal and never use a central system.",
    url: "",
    note: "Always confirm the route on the specific programme page, not just the university homepage.",
  },
];

const TERMS = [
  ["Conditional offer", "An offer that depends on you meeting a stated condition, usually a final grade."],
  ["Predicted grade", "A school's estimate of the grade you will achieve. It is not a result."],
  ["Transcript", "The official record of your subjects and grades, usually issued by the school or board."],
  ["Reference", "A short statement from a teacher, adviser or employer supporting your application."],
  ["Personal statement", "Your own written section. Requirements on length and content differ by system."],
  ["Deferred entry", "Starting a year later than the intake you applied for, usually after agreeing it with the institution."],
  ["Foundation year", "A preparatory year before degree study, often for students whose school qualification is not accepted directly."],
  ["Credit transfer", "Recognition of study you already completed toward a new qualification. It is decided by the receiving institution."],
];

export default function GuidancePage() {
  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="guidance" title="How applications actually work">
        Applications are not one global form. The route depends on the country, the level of study and
        sometimes the individual programme. This page explains the main systems and the words they use.
      </SectionHeading>

      <Callout tone="warning" title="This is a map, not the territory">
        Fees, deadlines and document rules change. Every entry below links to the official system. Read
        that page before you plan around a date or a requirement.
      </Callout>

      <section aria-labelledby="systems-heading">
        <h2 id="systems-heading" className="font-display text-2xl text-ink">
          Main application routes
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {SYSTEMS.map((system) => (
            <Card as="li" key={system.name}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg text-ink">{system.name}</h3>
                <Badge>{system.region}</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{system.what}</p>
              <p className="mt-2 text-xs text-ink-soft">{system.note}</p>
              {system.url ? (
                <a
                  href={system.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-3 inline-block quiet-link text-sm"
                >
                  Official site ↗
                </a>
              ) : null}
            </Card>
          ))}
        </ul>
      </section>

      <section aria-labelledby="terms-heading" className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 id="terms-heading" className="font-display text-2xl text-ink">
            Words that trip people up
          </h2>
          <dl className="mt-3 space-y-3 text-sm">
            {TERMS.map(([term, meaning]) => (
              <div key={term}>
                <dt className="font-medium text-ink">{term}</dt>
                <dd className="text-ink-soft">{meaning}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-4">
          <Window title="a workable order" meta="not a deadline plan">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-soft">
              <li>Decide the qualification route and the country, not just the university name.</li>
              <li>Check the specific programme page for entry requirements and the application route.</li>
              <li>Write down each deadline and its timezone in your own calendar.</li>
              <li>Collect transcripts and references early; they are the slowest part.</li>
              <li>Keep a copy of every submitted form and confirmation email.</li>
            </ol>
          </Window>

          <Window title="what the platform will not do" meta="boundaries">
            <p className="text-sm text-ink-soft">
              OpenEdu does not prepare your personal statement, does not submit forms, does not pay fees and
              does not contact institutions for you. It helps you compare recorded requirements and keep
              your own notes in one place.
            </p>
          </Window>
        </div>
      </section>
    </div>
  );
}
