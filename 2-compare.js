// 2-compare.js — did it change?
//
// Comparison is deliberately forgiving about formatting and strict about value: "1,590",
// "1590" and "CAD 1590" are the same figure, while 1590 and 1600 are not. A figure the
// agent could NOT read is never reported as changed — that is the difference between
// "this moved" and "we could not check", and conflating them would be worse than useless.
const clean = (v) => String(v ?? "").replace(/[^0-9a-zA-Z.\-]/g, "").toLowerCase();
const num = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? n : null; };

function compare(item, answer) {
  if (!answer || answer.error)
    return { status: "unreadable", detail: answer?.error || "no answer", item };
  if (answer.found === false)
    return { status: "not-stated", detail: answer.note || "the page does not state it", item };

  const a = num(answer.value), b = num(item.current);
  const same = (a !== null && b !== null) ? a === b : clean(answer.value) === clean(item.current);

  return {
    status: same ? "unchanged" : "CHANGED",
    item,
    was: item.current,
    now: answer.value,
    quote: answer.quote || "",
    note: answer.note || "",
    delta: (a !== null && b !== null && a !== b) ? +(a - b).toFixed(2) : null,
  };
}

module.exports = { compare, num };
