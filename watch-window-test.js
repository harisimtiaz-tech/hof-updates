// exposes the draw-window maths for the self-test
const { SETTINGS } = require("./config");
function drawWindowFrom(lastDrawText) {
  const m = String(lastDrawText || "").match(/(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})/);
  if (!m) return null;
  const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const mo = months[m[2].toLowerCase()];
  if (mo === undefined) return null;
  const last = Date.UTC(+m[3], mo, +m[1]);
  const fmt = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const mid = last + SETTINGS.DRAW_INTERVAL_DAYS * 86400000;
  return { last: lastDrawText, window: `${fmt(mid - 2*86400000)} to ${fmt(mid + 3*86400000)}`, overdue: Date.now() > mid + 5*86400000 };
}
module.exports = drawWindowFrom("441 on 04-Sep-2026");
module.exports.drawWindowFrom = drawWindowFrom;
