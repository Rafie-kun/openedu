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
  // the rest of the ISO 3166-1 list, added for a complete country directory; no claim about
  // education systems or international-student access is made by a country merely being listed
  ["AF", "AFG", "Afghanistan", "Asia"],
  ["BT", "BTN", "Bhutan", "Asia"],
  ["MV", "MDV", "Maldives", "Asia"],
  ["MM", "MMR", "Myanmar", "Asia"],
  ["KH", "KHM", "Cambodia", "Asia"],
  ["LA", "LAO", "Laos", "Asia"],
  ["BN", "BRN", "Brunei", "Asia"],
  ["TL", "TLS", "Timor-Leste", "Asia"],
  ["MN", "MNG", "Mongolia", "Asia"],
  ["KP", "PRK", "North Korea", "Asia"],
  ["KG", "KGZ", "Kyrgyzstan", "Asia"],
  ["TJ", "TJK", "Tajikistan", "Asia"],
  ["TM", "TKM", "Turkmenistan", "Asia"],
  ["AM", "ARM", "Armenia", "Asia"],
  ["AZ", "AZE", "Azerbaijan", "Asia"],
  ["IL", "ISR", "Israel", "Middle East"],
  ["PS", "PSE", "Palestine", "Middle East"],
  ["SY", "SYR", "Syria", "Middle East"],
  ["YE", "YEM", "Yemen", "Middle East"],
  ["OM", "OMN", "Oman", "Middle East"],
  ["QA", "QAT", "Qatar", "Middle East"],
  ["KW", "KWT", "Kuwait", "Middle East"],
  ["BH", "BHR", "Bahrain", "Middle East"],
  ["CY", "CYP", "Cyprus", "Europe"],
  ["IS", "ISL", "Iceland", "Europe"],
  ["LU", "LUX", "Luxembourg", "Europe"],
  ["MT", "MLT", "Malta", "Europe"],
  ["SK", "SVK", "Slovakia", "Europe"],
  ["SI", "SVN", "Slovenia", "Europe"],
  ["HR", "HRV", "Croatia", "Europe"],
  ["BA", "BIH", "Bosnia and Herzegovina", "Europe"],
  ["RS", "SRB", "Serbia", "Europe"],
  ["ME", "MNE", "Montenegro", "Europe"],
  ["MK", "MKD", "North Macedonia", "Europe"],
  ["AL", "ALB", "Albania", "Europe"],
  ["BG", "BGR", "Bulgaria", "Europe"],
  ["MD", "MDA", "Moldova", "Europe"],
  ["BY", "BLR", "Belarus", "Europe"],
  ["LT", "LTU", "Lithuania", "Europe"],
  ["LV", "LVA", "Latvia", "Europe"],
  ["EE", "EST", "Estonia", "Europe"],
  ["RU", "RUS", "Russia", "Europe"],
  ["GE", "GEO", "Georgia", "Europe"],
  ["XK", "XKX", "Kosovo", "Europe"],
  ["SM", "SMR", "San Marino", "Europe"],
  ["MC", "MCO", "Monaco", "Europe"],
  ["LI", "LIE", "Liechtenstein", "Europe"],
  ["AD", "AND", "Andorra", "Europe"],
  ["VA", "VAT", "Vatican City", "Europe"],
  ["DZ", "DZA", "Algeria", "Africa"],
  ["TN", "TUN", "Tunisia", "Africa"],
  ["LY", "LBY", "Libya", "Africa"],
  ["SD", "SDN", "Sudan", "Africa"],
  ["SS", "SSD", "South Sudan", "Africa"],
  ["SN", "SEN", "Senegal", "Africa"],
  ["ML", "MLI", "Mali", "Africa"],
  ["MR", "MRT", "Mauritania", "Africa"],
  ["NE", "NER", "Niger", "Africa"],
  ["TD", "TCD", "Chad", "Africa"],
  ["BF", "BFA", "Burkina Faso", "Africa"],
  ["GN", "GIN", "Guinea", "Africa"],
  ["GW", "GNB", "Guinea-Bissau", "Africa"],
  ["SL", "SLE", "Sierra Leone", "Africa"],
  ["LR", "LBR", "Liberia", "Africa"],
  ["CI", "CIV", "Côte d'Ivoire", "Africa"],
  ["TG", "TGO", "Togo", "Africa"],
  ["BJ", "BEN", "Benin", "Africa"],
  ["CM", "CMR", "Cameroon", "Africa"],
  ["CF", "CAF", "Central African Republic", "Africa"],
  ["GA", "GAB", "Gabon", "Africa"],
  ["CG", "COG", "Republic of the Congo", "Africa"],
  ["CD", "COD", "DR Congo", "Africa"],
  ["GQ", "GNQ", "Equatorial Guinea", "Africa"],
  ["ST", "STP", "São Tomé and Príncipe", "Africa"],
  ["AO", "AGO", "Angola", "Africa"],
  ["ZM", "ZMB", "Zambia", "Africa"],
  ["ZW", "ZWE", "Zimbabwe", "Africa"],
  ["MW", "MWI", "Malawi", "Africa"],
  ["MZ", "MOZ", "Mozambique", "Africa"],
  ["NA", "NAM", "Namibia", "Africa"],
  ["BW", "BWA", "Botswana", "Africa"],
  ["SZ", "SWZ", "Eswatini", "Africa"],
  ["LS", "LSO", "Lesotho", "Africa"],
  ["RW", "RWA", "Rwanda", "Africa"],
  ["BI", "BDI", "Burundi", "Africa"],
  ["DJ", "DJI", "Djibouti", "Africa"],
  ["SO", "SOM", "Somalia", "Africa"],
  ["ER", "ERI", "Eritrea", "Africa"],
  ["GM", "GMB", "Gambia", "Africa"],
  ["CV", "CPV", "Cabo Verde", "Africa"],
  ["KM", "COM", "Comoros", "Africa"],
  ["SC", "SYC", "Seychelles", "Africa"],
  ["MU", "MUS", "Mauritius", "Africa"],
  ["MG", "MDG", "Madagascar", "Africa"],
  ["GT", "GTM", "Guatemala", "Americas"],
  ["BZ", "BLZ", "Belize", "Americas"],
  ["HN", "HND", "Honduras", "Americas"],
  ["SV", "SLV", "El Salvador", "Americas"],
  ["NI", "NIC", "Nicaragua", "Americas"],
  ["CR", "CRI", "Costa Rica", "Americas"],
  ["PA", "PAN", "Panama", "Americas"],
  ["CU", "CUB", "Cuba", "Americas"],
  ["JM", "JAM", "Jamaica", "Americas"],
  ["HT", "HTI", "Haiti", "Americas"],
  ["DO", "DOM", "Dominican Republic", "Americas"],
  ["BS", "BHS", "Bahamas", "Americas"],
  ["TT", "TTO", "Trinidad and Tobago", "Americas"],
  ["BB", "BRB", "Barbados", "Americas"],
  ["LC", "LCA", "Saint Lucia", "Americas"],
  ["GD", "GRD", "Grenada", "Americas"],
  ["VC", "VCT", "Saint Vincent and the Grenadines", "Americas"],
  ["AG", "ATG", "Antigua and Barbuda", "Americas"],
  ["DM", "DMA", "Dominica", "Americas"],
  ["KN", "KNA", "Saint Kitts and Nevis", "Americas"],
  ["VE", "VEN", "Venezuela", "Americas"],
  ["EC", "ECU", "Ecuador", "Americas"],
  ["BO", "BOL", "Bolivia", "Americas"],
  ["PY", "PRY", "Paraguay", "Americas"],
  ["UY", "URY", "Uruguay", "Americas"],
  ["GY", "GUY", "Guyana", "Americas"],
  ["SR", "SUR", "Suriname", "Americas"],
  ["FJ", "FJI", "Fiji", "Oceania"],
  ["PG", "PNG", "Papua New Guinea", "Oceania"],
  ["SB", "SLB", "Solomon Islands", "Oceania"],
  ["VU", "VUT", "Vanuatu", "Oceania"],
  ["WS", "WSM", "Samoa", "Oceania"],
  ["TO", "TON", "Tonga", "Oceania"],
  ["KI", "KIR", "Kiribati", "Oceania"],
  ["FM", "FSM", "Micronesia", "Oceania"],
  ["MH", "MHL", "Marshall Islands", "Oceania"],
  ["PW", "PLW", "Palau", "Oceania"],
  ["NR", "NRU", "Nauru", "Oceania"],
  ["TV", "TUV", "Tuvalu", "Oceania"],
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
  {
    slug: "university-of-lodz",
    name: "University of Lodz",
    officialName: "Uniwersytet Łódzki",
    countryIso2: "PL",
    city: "Łódź",
    websiteUrl: "https://www.uni.lodz.pl/en",
    type: "PUBLIC",
  },
  {
    slug: "ucsi-university",
    name: "UCSI University",
    officialName: "UCSI University",
    countryIso2: "MY",
    city: "Springhill, Negeri Sembilan",
    websiteUrl: "https://www.ucsiuniversity.edu.my/",
    type: "PRIVATE",
  },
  {
    slug: "ravensbourne-university-london",
    name: "Ravensbourne University London",
    officialName: "Ravensbourne University London",
    countryIso2: "GB",
    city: "London",
    websiteUrl: "https://www.ravensbourne.ac.uk/",
    type: "OTHER",
  },
  {
    slug: "university-of-the-people",
    name: "University of the People",
    officialName: "University of the People",
    countryIso2: "US",
    city: "Pasadena, California",
    websiteUrl: "https://www.uopeople.edu/",
    type: "OTHER",
  },
];

// Collected 2026-11-06 from each programme's live official page; source URLs below are those pages.
// Every figure, requirement and deadline is transcribed as published — nothing estimated or converted.
const PROGRAMMES: Array<{
  universitySlug: string;
  slug: string;
  title: string;
  degreeLevel: "FOUNDATION" | "UNDERGRADUATE" | "POSTGRADUATE";
  durationMonths: number | null;
  officialUrl: string;
  sourceUrl: string;
  admissionRequirements: Array<{
    kind: "QUALIFICATION" | "SUBJECT" | "OTHER";
    label: string;
    description: string;
    sourceUrl: string;
  }>;
  languageRequirements: Array<{
    testCode: string;
    minimumScore: string;
    scaleNote: string | null;
    sourceUrl: string;
  }>;
  tuitionFees: Array<{
    amount: string | null;
    currencyCode: string;
    period: string;
    notes: string;
    sourceUrl: string;
  }>;
  deadlines: Array<{
    label: string;
    opensAt: string | null;
    closesAt: string | null;
    sourceUrl: string;
  }>;
}> = [
  {
    universitySlug: "university-of-lodz",
    slug: "lodz-business-management-ba",
    title: "Business Management (full-time first cycle studies, in English)",
    degreeLevel: "UNDERGRADUATE",
    durationMonths: 36,
    officialUrl:
      "https://www.rekrutacja.uni.lodz.pl/en-gb/offer/WYZSZE2026C/programme/DLBMa_08/criteria/preview/turn/1/",
    sourceUrl: "https://www.uni.lodz.pl/en/ba-bachelors-degree",
    admissionRequirements: [
      {
        kind: "QUALIFICATION",
        label: "Secondary school-leaving certificate, IB diploma, EB diploma, or equivalent",
        description:
          "A secondary school-leaving certificate, International Baccalaureate diploma, European Baccalaureate diploma, or a foreign certificate entitling the holder to undertake higher education in the country where it was issued, plus a transcript of records.",
        sourceUrl:
          "https://www.uni.lodz.pl/en/candidate-zone/information-for-candidates-without-polish-citizenship/how-to-apply-for-ba-bachelors-for-candidates-who-do-not-hold-polish-citizenship",
      },
      {
        kind: "SUBJECT",
        label: "English plus one of Physics, Geography, History, IT or Mathematics",
        description:
          "English is an obligatory subject. One additional obligatory subject must be selected from Physics, Geography, History, Information Technology, Mathematics, or a foreign language.",
        sourceUrl:
          "https://www.rekrutacja.uni.lodz.pl/en-gb/offer/WYZSZE2026C/programme/DLBMa_08/criteria/preview/turn/1/",
      },
      {
        kind: "OTHER",
        label: "Entrance exam for applicants without IB/EB or a recognised-equivalent certificate",
        description:
          "Applicants with certificates from outside the EU/OECD/EFTA, or without an IB/EB diploma or a document recognised under an international agreement, take an entrance exam. The university states the absence of national examination results does not disqualify the candidate but awards points only at the basic level.",
        sourceUrl:
          "https://www.uni.lodz.pl/en/candidate-zone/information-for-candidates-without-polish-citizenship/how-to-apply-for-ba-bachelors-for-candidates-who-do-not-hold-polish-citizenship",
      },
    ],
    languageRequirements: [
      {
        testCode: "IELTS",
        minimumScore: "6.0",
        scaleNote: "English at B2 or above; IELTS 6.0 and TOEFL iBT 87 given as examples",
        sourceUrl:
          "https://www.uni.lodz.pl/en/candidate-zone/information-for-candidates-without-polish-citizenship/how-to-apply-for-ba-bachelors-for-candidates-who-do-not-hold-polish-citizenship",
      },
    ],
    tuitionFees: [
      {
        amount: "2500",
        currencyCode: "EUR",
        period: "YEAR",
        notes:
          "Listed as the programme tuition fee; the page does not explicitly label this as the international-student fee specifically.",
        sourceUrl: "https://www.uni.lodz.pl/en/ba-bachelors-degree",
      },
    ],
    deadlines: [
      {
        label:
          "2026 intake registration and application-fee payment (passed; next intake not yet published)",
        opensAt: "2026-05-07",
        closesAt: "2026-07-13",
        sourceUrl:
          "https://www.rekrutacja.uni.lodz.pl/en-gb/offer/WYZSZE2026C/programme/DLBMa_08/criteria/preview/turn/1/",
      },
    ],
  },
  {
    universitySlug: "ucsi-university",
    slug: "ucsi-foundation-in-arts",
    title: "Foundation in Arts",
    degreeLevel: "FOUNDATION",
    durationMonths: 12,
    officialUrl: "https://www.ucsiuniversity.edu.my/programmes/foundation-in-arts/",
    sourceUrl: "https://www.ucsiuniversity.edu.my/programmes/foundation-in-arts/",
    admissionRequirements: [
      {
        kind: "QUALIFICATION",
        label: "SPM/O-Levels 5 credits, UEC 3 credits, or recognised equivalent",
        description:
          "SPM/O-levels with 5 credits; UEC with 3 credits; or any other equivalent qualification recognised by the Malaysian Government.",
        sourceUrl: "https://www.ucsiuniversity.edu.my/programmes/foundation-in-arts/",
      },
    ],
    languageRequirements: [
      {
        testCode: "IELTS",
        minimumScore: "4.0",
        scaleNote:
          "Exemption threshold from Basic/Foundation English modules, not a hard admission minimum; TOEFL 30-31 and MUET Band 2 given as alternative exemption scores. Below SPM English B+ and no exemption score requires taking Basic English (SE004) before English Foundation (SE005) during the year.",
        sourceUrl: "https://www.ucsiuniversity.edu.my/programmes/foundation-in-arts/",
      },
    ],
    tuitionFees: [
      {
        amount: "40006",
        currencyCode: "MYR",
        period: "TOTAL",
        notes:
          "Approximate total fee for international students for the full programme; the university states the final amount can vary with visa-processing and administrative charges.",
        sourceUrl: "https://www.ucsiuniversity.edu.my/programmes/foundation-in-arts/",
      },
    ],
    deadlines: [],
  },
  {
    universitySlug: "ravensbourne-university-london",
    slug: "ravensbourne-business-management-international-year-one",
    title: "BSc (Hons) Business Management with International Year One",
    degreeLevel: "UNDERGRADUATE",
    durationMonths: 36,
    officialUrl:
      "https://www.ravensbourne.ac.uk/study/undergraduate/bsc-hons-business-management-international-year-one",
    sourceUrl:
      "https://www.ravensbourne.ac.uk/study/undergraduate/bsc-hons-business-management-international-year-one",
    admissionRequirements: [
      {
        kind: "QUALIFICATION",
        label: "GCSE English grade 4+ plus one of several listed alternative qualifications",
        description:
          "GCSE Grade 4 or above in English, plus one of: two A Levels at grade CC or above; BTEC Extended Diploma at grade MPP; UAL Level 3 Extended Diploma; T Level (pass or above); Access to Higher Education Diploma; International Baccalaureate at grade 24 or above; or other/mixed qualifications equivalent to 64 UCAS Tariff points.",
        sourceUrl:
          "https://www.ravensbourne.ac.uk/study/undergraduate/bsc-hons-business-management-international-year-one",
      },
      {
        kind: "OTHER",
        label:
          "Designed for applicants who don't meet direct-entry requirements for the standard degree",
        description:
          "The university describes the programme as an ideal pathway for students who want to join the Business Management degree at Ravensbourne but don't meet the direct entry requirements; the first year combines business modules with English-language and academic study support.",
        sourceUrl:
          "https://www.ravensbourne.ac.uk/study/undergraduate/bsc-hons-business-management-international-year-one",
      },
    ],
    languageRequirements: [
      {
        testCode: "IELTS",
        minimumScore: "5.5",
        scaleNote:
          "Overall 5.5, no component below 5.5, or an equivalent English-language qualification",
        sourceUrl:
          "https://www.ravensbourne.ac.uk/study/undergraduate/bsc-hons-business-management-international-year-one",
      },
    ],
    tuitionFees: [
      {
        amount: "18950",
        currencyCode: "GBP",
        period: "YEAR",
        notes:
          "International-student fee for 2026-27 entry only; the university states it is subject to change for 2027-28 entry.",
        sourceUrl:
          "https://www.ravensbourne.ac.uk/study/undergraduate/bsc-hons-business-management-international-year-one",
      },
    ],
    deadlines: [
      {
        label: "Intake starts (no fixed application deadline published)",
        opensAt: null,
        closesAt: "2027-01-01",
        sourceUrl:
          "https://www.ravensbourne.ac.uk/study/undergraduate/bsc-hons-business-management-international-year-one",
      },
    ],
  },
];

const SCHOLARSHIP_PROVIDERS: Array<{
  slug: string;
  name: string;
  type: "GOVERNMENT" | "UNIVERSITY" | "PRIVATE" | "FOUNDATION" | "CHARITY" | "OTHER";
  countryIso2: string | null;
  websiteUrl: string;
}> = [
  {
    slug: "university-of-the-people",
    name: "University of the People",
    type: "UNIVERSITY",
    countryIso2: "US",
    websiteUrl: "https://www.uopeople.edu/",
  },
  {
    slug: "romania-ministry-of-foreign-affairs",
    name: "Romanian Ministry of Foreign Affairs",
    type: "GOVERNMENT",
    countryIso2: "RO",
    websiteUrl: "https://www.mae.ro/",
  },
];

const SCHOLARSHIPS: Array<{
  providerSlug: string;
  universitySlug: string | null;
  hostCountryIso2: string | null;
  slug: string;
  name: string;
  degreeLevels: Array<"FOUNDATION" | "UNDERGRADUATE" | "POSTGRADUATE">;
  officialUrl: string;
  sourceUrl: string;
  eligibilityRules: Array<{
    kind: "QUALIFICATION" | "GRADE" | "LANGUAGE" | "OTHER";
    label: string;
    valueString: string | null;
    minValue: number | null;
    sourceUrl: string;
  }>;
  fundingComponents: Array<{
    component: "TUITION" | "STIPEND" | "ACCOMMODATION" | "OTHER";
    coverage: "PARTIAL" | "UNSPECIFIED";
    description: string;
    sourceUrl: string;
  }>;
  deadlines: Array<{
    label: string;
    opensAt: string | null;
    closesAt: string | null;
    sourceUrl: string;
  }>;
}> = [
  {
    providerSlug: "university-of-the-people",
    universitySlug: "university-of-the-people",
    hostCountryIso2: null,
    slug: "uopeople-scholarships",
    name: "UoPeople Scholarships",
    degreeLevels: [],
    officialUrl: "https://www.uopeople.edu/tuition-free/scholarships/",
    sourceUrl:
      "https://www.uopeople.edu/tuition-free/scholarships/terms-conditions-uopeoples-scholarships/",
    eligibilityRules: [
      {
        kind: "OTHER",
        label: "Open to accepted or currently enrolled students; no GPA minimum stated",
        valueString:
          "Anyone struggling to afford higher education can apply once accepted to UoPeople; applications are based on self-evaluation and trust, no financial documentation required.",
        minValue: null,
        sourceUrl: "https://www.uopeople.edu/tuition-free/scholarships/",
      },
      {
        kind: "OTHER",
        label: "Must maintain Satisfactory Academic Progress to keep the award",
        valueString:
          "A scholarship may be at risk if the recipient is placed on Academic Warning, and may be withdrawn if required progress is not maintained.",
        minValue: null,
        sourceUrl:
          "https://www.uopeople.edu/tuition-free/scholarships/terms-conditions-uopeoples-scholarships/",
      },
    ],
    fundingComponents: [
      {
        component: "TUITION",
        coverage: "PARTIAL",
        description:
          "Funds are allocated to the student's account solely to pay course Assessment Fees (up to 10 Assessment Fees per award); not a tuition-wide or living-cost award.",
        sourceUrl:
          "https://www.uopeople.edu/tuition-free/scholarships/terms-conditions-uopeoples-scholarships/",
      },
    ],
    deadlines: [],
  },
  {
    providerSlug: "romania-ministry-of-foreign-affairs",
    universitySlug: null,
    hostCountryIso2: "RO",
    slug: "romania-mfa-non-eu-scholarships-2026-2027",
    name: "Ministry of Foreign Affairs Scholarships for non-EU citizens (2026-2027)",
    degreeLevels: ["UNDERGRADUATE", "POSTGRADUATE"],
    officialUrl: "https://studyinromania.gov.ro/mfa_2026-2027",
    sourceUrl: "https://scholarships.studyinromania.gov.ro/scholarship-about",
    eligibilityRules: [
      {
        kind: "GRADE",
        label: "Average of at least 7/10 (or 'Good') in the last graduated school",
        valueString:
          "7 out of 10 in the Romanian scoring system, or the 'Good' score, as applicable",
        minValue: 7,
        sourceUrl: "https://scholarships.studyinromania.gov.ro/scholarship-about",
      },
      {
        kind: "QUALIFICATION",
        label: "Baccalaureate or equivalent for bachelor's applicants",
        valueString:
          "Completed high-school or pre-university studies and obtained a baccalaureate degree or equivalent",
        minValue: null,
        sourceUrl: "https://scholarships.studyinromania.gov.ro/scholarship-about",
      },
      {
        kind: "OTHER",
        label: "Nationality exclusions apply",
        valueString:
          "Excludes applicants of Romanian origin and historical communities covered by other programmes, people with protection status in Romania, specified stateless persons, diplomatic/consular staff and certain family members, certain international-organisation staff and family members, and recipients of another Romanian state scholarship for the same study cycle.",
        minValue: null,
        sourceUrl: "https://studyinromania.gov.ro/mfa_2026-2027",
      },
    ],
    fundingComponents: [
      {
        component: "TUITION",
        coverage: "PARTIAL",
        description:
          "Tuition for the Romanian-language preparatory year and for the actual studies, up to the duration of the study cycle; registration/application fees waived.",
        sourceUrl: "https://scholarships.studyinromania.gov.ro/scholarship-about",
      },
      {
        component: "STIPEND",
        coverage: "UNSPECIFIED",
        description:
          "A monthly scholarship during the preparatory year and during bachelor's/master's/doctoral studies; monetary amount not stated on the cited page.",
        sourceUrl: "https://scholarships.studyinromania.gov.ro/scholarship-about",
      },
      {
        component: "ACCOMMODATION",
        coverage: "UNSPECIFIED",
        description:
          "Accommodation in student dormitories, subject to available places and the allocated subsidy.",
        sourceUrl: "https://scholarships.studyinromania.gov.ro/scholarship-about",
      },
    ],
    deadlines: [
      {
        label: "2026-2027 call (passed; next call not yet published)",
        opensAt: null,
        closesAt: "2026-03-31",
        sourceUrl: "https://studyinromania.gov.ro/mfa_2026-2027",
      },
    ],
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

  const universityBySlug = new Map(
    (await db.university.findMany({ select: { id: true, slug: true } })).map((u) => [u.slug, u.id]),
  );

  for (const programme of PROGRAMMES) {
    const universityId = universityBySlug.get(programme.universitySlug);
    if (!universityId) continue;
    const record = await db.programme.upsert({
      where: { slug: programme.slug },
      update: {
        title: programme.title,
        degreeLevel: programme.degreeLevel,
        durationMonths: programme.durationMonths,
        officialUrl: programme.officialUrl,
      },
      create: {
        slug: programme.slug,
        universityId,
        title: programme.title,
        degreeLevel: programme.degreeLevel,
        durationMonths: programme.durationMonths,
        officialUrl: programme.officialUrl,
        sourceUrl: programme.sourceUrl,
        verificationStatus: "PENDING_REVIEW",
        lastCheckedAt: now,
      },
    });

    for (const requirement of programme.admissionRequirements) {
      const existing = await db.admissionRequirement.findFirst({
        where: { programmeId: record.id, label: requirement.label },
      });
      if (existing) continue;
      await db.admissionRequirement.create({
        data: {
          programmeId: record.id,
          kind: requirement.kind,
          label: requirement.label,
          description: requirement.description,
          sourceUrl: requirement.sourceUrl,
          verificationStatus: "PENDING_REVIEW",
          lastCheckedAt: now,
        },
      });
    }

    for (const language of programme.languageRequirements) {
      const existing = await db.languageRequirement.findFirst({
        where: { programmeId: record.id, testCode: language.testCode },
      });
      if (existing) continue;
      await db.languageRequirement.create({
        data: {
          programmeId: record.id,
          testCode: language.testCode,
          minimumScore: language.minimumScore,
          scaleNote: language.scaleNote,
          sourceUrl: language.sourceUrl,
          verificationStatus: "PENDING_REVIEW",
          lastCheckedAt: now,
        },
      });
    }

    for (const fee of programme.tuitionFees) {
      const existing = await db.tuitionFee.findFirst({
        where: { programmeId: record.id, currencyCode: fee.currencyCode, period: fee.period },
      });
      if (existing) continue;
      await db.tuitionFee.create({
        data: {
          programmeId: record.id,
          amount: fee.amount,
          currencyCode: fee.currencyCode,
          period: fee.period,
          isInternational: true,
          notes: fee.notes,
          sourceUrl: fee.sourceUrl,
          verificationStatus: "PENDING_REVIEW",
          lastCheckedAt: now,
        },
      });
    }

    for (const deadline of programme.deadlines) {
      const existing = await db.programmeDeadline.findFirst({
        where: { programmeId: record.id, label: deadline.label },
      });
      if (existing) continue;
      await db.programmeDeadline.create({
        data: {
          programmeId: record.id,
          label: deadline.label,
          opensAt: deadline.opensAt ? new Date(deadline.opensAt) : null,
          closesAt: deadline.closesAt ? new Date(deadline.closesAt) : null,
          sourceUrl: deadline.sourceUrl,
          verificationStatus: "PENDING_REVIEW",
          lastCheckedAt: now,
        },
      });
    }
  }

  for (const provider of SCHOLARSHIP_PROVIDERS) {
    await db.scholarshipProvider.upsert({
      where: { slug: provider.slug },
      update: { name: provider.name, type: provider.type, websiteUrl: provider.websiteUrl },
      create: {
        slug: provider.slug,
        name: provider.name,
        type: provider.type,
        countryId: provider.countryIso2 ? (countryByIso2.get(provider.countryIso2) ?? null) : null,
        websiteUrl: provider.websiteUrl,
        sourceUrl: provider.websiteUrl,
        verificationStatus: "UNVERIFIED",
        lastCheckedAt: now,
      },
    });
  }

  const providerBySlug = new Map(
    (await db.scholarshipProvider.findMany({ select: { id: true, slug: true } })).map((p) => [
      p.slug,
      p.id,
    ]),
  );

  for (const scholarship of SCHOLARSHIPS) {
    const providerId = providerBySlug.get(scholarship.providerSlug);
    if (!providerId) continue;
    const record = await db.scholarship.upsert({
      where: { slug: scholarship.slug },
      update: { name: scholarship.name, degreeLevels: scholarship.degreeLevels },
      create: {
        slug: scholarship.slug,
        name: scholarship.name,
        providerId,
        universityId: scholarship.universitySlug
          ? (universityBySlug.get(scholarship.universitySlug) ?? null)
          : null,
        hostCountryId: scholarship.hostCountryIso2
          ? (countryByIso2.get(scholarship.hostCountryIso2) ?? null)
          : null,
        degreeLevels: scholarship.degreeLevels,
        officialUrl: scholarship.officialUrl,
        sourceUrl: scholarship.sourceUrl,
        verificationStatus: "PENDING_REVIEW",
        lastCheckedAt: now,
      },
    });

    for (const rule of scholarship.eligibilityRules) {
      const existing = await db.scholarshipEligibilityRule.findFirst({
        where: { scholarshipId: record.id, label: rule.label },
      });
      if (existing) continue;
      await db.scholarshipEligibilityRule.create({
        data: {
          scholarshipId: record.id,
          kind: rule.kind,
          label: rule.label,
          valueString: rule.valueString,
          minValue: rule.minValue,
          sourceUrl: rule.sourceUrl,
          verificationStatus: "PENDING_REVIEW",
          lastCheckedAt: now,
        },
      });
    }

    for (const component of scholarship.fundingComponents) {
      await db.scholarshipFundingComponent.upsert({
        where: {
          scholarshipId_component: { scholarshipId: record.id, component: component.component },
        },
        update: {
          coverage: component.coverage,
          description: component.description,
          sourceUrl: component.sourceUrl,
        },
        create: {
          scholarshipId: record.id,
          component: component.component,
          coverage: component.coverage,
          description: component.description,
          sourceUrl: component.sourceUrl,
          verificationStatus: "PENDING_REVIEW",
          lastCheckedAt: now,
          isSpecified: true,
        },
      });
    }

    for (const deadline of scholarship.deadlines) {
      const existing = await db.scholarshipDeadline.findFirst({
        where: { scholarshipId: record.id, label: deadline.label },
      });
      if (existing) continue;
      await db.scholarshipDeadline.create({
        data: {
          scholarshipId: record.id,
          label: deadline.label,
          opensAt: deadline.opensAt ? new Date(deadline.opensAt) : null,
          closesAt: deadline.closesAt ? new Date(deadline.closesAt) : null,
          sourceUrl: deadline.sourceUrl,
          verificationStatus: "PENDING_REVIEW",
          lastCheckedAt: now,
        },
      });
    }
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
    programmes: await db.programme.count(),
    admissionRequirements: await db.admissionRequirement.count(),
    languageRequirements: await db.languageRequirement.count(),
    tuitionFees: await db.tuitionFee.count(),
    programmeDeadlines: await db.programmeDeadline.count(),
    scholarshipProviders: await db.scholarshipProvider.count(),
    scholarships: await db.scholarship.count(),
    scholarshipEligibilityRules: await db.scholarshipEligibilityRule.count(),
    scholarshipFundingComponents: await db.scholarshipFundingComponent.count(),
    scholarshipDeadlines: await db.scholarshipDeadline.count(),
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
