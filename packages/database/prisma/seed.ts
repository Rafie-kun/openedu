import { db } from "../src/index";

type SeedCountry = [iso2: string, iso3: string, name: string, region: string];

// reference rows only: names, ISO codes and regions are facts, nothing is asserted about their education systems
const COUNTRIES: SeedCountry[] = [
  ["BD", "BGD", "Bangladesh", "Asia"],
  ["IN", "IND", "India", "Asia"],
  ["PK", "PAK", "Pakistan", "Asia"],
  ["LK", "LKA", "Sri Lanka", "Asia"],
  ["NP", "NPL", "Nepal", "Asia"],
  ["CN", "CHN", "China", "Asia"],
  ["JP", "JPN", "Japan", "Asia"],
  ["KR", "KOR", "South Korea", "Asia"],
  ["SG", "SGP", "Singapore", "Asia"],
  ["MY", "MYS", "Malaysia", "Asia"],
  ["ID", "IDN", "Indonesia", "Asia"],
  ["PH", "PHL", "Philippines", "Asia"],
  ["TH", "THA", "Thailand", "Asia"],
  ["VN", "VNM", "Vietnam", "Asia"],
  ["HK", "HKG", "Hong Kong", "Asia"],
  ["TW", "TWN", "Taiwan", "Asia"],
  ["AE", "ARE", "United Arab Emirates", "Middle East"],
  ["SA", "SAU", "Saudi Arabia", "Middle East"],
  ["JO", "JOR", "Jordan", "Middle East"],
  ["LB", "LBN", "Lebanon", "Middle East"],
  ["IR", "IRN", "Iran", "Middle East"],
  ["IQ", "IRQ", "Iraq", "Middle East"],
  ["TR", "TUR", "Türkiye", "Europe"],
  ["KZ", "KAZ", "Kazakhstan", "Asia"],
  ["UZ", "UZB", "Uzbekistan", "Asia"],
  ["NG", "NGA", "Nigeria", "Africa"],
  ["GH", "GHA", "Ghana", "Africa"],
  ["KE", "KEN", "Kenya", "Africa"],
  ["ZA", "ZAF", "South Africa", "Africa"],
  ["EG", "EGY", "Egypt", "Africa"],
  ["MA", "MAR", "Morocco", "Africa"],
  ["ET", "ETH", "Ethiopia", "Africa"],
  ["TZ", "TZA", "Tanzania", "Africa"],
  ["UG", "UGA", "Uganda", "Africa"],
  ["US", "USA", "United States", "Americas"],
  ["CA", "CAN", "Canada", "Americas"],
  ["MX", "MEX", "Mexico", "Americas"],
  ["BR", "BRA", "Brazil", "Americas"],
  ["AR", "ARG", "Argentina", "Americas"],
  ["CL", "CHL", "Chile", "Americas"],
  ["CO", "COL", "Colombia", "Americas"],
  ["PE", "PER", "Peru", "Americas"],
  ["GB", "GBR", "United Kingdom", "Europe"],
  ["IE", "IRL", "Ireland", "Europe"],
  ["DE", "DEU", "Germany", "Europe"],
  ["FR", "FRA", "France", "Europe"],
  ["NL", "NLD", "Netherlands", "Europe"],
  ["BE", "BEL", "Belgium", "Europe"],
  ["ES", "ESP", "Spain", "Europe"],
  ["PT", "PRT", "Portugal", "Europe"],
  ["IT", "ITA", "Italy", "Europe"],
  ["CH", "CHE", "Switzerland", "Europe"],
  ["AT", "AUT", "Austria", "Europe"],
  ["SE", "SWE", "Sweden", "Europe"],
  ["NO", "NOR", "Norway", "Europe"],
  ["DK", "DNK", "Denmark", "Europe"],
  ["FI", "FIN", "Finland", "Europe"],
  ["PL", "POL", "Poland", "Europe"],
  ["CZ", "CZE", "Czechia", "Europe"],
  ["HU", "HUN", "Hungary", "Europe"],
  ["RO", "ROU", "Romania", "Europe"],
  ["GR", "GRC", "Greece", "Europe"],
  ["UA", "UKR", "Ukraine", "Europe"],
  ["AU", "AUS", "Australia", "Oceania"],
  ["NZ", "NZL", "New Zealand", "Oceania"],
];

const GRADE_SCALES: Array<{
  code: string;
  name: string;
  kind: "LETTER" | "NUMERIC" | "PERCENTAGE" | "POINTS" | "DESCRIPTIVE";
  description: string;
  sourceUrl: string;
  bands: Array<[label: string, rank: number]>;
}> = [
  {
    code: "CAMBRIDGE_ALEVEL",
    name: "Cambridge International AS & A Level grades",
    kind: "LETTER",
    description: "Grades as published by Cambridge International, from A* down to U.",
    sourceUrl:
      "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-advanced/",
    bands: [
      ["A*", 100],
      ["A", 90],
      ["B", 80],
      ["C", 70],
      ["D", 60],
      ["E", 50],
      ["U", 0],
    ],
  },
  {
    code: "CAMBRIDGE_IGCSE",
    name: "Cambridge IGCSE grades",
    kind: "LETTER",
    description: "Grades A* to G plus U. Some subjects are graded 9-1 instead.",
    sourceUrl:
      "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/",
    bands: [
      ["A*", 100],
      ["A", 90],
      ["B", 80],
      ["C", 70],
      ["D", 60],
      ["E", 50],
      ["F", 40],
      ["G", 30],
      ["U", 0],
    ],
  },
  {
    code: "IB_DP",
    name: "IB Diploma Programme subject grades",
    kind: "NUMERIC",
    description:
      "Each subject is graded 7 (highest) to 1. The diploma also uses theory of knowledge and extended essay points.",
    sourceUrl: "https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/",
    bands: [
      ["7", 70],
      ["6", 60],
      ["5", 50],
      ["4", 40],
      ["3", 30],
      ["2", 20],
      ["1", 10],
    ],
  },
  {
    code: "AP_1_5",
    name: "Advanced Placement exam scores",
    kind: "NUMERIC",
    description: "AP exams are scored 5 (extremely well qualified) to 1 (no recommendation).",
    sourceUrl: "https://apstudents.collegeboard.org/about-ap-scores",
    bands: [
      ["5", 50],
      ["4", 40],
      ["3", 30],
      ["2", 20],
      ["1", 10],
    ],
  },
  {
    code: "WAEC_WASSCE",
    name: "WASSCE grades",
    kind: "LETTER",
    description: "West African Examinations Council grades A1 to F9.",
    sourceUrl: "https://www.waecdirect.org/",
    bands: [
      ["A1", 100],
      ["B2", 90],
      ["B3", 80],
      ["C4", 70],
      ["C5", 60],
      ["C6", 50],
      ["D7", 40],
      ["E8", 30],
      ["F9", 0],
    ],
  },
  {
    code: "HSC_BD_GPA",
    name: "Bangladesh HSC GPA (5.00 scale)",
    kind: "NUMERIC",
    description: "Grade point average on the 5.00 scale used for the Higher Secondary Certificate.",
    sourceUrl: "https://educationboard.gov.bd/",
    bands: [
      ["5.00", 500],
      ["4.00", 400],
      ["3.50", 350],
      ["3.00", 300],
      ["2.00", 200],
      ["1.00", 100],
      ["0.00", 0],
    ],
  },
  {
    code: "PERCENTAGE_100",
    name: "Percentage (0-100)",
    kind: "PERCENTAGE",
    description:
      "A plain percentage band. Only use it when the awarding body reports percentages directly.",
    sourceUrl: "https://en.wikipedia.org/wiki/Grading_in_education",
    bands: [
      ["90-100", 90],
      ["80-89", 80],
      ["70-79", 70],
      ["60-69", 60],
      ["50-59", 50],
      ["40-49", 40],
      ["0-39", 0],
    ],
  },
];

const AWARDING_BODIES: Array<{
  code: string;
  name: string;
  countryIso2: string | null;
  websiteUrl: string;
}> = [
  {
    code: "CAMBRIDGE_INTL",
    name: "Cambridge University Press & Assessment (Cambridge International)",
    countryIso2: "GB",
    websiteUrl: "https://www.cambridgeinternational.org/",
  },
  {
    code: "PEARSON_EDEXCEL",
    name: "Pearson Edexcel",
    countryIso2: "GB",
    websiteUrl: "https://qualifications.pearson.com/",
  },
  {
    code: "IBO",
    name: "International Baccalaureate Organization",
    countryIso2: "CH",
    websiteUrl: "https://www.ibo.org/",
  },
  {
    code: "COLLEGE_BOARD",
    name: "College Board",
    countryIso2: "US",
    websiteUrl: "https://www.collegeboard.org/",
  },
  {
    code: "WAEC",
    name: "West African Examinations Council",
    countryIso2: "GH",
    websiteUrl: "https://www.waecdirect.org/",
  },
  {
    code: "CBSE",
    name: "Central Board of Secondary Education (India)",
    countryIso2: "IN",
    websiteUrl: "https://www.cbse.gov.in/",
  },
];

const QUALIFICATION_TYPES: Array<{
  code: string;
  name: string;
  shortName: string;
  level: "SECONDARY" | "UPPER_SECONDARY" | "POST_SECONDARY" | "VOCATIONAL" | "OTHER";
  countryIso2: string | null;
  scaleCode: string | null;
  awardingBodyCodes: string[];
  officialUrl: string;
  description: string;
}> = [
  {
    code: "CAMBRIDGE_AS_A_LEVEL",
    name: "Cambridge International AS & A Level",
    shortName: "A Level",
    level: "UPPER_SECONDARY",
    countryIso2: null,
    scaleCode: "CAMBRIDGE_ALEVEL",
    awardingBodyCodes: ["CAMBRIDGE_INTL"],
    officialUrl:
      "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-advanced/",
    description:
      "Subject-based qualification usually taken in the final two years of secondary school.",
  },
  {
    code: "CAMBRIDGE_IGCSE",
    name: "Cambridge IGCSE",
    shortName: "IGCSE",
    level: "SECONDARY",
    countryIso2: null,
    scaleCode: "CAMBRIDGE_IGCSE",
    awardingBodyCodes: ["CAMBRIDGE_INTL"],
    officialUrl:
      "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/",
    description: "International secondary qualification, usually taken around age 16.",
  },
  {
    code: "EDEXCEL_IAL",
    name: "Pearson Edexcel International A Level",
    shortName: "Edexcel IAL",
    level: "UPPER_SECONDARY",
    countryIso2: null,
    scaleCode: "CAMBRIDGE_ALEVEL",
    awardingBodyCodes: ["PEARSON_EDEXCEL"],
    officialUrl:
      "https://qualifications.pearson.com/en/qualifications/edexcel-international-advanced-levels.html",
    description: "International A Level offered by Pearson Edexcel. Modules differ from Cambridge.",
  },
  {
    code: "EDEXCEL_IGCSE",
    name: "Pearson Edexcel International GCSE",
    shortName: "Edexcel IGCSE",
    level: "SECONDARY",
    countryIso2: null,
    scaleCode: "CAMBRIDGE_IGCSE",
    awardingBodyCodes: ["PEARSON_EDEXCEL"],
    officialUrl:
      "https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses.html",
    description: "International GCSE offered by Pearson Edexcel.",
  },
  {
    code: "IB_DIPLOMA",
    name: "International Baccalaureate Diploma Programme",
    shortName: "IB DP",
    level: "UPPER_SECONDARY",
    countryIso2: null,
    scaleCode: "IB_DP",
    awardingBodyCodes: ["IBO"],
    officialUrl: "https://www.ibo.org/programmes/diploma-programme/",
    description:
      "Two-year programme with six subject groups, theory of knowledge and an extended essay.",
  },
  {
    code: "AP",
    name: "Advanced Placement",
    shortName: "AP",
    level: "UPPER_SECONDARY",
    countryIso2: "US",
    scaleCode: "AP_1_5",
    awardingBodyCodes: ["COLLEGE_BOARD"],
    officialUrl: "https://apstudents.collegeboard.org/",
    description:
      "Individual college-level courses and exams, usually taken alongside a US high school diploma.",
  },
  {
    code: "WASSCE",
    name: "West African Senior School Certificate Examination",
    shortName: "WASSCE",
    level: "UPPER_SECONDARY",
    countryIso2: null,
    scaleCode: "WAEC_WASSCE",
    awardingBodyCodes: ["WAEC"],
    officialUrl: "https://www.waecdirect.org/",
    description: "School-leaving examination taken in several West African countries.",
  },
  {
    code: "HSC_BD",
    name: "Higher Secondary Certificate (Bangladesh)",
    shortName: "HSC",
    level: "UPPER_SECONDARY",
    countryIso2: "BD",
    scaleCode: "HSC_BD_GPA",
    awardingBodyCodes: [],
    officialUrl: "https://educationboard.gov.bd/",
    description:
      "Bangladeshi upper-secondary certificate awarded by the regional education boards.",
  },
  {
    code: "CBSE_CLASS_12",
    name: "CBSE Senior School Certificate (Class XII)",
    shortName: "CBSE XII",
    level: "UPPER_SECONDARY",
    countryIso2: "IN",
    scaleCode: "PERCENTAGE_100",
    awardingBodyCodes: ["CBSE"],
    officialUrl: "https://www.cbse.gov.in/",
    description:
      "Indian senior secondary certificate awarded by the Central Board of Secondary Education.",
  },
];

const SUBJECTS: Array<[code: string, name: string, area: string]> = [
  ["MATH", "Mathematics", "Mathematics"],
  ["FMATH", "Further Mathematics", "Mathematics"],
  ["STATS", "Statistics", "Mathematics"],
  ["PHYS", "Physics", "Sciences"],
  ["CHEM", "Chemistry", "Sciences"],
  ["BIO", "Biology", "Sciences"],
  ["CS", "Computer Science", "Computing"],
  ["ECON", "Economics", "Social sciences"],
  ["BUS", "Business Studies", "Business"],
  ["ACC", "Accounting", "Business"],
  ["ENG_LANG", "English Language", "Languages"],
  ["ENG_LIT", "English Literature", "Languages"],
  ["HIST", "History", "Humanities"],
  ["GEOG", "Geography", "Humanities"],
  ["PSYCH", "Psychology", "Social sciences"],
  ["SOC", "Sociology", "Social sciences"],
  ["POL", "Political Science", "Social sciences"],
  ["LAW", "Law", "Law"],
  ["PHIL", "Philosophy", "Humanities"],
  ["ART", "Art and Design", "Creative arts"],
  ["MUSIC", "Music", "Creative arts"],
  ["ENVSCI", "Environmental Science", "Sciences"],
];

const DEGREE_TYPES: Array<
  [
    code: string,
    name: string,
    level:
      | "FOUNDATION"
      | "UNDERGRADUATE"
      | "POSTGRADUATE"
      | "DOCTORAL"
      | "DIPLOMA"
      | "CERTIFICATE"
      | "OTHER",
  ]
> = [
  ["BA", "Bachelor of Arts", "UNDERGRADUATE"],
  ["BSC", "Bachelor of Science", "UNDERGRADUATE"],
  ["BENG", "Bachelor of Engineering", "UNDERGRADUATE"],
  ["BBA", "Bachelor of Business Administration", "UNDERGRADUATE"],
  ["LLB", "Bachelor of Laws", "UNDERGRADUATE"],
  ["MA", "Master of Arts", "POSTGRADUATE"],
  ["MSC", "Master of Science", "POSTGRADUATE"],
  ["MBA", "Master of Business Administration", "POSTGRADUATE"],
  ["LLM", "Master of Laws", "POSTGRADUATE"],
  ["PHD", "Doctor of Philosophy", "DOCTORAL"],
  ["FOUNDATION_CERT", "Foundation certificate", "FOUNDATION"],
  ["DIPLOMA", "Diploma", "DIPLOMA"],
  ["ASSOC", "Associate degree", "UNDERGRADUATE"],
  ["CERT", "Certificate", "CERTIFICATE"],
];

const CURRENCIES: Array<[code: string, name: string, symbol: string, minorUnits: number]> = [
  ["USD", "United States dollar", "$", 2],
  ["EUR", "Euro", "€", 2],
  ["GBP", "Pound sterling", "£", 2],
  ["BDT", "Bangladeshi taka", "৳", 2],
  ["INR", "Indian rupee", "₹", 2],
  ["PKR", "Pakistani rupee", "₨", 2],
  ["LKR", "Sri Lankan rupee", "₨", 2],
  ["NPR", "Nepalese rupee", "₨", 2],
  ["NGN", "Nigerian naira", "₦", 2],
  ["GHS", "Ghanaian cedi", "₵", 2],
  ["KES", "Kenyan shilling", "KSh", 2],
  ["ZAR", "South African rand", "R", 2],
  ["EGP", "Egyptian pound", "E£", 2],
  ["MAD", "Moroccan dirham", "DH", 2],
  ["CAD", "Canadian dollar", "$", 2],
  ["AUD", "Australian dollar", "$", 2],
  ["NZD", "New Zealand dollar", "$", 2],
  ["JPY", "Japanese yen", "¥", 0],
  ["KRW", "South Korean won", "₩", 0],
  ["CNY", "Chinese yuan", "¥", 2],
  ["MYR", "Malaysian ringgit", "RM", 2],
  ["SGD", "Singapore dollar", "S$", 2],
  ["IDR", "Indonesian rupiah", "Rp", 2],
  ["PHP", "Philippine peso", "₱", 2],
  ["THB", "Thai baht", "฿", 2],
  ["VND", "Vietnamese dong", "₫", 0],
  ["AED", "United Arab Emirates dirham", "د.إ", 2],
  ["SAR", "Saudi riyal", "﷼", 2],
  ["TRY", "Turkish lira", "₺", 2],
  ["BRL", "Brazilian real", "R$", 2],
  ["MXN", "Mexican peso", "$", 2],
  ["CHF", "Swiss franc", "Fr", 2],
  ["SEK", "Swedish krona", "kr", 2],
  ["NOK", "Norwegian krone", "kr", 2],
  ["DKK", "Danish krone", "kr", 2],
  ["PLN", "Polish złoty", "zł", 2],
  ["CZK", "Czech koruna", "Kč", 2],
  ["HUF", "Hungarian forint", "Ft", 2],
  ["RON", "Romanian leu", "lei", 2],
  ["UAH", "Ukrainian hryvnia", "₴", 2],
];

const DATA_SOURCES: Array<{
  code: string;
  name: string;
  organisation: string;
  category:
    | "UNIVERSITY_DIRECTORY"
    | "SCHOLARSHIP"
    | "IMMIGRATION"
    | "CURRENCY"
    | "RESEARCH_IDENTITY"
    | "NATIONAL_AUTHORITY"
    | "OTHER";
  url: string;
  accessMethod: "API" | "BULK_DOWNLOAD" | "MANUAL" | "HTML_SCRAPE";
  licenceSummary: string;
  termsUrl: string;
  knownLimitations: string;
}> = [
  {
    code: "ROR",
    name: "Research Organization Registry",
    organisation: "ROR",
    category: "RESEARCH_IDENTITY",
    url: "https://ror.org/",
    accessMethod: "API",
    licenceSummary: "Registry data is released under CC0.",
    termsUrl: "https://ror.org/about/",
    knownLimitations:
      "Identifies research organisations. Inclusion is not evidence of accreditation or degree-awarding status.",
  },
  {
    code: "OPENALEX",
    name: "OpenAlex",
    organisation: "OurResearch",
    category: "RESEARCH_IDENTITY",
    url: "https://openalex.org/",
    accessMethod: "API",
    licenceSummary: "Metadata is CC0; API use is subject to the project's terms.",
    termsUrl: "https://docs.openalex.org/",
    knownLimitations: "Institution records include research bodies that do not teach degrees.",
  },
  {
    code: "WHED",
    name: "World Higher Education Database",
    organisation: "UNESCO / International Association of Universities",
    category: "UNIVERSITY_DIRECTORY",
    url: "https://www.whed.net/",
    accessMethod: "MANUAL",
    licenceSummary: "Access conditions and licensing must be confirmed before any bulk use.",
    termsUrl: "https://www.whed.net/",
    knownLimitations: "Not an open bulk dataset. Do not scrape without written permission.",
  },
  {
    code: "FRANKFURTER",
    name: "Frankfurter exchange rates",
    organisation: "Frankfurter",
    category: "CURRENCY",
    url: "https://frankfurter.dev/",
    accessMethod: "API",
    licenceSummary:
      "Open-source service publishing reference rates from the European Central Bank.",
    termsUrl: "https://frankfurter.dev/",
    knownLimitations:
      "Reference rates, not the rate a bank or payment provider will give you. Not every currency is covered.",
  },
];

const UNIVERSITIES: Array<{
  slug: string;
  name: string;
  officialName: string;
  countryIso2: string;
  city: string;
  websiteUrl: string;
  type: "PUBLIC" | "PRIVATE" | "OTHER";
}> = [
  {
    slug: "university-of-oxford",
    name: "University of Oxford",
    officialName: "The Chancellor, Masters and Scholars of the University of Oxford",
    countryIso2: "GB",
    city: "Oxford",
    websiteUrl: "https://www.ox.ac.uk/",
    type: "PUBLIC",
  },
  {
    slug: "university-of-cambridge",
    name: "University of Cambridge",
    officialName: "The Chancellor, Masters and Scholars of the University of Cambridge",
    countryIso2: "GB",
    city: "Cambridge",
    websiteUrl: "https://www.cam.ac.uk/",
    type: "PUBLIC",
  },
  {
    slug: "eth-zurich",
    name: "ETH Zurich",
    officialName: "Eidgenössische Technische Hochschule Zürich",
    countryIso2: "CH",
    city: "Zurich",
    websiteUrl: "https://ethz.ch/en.html",
    type: "PUBLIC",
  },
  {
    slug: "delft-university-of-technology",
    name: "Delft University of Technology",
    officialName: "Technische Universiteit Delft",
    countryIso2: "NL",
    city: "Delft",
    websiteUrl: "https://www.tudelft.nl/en/",
    type: "PUBLIC",
  },
  {
    slug: "university-of-toronto",
    name: "University of Toronto",
    officialName: "Governing Council of the University of Toronto",
    countryIso2: "CA",
    city: "Toronto",
    websiteUrl: "https://www.utoronto.ca/",
    type: "PUBLIC",
  },
  {
    slug: "mit",
    name: "Massachusetts Institute of Technology",
    officialName: "Massachusetts Institute of Technology",
    countryIso2: "US",
    city: "Cambridge, Massachusetts",
    websiteUrl: "https://www.mit.edu/",
    type: "PRIVATE",
  },
  {
    slug: "national-university-of-singapore",
    name: "National University of Singapore",
    officialName: "National University of Singapore",
    countryIso2: "SG",
    city: "Singapore",
    websiteUrl: "https://nus.edu.sg/",
    type: "PUBLIC",
  },
  {
    slug: "university-of-melbourne",
    name: "University of Melbourne",
    officialName: "University of Melbourne",
    countryIso2: "AU",
    city: "Melbourne",
    websiteUrl: "https://www.unimelb.edu.au/",
    type: "PUBLIC",
  },
  {
    slug: "heidelberg-university",
    name: "Heidelberg University",
    officialName: "Ruprecht-Karls-Universität Heidelberg",
    countryIso2: "DE",
    city: "Heidelberg",
    websiteUrl: "https://www.uni-heidelberg.de/en",
    type: "PUBLIC",
  },
  {
    slug: "university-of-amsterdam",
    name: "University of Amsterdam",
    officialName: "Universiteit van Amsterdam",
    countryIso2: "NL",
    city: "Amsterdam",
    websiteUrl: "https://www.uva.nl/en",
    type: "PUBLIC",
  },
  {
    slug: "university-of-tokyo",
    name: "University of Tokyo",
    officialName: "The University of Tokyo",
    countryIso2: "JP",
    city: "Tokyo",
    websiteUrl: "https://www.u-tokyo.ac.jp/en/",
    type: "PUBLIC",
  },
  {
    slug: "university-of-dhaka",
    name: "University of Dhaka",
    officialName: "University of Dhaka",
    countryIso2: "BD",
    city: "Dhaka",
    websiteUrl: "https://www.du.ac.bd/",
    type: "PUBLIC",
  },
];

async function main() {
  const now = new Date();

  for (const [iso2, iso3, name, region] of COUNTRIES) {
    await db.country.upsert({
      where: { iso2 },
      update: { iso3, name, region },
      create: { iso2, iso3, name, region },
    });
  }

  const countryByIso2 = new Map(
    (await db.country.findMany({ select: { id: true, iso2: true } })).map((country) => [
      country.iso2,
      country.id,
    ]),
  );

  const scaleByCode = new Map<string, string>();
  for (const scale of GRADE_SCALES) {
    const row = await db.gradeScale.upsert({
      where: { code: scale.code },
      update: {
        name: scale.name,
        kind: scale.kind,
        description: scale.description,
        sourceUrl: scale.sourceUrl,
      },
      create: {
        code: scale.code,
        name: scale.name,
        kind: scale.kind,
        description: scale.description,
        sourceUrl: scale.sourceUrl,
        verificationStatus: "UNVERIFIED",
        lastCheckedAt: now,
      },
      select: { id: true },
    });
    scaleByCode.set(scale.code, row.id);

    for (const [label, rank] of scale.bands) {
      await db.gradeBand.upsert({
        where: { gradeScaleId_label: { gradeScaleId: row.id, label } },
        update: { rank },
        create: { gradeScaleId: row.id, label, rank },
      });
    }
  }

  const bodyByCode = new Map<string, string>();
  for (const body of AWARDING_BODIES) {
    const row = await db.awardingBody.upsert({
      where: { code: body.code },
      update: { name: body.name, websiteUrl: body.websiteUrl },
      create: {
        code: body.code,
        name: body.name,
        countryId: body.countryIso2 ? (countryByIso2.get(body.countryIso2) ?? null) : null,
        websiteUrl: body.websiteUrl,
        sourceUrl: body.websiteUrl,
        verificationStatus: "UNVERIFIED",
        lastCheckedAt: now,
      },
      select: { id: true },
    });
    bodyByCode.set(body.code, row.id);
  }

  for (const type of QUALIFICATION_TYPES) {
    const row = await db.qualificationType.upsert({
      where: { code: type.code },
      update: {
        name: type.name,
        shortName: type.shortName,
        level: type.level,
        description: type.description,
        officialUrl: type.officialUrl,
        defaultGradeScaleId: type.scaleCode ? (scaleByCode.get(type.scaleCode) ?? null) : null,
      },
      create: {
        code: type.code,
        name: type.name,
        shortName: type.shortName,
        level: type.level,
        countryId: type.countryIso2 ? (countryByIso2.get(type.countryIso2) ?? null) : null,
        description: type.description,
        officialUrl: type.officialUrl,
        defaultGradeScaleId: type.scaleCode ? (scaleByCode.get(type.scaleCode) ?? null) : null,
        sourceUrl: type.officialUrl,
        verificationStatus: "UNVERIFIED",
        lastCheckedAt: now,
      },
      select: { id: true },
    });

    for (const bodyCode of type.awardingBodyCodes) {
      const awardingBodyId = bodyByCode.get(bodyCode);
      if (!awardingBodyId) continue;
      await db.qualificationAwardingBody.upsert({
        where: {
          qualificationTypeId_awardingBodyId: {
            qualificationTypeId: row.id,
            awardingBodyId,
          },
        },
        update: {},
        create: { qualificationTypeId: row.id, awardingBodyId },
      });
    }
  }

  for (const [code, name, subjectArea] of SUBJECTS) {
    await db.subject.upsert({
      where: { code },
      update: { name, subjectArea },
      create: { code, name, subjectArea },
    });
  }

  for (const [code, name, level] of DEGREE_TYPES) {
    await db.degreeType.upsert({
      where: { code },
      update: { name, level },
      create: { code, name, level },
    });
  }

  for (const [code, name, symbol, minorUnits] of CURRENCIES) {
    await db.currency.upsert({
      where: { code },
      update: { name, symbol, minorUnits },
      create: { code, name, symbol, minorUnits },
    });
  }

  for (const source of DATA_SOURCES) {
    await db.dataSource.upsert({
      where: { code: source.code },
      update: {
        name: source.name,
        organisation: source.organisation,
        category: source.category,
        url: source.url,
        accessMethod: source.accessMethod,
        licenceSummary: source.licenceSummary,
        termsUrl: source.termsUrl,
        knownLimitations: source.knownLimitations,
      },
      create: {
        code: source.code,
        name: source.name,
        organisation: source.organisation,
        category: source.category,
        url: source.url,
        accessMethod: source.accessMethod,
        licenceSummary: source.licenceSummary,
        termsUrl: source.termsUrl,
        knownLimitations: source.knownLimitations,
        permissionStatus: "PENDING",
        isActive: false,
      },
    });
  }

  for (const university of UNIVERSITIES) {
    const countryId = countryByIso2.get(university.countryIso2);
    if (!countryId) continue;
    await db.university.upsert({
      where: { slug: university.slug },
      update: {
        name: university.name,
        officialName: university.officialName,
        city: university.city,
        websiteUrl: university.websiteUrl,
        type: university.type,
      },
      create: {
        slug: university.slug,
        name: university.name,
        officialName: university.officialName,
        countryId,
        city: university.city,
        websiteUrl: university.websiteUrl,
        type: university.type,
        sourceUrl: university.websiteUrl,
        verificationStatus: "UNVERIFIED",
        lastCheckedAt: now,
      },
    });
  }

  const counts = {
    countries: await db.country.count(),
    gradeScales: await db.gradeScale.count(),
    qualificationTypes: await db.qualificationType.count(),
    awardingBodies: await db.awardingBody.count(),
    subjects: await db.subject.count(),
    degreeTypes: await db.degreeType.count(),
    currencies: await db.currency.count(),
    dataSources: await db.dataSource.count(),
    universities: await db.university.count(),
  };

  console.log("seed complete", counts);
}

main()
  .catch((error) => {
    console.error("seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
