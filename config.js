// config.js — what to watch, and what the workbook currently says.
//
// HOW THIS WORKS: each entry holds the value the workbook holds today. Every week the
// agent reads the official page, works out the current value, and reports anything that
// differs. It never edits the workbook — a person does that, after reading the evidence.
//
// AFTER YOU UPDATE THE WORKBOOK, update `current` here too, or the same change is
// reported again next week.

const SETTINGS = {
  REPORT_TO: process.env.REPORT_TO || "razaali@hofmigration.com",
  REPORT_CC: [],
  FROM_EMAIL: process.env.FROM_EMAIL || "onboarding@resend.dev",
  DRY_RUN: process.env.DRY_RUN_INPUT ? process.env.DRY_RUN_INPUT === "true" : true,
  GEMINI_MODEL: "gemini-flash-lite-latest",
  CONCURRENCY: 3,
  // Express Entry rounds run about every two weeks. Used to work out the expected
  // window only — IRCC never announces dates, so this is never a date to quote.
  DRAW_INTERVAL_DAYS: 14,
  WORKBOOK_URL: "https://docs.google.com/spreadsheets/d/10hOfJD2RvaxXWev8_I4LgydMTd1zT_Nf_Wz19_uvp2w/edit",
};

// Pages fetched once and reused by every item that reads from them.
const SOURCES = {
  ircc_fees: "https://ircc.canada.ca/english/information/fees/fees.asp",
  ircc_draws: "https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html",
  ircc_categories: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations/category-based-selection.html",
  ircc_pof: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html",
  au_rounds: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds",
  au_fees: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/fees-and-charges",
  au_occupations: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list",
  uscis_fees: "https://www.uscis.gov/g-1055",
  uscis_immigrant_fee: "https://www.uscis.gov/forms/filing-fees/uscis-immigrant-fee",
  state_visa_fees: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html",
};

// Each item: what to ask the page, and what the workbook says today.
const WATCH = [
  // ---------------- Canada ----------------
  { id: "ca_pr_fee", country: "Canada", tab: "Fees & Calculator",
    label: "PR application fee including RPRF, per adult",
    source: "ircc_fees", unit: "CAD", current: "1590",
    question: "What is the total permanent residence application fee INCLUDING the Right of Permanent Residence Fee, for one adult applicant under economic classes? Give the single total number in CAD." },

  { id: "ca_child_fee", country: "Canada", tab: "Fees & Calculator",
    label: "Dependent child fee", source: "ircc_fees", unit: "CAD", current: "270",
    question: "What is the permanent residence application fee for one dependent child? Give the number in CAD." },

  { id: "ca_biometrics", country: "Canada", tab: "Fees & Calculator",
    label: "Biometrics, per person", source: "ircc_fees", unit: "CAD", current: "85",
    question: "What is the biometrics fee for one person? Give the number in CAD." },

  { id: "ca_biometrics_family", country: "Canada", tab: "Fees & Calculator",
    label: "Biometrics, family maximum", source: "ircc_fees", unit: "CAD", current: "170",
    question: "What is the maximum biometrics fee for a family applying together? Give the number in CAD." },

  { id: "ca_pof_4", country: "Canada", tab: "Fees & Calculator",
    label: "Proof of funds, family of 4", source: "ircc_pof", unit: "CAD", current: "28362",
    question: "For Express Entry proof of funds, how much money is required for a family size of 4? Give the number in CAD." },

  { id: "ca_latest_draw", country: "Canada", tab: "Dashboard + Draw History",
    label: "Latest Express Entry draw", source: "ircc_draws", unit: "", current: "441 on 04-Sep-2026",
    question: "What is the MOST RECENT Express Entry round of invitations? Give the round number, the date, the category, the number of invitations and the CRS cut-off score. Format the value as: <number> on <DD-MMM-YYYY>" },

  { id: "ca_categories", country: "Canada", tab: "Dashboard + Occupations",
    label: "Number of active category-based selection categories",
    source: "ircc_categories", unit: "", current: "10",
    question: "How many categories are currently active for category-based selection? Give just the number. Also list their names in the quote." },

  // ---------------- Australia ----------------
  { id: "au_189_fee", country: "Australia", tab: "Fees & Calculator",
    label: "Subclass 189 visa charge, main applicant", source: "au_fees", unit: "AUD", current: "6135",
    question: "What is the visa application charge for the main applicant of a Subclass 189 Skilled Independent visa? Give the number in AUD." },

  { id: "au_190_fee", country: "Australia", tab: "Fees & Calculator",
    label: "Subclass 190 visa charge, main applicant", source: "au_fees", unit: "AUD", current: "6140",
    question: "What is the visa application charge for the main applicant of a Subclass 190 Skilled Nominated visa? Give the number in AUD." },

  { id: "au_latest_round", country: "Australia", tab: "Dashboard + Draw History",
    label: "Latest SkillSelect invitation round", source: "au_rounds", unit: "", current: "04-Jun-2026",
    question: "What is the date of the most recent SkillSelect invitation round for Subclass 189? Format as DD-MMM-YYYY. Mention the number of invitations in the quote if stated." },

  // ---------------- USA ----------------
  { id: "us_i140", country: "USA", tab: "Fees & Calculator",
    label: "Form I-140 filing fee", source: "uscis_fees", unit: "USD", current: "715",
    question: "What is the filing fee for Form I-140, Immigrant Petition for Alien Worker? Give the number in USD, excluding the Asylum Program Fee." },

  { id: "us_asylum_fee", country: "USA", tab: "Fees & Calculator",
    label: "Asylum Program Fee, self-petitioner", source: "uscis_fees", unit: "USD", current: "300",
    question: "What is the Asylum Program Fee for a self-petitioner filing Form I-140? Give the number in USD." },

  { id: "us_premium", country: "USA", tab: "Fees & Calculator",
    label: "Premium processing, Form I-907", source: "uscis_fees", unit: "USD", current: "2805",
    question: "What is the fee for Form I-907, Request for Premium Processing, for an I-140 petition? Give the number in USD." },

  { id: "us_immigrant_fee", country: "USA", tab: "Fees & Calculator",
    label: "USCIS Immigrant Fee", source: "uscis_immigrant_fee", unit: "USD", current: "235",
    question: "What is the USCIS Immigrant Fee per person? Give the number in USD." },

  { id: "us_iv_fee", country: "USA", tab: "Fees & Calculator",
    label: "Employment-based immigrant visa application fee", source: "state_visa_fees", unit: "USD", current: "345",
    question: "What is the immigrant visa application processing fee for employment-based applications, per person? Give the number in USD." },
];

module.exports = { SETTINGS, SOURCES, WATCH };
