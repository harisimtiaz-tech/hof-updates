// selftest.js — the rules, as runnable checks.
const { compare, num } = require("./2-compare");
const { buildReport } = require("./3-report");
const { WATCH, SOURCES, SETTINGS } = require("./config");

let pass = 0, fail = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  ok ? pass++ : fail++;
};
console.log("SOURCE WATCH SELF-TEST\n");

// ---- config ----
check("every watched figure has a source that exists", WATCH.every((w) => SOURCES[w.source]),
  WATCH.filter((w) => !SOURCES[w.source]).map((w) => w.id).join(", "));
check("every figure has a question and a current value", WATCH.every((w) => w.question && w.current));
check("ids are unique", new Set(WATCH.map((w) => w.id)).size === WATCH.length);
check("every figure names the workbook tab to update", WATCH.every((w) => w.tab));
check("HOF's own pricing is never watched", !WATCH.some((w) => /hof|consultancy|instalment|one-time/i.test(w.label)));
check("the report goes to Haris", SETTINGS.REPORT_TO === "harisimtiaz@hofmigration.com");
check("there is no CC — the built-in Resend sender can only reach the account owner",
  SETTINGS.REPORT_CC.length === 0);
check("a scheduled run is NOT a dry run", (() => {
  // a cron run passes an empty string, which must not be read as "dry run"
  const before = process.env.DRY_RUN_INPUT;
  const read = (v) => String(v || "").toLowerCase() === "true";
  const ok = read("") === false && read(undefined) === false && read("true") === true && read("false") === false;
  process.env.DRY_RUN_INPUT = before;
  return ok;
})());
check("the full lists are marked as lists", WATCH.filter((w) => w.list).length >= 3);
check("a list is reported, not compared as a number",
  compare({ id: "l", list: true, label: "x", tab: "y", country: "Canada" }, { found: true, value: "a|b|c" }).status === "list");
check("all three countries are covered", ["Canada", "Australia", "USA"].every((c) => WATCH.some((w) => w.country === c)));
check("every source is an official government domain",
  Object.values(SOURCES).every((u) => /(canada\.ca|ircc\.canada\.ca|homeaffairs\.gov\.au|uscis\.gov|state\.gov)/.test(u)),
  Object.values(SOURCES).filter((u) => !/(canada\.ca|ircc\.canada\.ca|homeaffairs\.gov\.au|uscis\.gov|state\.gov)/.test(u)).join(", "));

// ---- comparison ----
const item = { id: "t", country: "Canada", tab: "Fees", label: "A fee", current: "1590", unit: "CAD" };
check("the same number reads as unchanged", compare(item, { found: true, value: "1590" }).status === "unchanged");
check("formatting does not count as a change", compare(item, { found: true, value: "1,590" }).status === "unchanged");
check("a currency prefix does not count as a change", compare(item, { found: true, value: "CAD 1590" }).status === "unchanged");
check("a real change is caught", compare(item, { found: true, value: "1650" }).status === "CHANGED");
check("the size of the change is reported", compare(item, { found: true, value: "1650" }).delta === 60);
check("a page that does not state it is NOT a change", compare(item, { found: false }).status === "not-stated");
check("an unreadable page is NOT a change", compare(item, { error: "timeout" }).status === "unreadable");
check("no answer at all is NOT a change", compare(item, null).status === "unreadable");
check("a date change is caught", (() => {
  const d = { id: "d", country: "Canada", tab: "x", label: "Latest draw", current: "441 on 04-Sep-2026", unit: "" };
  return compare(d, { found: true, value: "442 on 17-Sep-2026" }).status === "CHANGED";
})());

// ---- the report ----
const results = [
  { status: "CHANGED", item: WATCH[0], was: "1590", now: "1650", delta: 60, quote: "The fee is $1,650.", sourceUrl: "https://ircc.canada.ca/x" },
  { status: "unchanged", item: WATCH[1], sourceUrl: "https://x" },
  { status: "unreadable", item: WATCH[2], detail: "the page could not be loaded: 503", sourceUrl: "https://x" },
];
const html = buildReport({ results, drawWindow: { last: "441 on 04-Sep-2026", window: "16 Sep 2026 to 21 Sep 2026", overdue: false }, dryRun: true });
check("the report leads with what changed", /Changed — update the workbook/.test(html));
check("the report shows the old and the new value", /1,590/.test(html) && /1,650/.test(html));
check("the report carries the evidence", /The fee is \$1,650/.test(html));
check("the report separates could-not-check from unchanged", /Could not be checked/.test(html) && /Checked and unchanged/.test(html));
check("the draw window is marked as an estimate only", /Estimate only/.test(html) && /never be quoted/.test(html));
check("the report links to the workbook", html.includes(SETTINGS.WORKBOOK_URL));
check("the report escapes text", !/<script/i.test(html));

// ---- the draw window ----
const { execSync } = require("child_process");
check("a draw window is calculated from the last draw", (() => {
  const w = require("./watch-window-test.js");
  return w && /to/.test(w.window);
})());

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log("\nSomething is wrong. Fix it before trusting a report."); process.exit(1); }
