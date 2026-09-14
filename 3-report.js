// 3-report.js — the Monday email.
const { SETTINGS } = require("./config");

const C = { navy:"#16205e", royal:"#1f2f8f", ink:"#1f2937", body:"#3f4a5a", soft:"#868e9b",
  line:"#e6e9f1", panel:"#f7f9fc", bad:"#c0392b", badbg:"#fdecea", warn:"#b06a10",
  warnbg:"#fff5e8", good:"#1e7a4d", goodbg:"#e9f6ee" };
const F = "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const esc = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const money = (v, unit) => (unit ? `${unit} ` : "") + String(v ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const heading = (t, accent) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 12px"><tr>
  <td style="border-left:4px solid ${accent};padding:0 0 0 10px;font:700 15px/1.3 ${F};color:${C.navy}">${esc(t)}</td></tr></table>`;
const para = (h, size=14, col=C.body) => `<div style="font:400 ${size}px/1.65 ${F};color:${col};margin:0 0 12px">${h}</div>`;

// one changed figure, with the evidence to check it against
const changeCard = (r) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;background:#fffdfd;border:1px solid ${C.badbg};border-left:4px solid ${C.bad};border-radius:6px">
<tr><td style="padding:14px 16px">
  <div style="font:700 15px/1.4 ${F};color:${C.ink}">${esc(r.item.country)} &middot; ${esc(r.item.label)}</div>
  <div style="font:400 12px/1.5 ${F};color:${C.soft};margin-top:3px">Workbook tab: ${esc(r.item.tab)}</div>
  <div style="font:400 16px/1.5 ${F};margin-top:10px">
    <span style="color:${C.soft};text-decoration:line-through">${esc(money(r.was, r.item.unit))}</span>
    <span style="color:${C.soft};margin:0 8px">&rarr;</span>
    <strong style="color:${C.bad}">${esc(money(r.now, r.item.unit))}</strong>
    ${r.delta !== null && r.delta !== undefined ? `<span style="color:${C.soft};font-size:13px"> (${r.delta > 0 ? "+" : ""}${r.delta})</span>` : ""}
  </div>
  ${r.quote ? `<div style="font:400 13px/1.6 ${F};color:${C.body};margin-top:10px;padding:9px 12px;background:${C.panel};border-radius:6px">&ldquo;${esc(r.quote)}&rdquo;</div>` : ""}
  ${r.note ? `<div style="font:400 12.5px/1.5 ${F};color:${C.warn};margin-top:7px">${esc(r.note)}</div>` : ""}
  <div style="margin-top:10px"><a href="${esc(r.sourceUrl)}" style="color:${C.royal};font:600 13px/1.4 ${F};text-decoration:none">Check the official page &rarr;</a></div>
</td></tr></table>`;

const rowTable = (rows, headers) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${C.line};border-radius:6px">
  <tr>${headers.map((h,i)=>`<td ${i?'align="right"':''} style="background:${C.panel};padding:8px 12px;font:700 11px/1.3 ${F};letter-spacing:.05em;text-transform:uppercase;color:${C.navy}">${esc(h)}</td>`).join("")}</tr>
  ${rows.map((r,ri)=>`<tr>${r.map((c,i)=>`<td ${i?'align="right"':''} style="padding:8px 12px;border-top:1px solid ${C.line};font:400 13px/1.5 ${F};color:${i?C.ink:C.body};${ri%2?`background:${C.panel};`:''}">${esc(c)}</td>`).join("")}</tr>`).join("")}
</table>`;

function buildReport({ results, drawWindow, dryRun }) {
  const changed = results.filter((r) => r.status === "CHANGED");
  const unreadable = results.filter((r) => r.status === "unreadable" || r.status === "not-stated");
  const fine = results.filter((r) => r.status === "unchanged");

  const banner = changed.length
    ? { bg: C.badbg, fg: C.bad, text: `<strong>${changed.length} figure${changed.length>1?"s":""} changed.</strong> Update the workbook, then update <code>current</code> in config.js so it is not reported again.` }
    : unreadable.length
      ? { bg: C.warnbg, fg: C.warn, text: `<strong>Nothing changed</strong>, but ${unreadable.length} figure${unreadable.length>1?"s"
:""} could not be checked. Those are listed below.` }
      : { bg: C.goodbg, fg: C.good, text: `<strong>Nothing changed.</strong> All ${results.length} figures match the workbook.` };

  const body = `
${dryRun ? para(`<span style="color:${C.warn};font-weight:600">Dry run.</span> Not emailed to anyone else.`, 13) : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px"><tr>
<td style="background:${banner.bg};border-left:4px solid ${banner.fg};padding:13px 16px;font:400 14.5px/1.6 ${F};color:${banner.fg}">${banner.text}</td>
</tr></table>

${changed.length ? heading("Changed — update the workbook", C.bad) + changed.map(changeCard).join("") : ""}

${drawWindow ? heading("Next Express Entry draw", C.royal) +
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.panel};border:1px solid ${C.line};border-radius:6px"><tr><td style="padding:14px 16px">
    <div style="font:400 13px/1.5 ${F};color:${C.soft}">Last draw</div>
    <div style="font:700 15px/1.4 ${F};color:${C.ink};margin-top:2px">${esc(drawWindow.last)}</div>
    <div style="font:400 13px/1.5 ${F};color:${C.soft};margin-top:10px">Expected window</div>
    <div style="font:700 16px/1.4 ${F};color:${C.royal};margin-top:2px">${esc(drawWindow.window)}</div>
    <div style="font:400 12.5px/1.6 ${F};color:${C.warn};margin-top:10px">
      <strong>Estimate only.</strong> IRCC never announces draw dates in advance. This is calculated from the usual two-week rhythm for planning, and must never be quoted to a client as a date.
    </div>
  </td></tr></table>` : ""}

${unreadable.length ? heading("Could not be checked", C.warn) +
  para(`These were not verified this week. That is not the same as unchanged — the pages may have moved or changed shape.`, 13, C.soft) +
  rowTable(unreadable.map((r)=>[`${r.item.country} · ${r.item.label}`, r.detail || r.status]), ["Figure", "Why"]) : ""}

${fine.length ? heading("Checked and unchanged", C.soft) +
  rowTable(fine.map((r)=>[`${r.item.country} · ${r.item.label}`, money(r.item.current, r.item.unit)]), ["Figure", "Current"]) : ""}

${para(`<a href="${SETTINGS.WORKBOOK_URL}" style="color:${C.royal};font-weight:600;text-decoration:none">Open the workbook &rarr;</a>`, 14)}
`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef1f6;padding:26px 12px;margin:0">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:640px;max-width:640px;background:#fff;border-radius:8px;overflow:hidden">
  <tr><td style="background-color:${C.navy};background-image:linear-gradient(120deg,${C.navy},${C.royal});padding:22px 26px">
    <div style="font:700 21px/1.25 ${F};color:#fff">Immigration sources — weekly check</div>
    <div style="font:400 12.5px/1.5 ${F};color:#aab0d4;margin-top:5px">${new Date().toISOString().slice(0,10)} &middot; ${results.length} figures &middot; ${changed.length} changed</div>
  </td></tr>
  <tr><td style="padding:22px 26px 26px">${body}</td></tr>
  <tr><td style="background:${C.panel};border-top:1px solid ${C.line};padding:16px 26px;font:400 11.5px/1.6 ${F};color:${C.soft}">
    <strong style="color:${C.body}">Ali Raza</strong> &middot; Compliance &middot; HOF Migration<br>
    Read-only. Nothing in the workbook is changed by this agent &mdash; every figure is updated by a person.
  </td></tr>
</table></td></tr></table>`;
}

async function sendReport(subject, html) {
  if (!process.env.RESEND_KEY) { console.log("No RESEND_KEY set."); return false; }
  const body = { from: SETTINGS.FROM_EMAIL, to: [SETTINGS.REPORT_TO], subject, html };
  if (SETTINGS.REPORT_CC.length) body.cc = SETTINGS.REPORT_CC;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.log(`Report failed: ${res.status} ${(await res.text()).slice(0,200)}`); return false; }
  return true;
}

module.exports = { buildReport, sendReport };
