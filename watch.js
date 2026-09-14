// watch.js — the weekly run.
//
// Reads every official source, compares each figure against what the workbook holds,
// and emails what changed. It never edits the workbook: a person reads the evidence and
// updates it. That is deliberate — the QA sheet rates government fee accuracy as a
// critical error, so no number should reach a client without a human having seen it.
const { SETTINGS, WATCH, SOURCES } = require("./config");
const { loadSources, askPage } = require("./1-read");
const { compare, num } = require("./2-compare");
const { buildReport, sendReport } = require("./3-report");

// IRCC never publishes the next date, so it is estimated from the usual rhythm and
// labelled as an estimate everywhere it appears.
function drawWindowFrom(lastDrawText) {
  const m = String(lastDrawText || "").match(/(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})/);
  if (!m) return null;
  const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const mo = months[m[2].toLowerCase()];
  if (mo === undefined) return null;
  const last = Date.UTC(+m[3], mo, +m[1]);
  const fmt = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const mid = last + SETTINGS.DRAW_INTERVAL_DAYS * 86400000;
  return {
    last: `${lastDrawText}`,
    window: `${fmt(mid - 2 * 86400000)} to ${fmt(mid + 3 * 86400000)}`,
    overdue: Date.now() > mid + 5 * 86400000,
  };
}

async function main() {
  console.log(`=== Immigration source check — ${new Date().toISOString()} ===  DRY_RUN=${SETTINGS.DRY_RUN}`);
  if (!process.env.GEMINI_KEY) console.log(`!! No GEMINI_KEY — the pages cannot be read. Add the secret.`);
  if (!process.env.RESEND_KEY) console.log(`!! No RESEND_KEY — the report cannot be emailed. Add the secret.`);
  console.log(`Report goes to: ${SETTINGS.REPORT_TO}${SETTINGS.REPORT_CC.length ? ` (cc ${SETTINGS.REPORT_CC.join(", ")})` : ""}`);
  console.log(SETTINGS.DRY_RUN
    ? `DRY RUN: the report will be written to the artifact but NOT emailed.`
    : `LIVE: the report will be emailed at the end of this run.`);

  console.log(`\nReading ${Object.keys(SOURCES).length} official pages...`);
  const pages = await loadSources();

  console.log(`\nChecking ${WATCH.length} figures...`);
  const results = [];
  for (const item of WATCH) {
    const page = pages[item.source];
    if (!page || page.error) {
      results.push({ status: "unreadable", detail: `the page could not be loaded: ${page?.error || "unknown"}`, item, sourceUrl: SOURCES[item.source] });
      console.log(`  ?  ${item.id.padEnd(22)} page unavailable`);
      continue;
    }
    const answer = await askPage(page.text, item);
    const r = compare(item, answer);
    r.sourceUrl = page.url;
    results.push(r);
    const mark = r.status === "CHANGED" ? "!!" : r.status === "unchanged" ? "ok" : r.status === "list" ? "[]" : "? ";
    console.log(`  ${mark} ${item.id.padEnd(22)} ${r.status === "CHANGED" ? `${r.was} -> ${r.now}` : r.status}`);
  }

  const latest = results.find((r) => r.item.id === "ca_latest_draw");
  const drawWindow = drawWindowFrom(latest && latest.status === "CHANGED" ? latest.now : (latest ? latest.item.current : null));

  const changed = results.filter((r) => r.status === "CHANGED");
  const lists = results.filter((r) => r.status === "list");
  const unreadable = results.filter((r) => !["CHANGED", "unchanged", "list"].includes(r.status));

  console.log(`\n===== SUMMARY =====`);
  console.log(`${results.length} items | CHANGED ${changed.length} | lists refreshed ${lists.length} | unchanged ${results.length - changed.length - unreadable.length - lists.length} | not checked ${unreadable.length}`);
  if (changed.length) {
    console.log(`\nCHANGED — update the workbook, then update "current" in config.js:`);
    for (const r of changed) {
      console.log(`  ${r.item.country} · ${r.item.label}`);
      console.log(`     ${r.was}  ->  ${r.now}${r.delta !== null ? `  (${r.delta > 0 ? "+" : ""}${r.delta})` : ""}`);
      if (r.quote) console.log(`     "${r.quote}"`);
      console.log(`     ${r.sourceUrl}`);
    }
  }
  if (unreadable.length) {
    console.log(`\nNOT CHECKED — treat as unknown, not as unchanged:`);
    for (const r of unreadable) console.log(`  ${r.item.country} · ${r.item.label}: ${r.detail || r.status}`);
  }
  if (drawWindow) {
    console.log(`\nNext Express Entry draw: expected ${drawWindow.window}${drawWindow.overdue ? "  (the window has passed — check for a new draw)" : ""}`);
    console.log(`  Estimate only. IRCC does not announce dates. Never quote this to a client.`);
  }

  const html = buildReport({ results, drawWindow, dryRun: SETTINGS.DRY_RUN });
  require("fs").writeFileSync("source-check.html", html);
  console.log(`\nWrote source-check.html (download it from this run's Artifacts).`);

  if (SETTINGS.DRY_RUN) { console.log(`DRY RUN: not emailed.`); return; }
  const subject = changed.length
    ? `Immigration sources — ${changed.length} figure(s) changed`
    : unreadable.length ? `Immigration sources — nothing changed, ${unreadable.length} not checked`
    : `Immigration sources — nothing changed`;
  const ok = await sendReport(subject, html);
  if (ok) console.log(`\nSent to ${SETTINGS.REPORT_TO}`);
  else {
    console.log(`\n!! THE REPORT WAS NOT SENT.`);
    console.log(`   The findings are above and in the downloadable artifact, so nothing is lost.`);
    console.log(`   Usual causes: RESEND_KEY missing, or the sender can only reach the address`);
    console.log(`   the Resend account was registered with (${SETTINGS.REPORT_TO}).`);
    process.exitCode = 1;   // so the run shows as failed rather than quietly passing
  }
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
