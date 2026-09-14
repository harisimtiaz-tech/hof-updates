// 1-read.js — fetch each official page once, and read the figures off it.
//
// Government pages are not built for scraping and their markup changes, so the figures
// are read by AI from the page TEXT rather than matched with patterns. Every answer
// comes back with the sentence it was taken from, so a person can verify the number
// before it ever reaches the workbook.
const { SETTINGS, SOURCES } = require("./config");

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HOF-source-watch/1.0)", Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ").trim();
  return { text, length: text.length };
}

async function loadSources(log = console.log) {
  const pages = {};
  const names = Object.keys(SOURCES);
  for (const name of names) {
    try {
      const p = await fetchPage(SOURCES[name]);
      pages[name] = { ...p, url: SOURCES[name] };
      log(`  read ${name} (${p.length.toLocaleString()} chars)`);
    } catch (e) {
      pages[name] = { error: e.message, url: SOURCES[name] };
      log(`  FAILED ${name}: ${e.message}`);
    }
  }
  return pages;
}

// Asks the page a single question. Returns the value AND the sentence it came from, so
// nothing is ever changed on the agent's word alone.
async function askPage(pageText, item) {
  if (!process.env.GEMINI_KEY) return { error: "no GEMINI_KEY, cannot read the page" };
  const prompt = `You are reading an official government page and extracting ONE figure exactly as published. Do not calculate, estimate or infer. If the page does not clearly state it, say so.

Question: ${item.question}

Page text:
"""${String(pageText).slice(0, 28000)}"""

Reply ONLY JSON:
{"found": true|false, "value": "<the figure, digits only for money, no currency symbol or commas>", "quote": "<the exact sentence from the page that states it, max 30 words>", "note": "<anything important, e.g. the fee changes on a date, max 15 words>"}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${SETTINGS.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } }) });
    const t = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return { error: "could not read an answer from the page" };
    return JSON.parse(m[0]);
  } catch (e) { return { error: e.message }; }
}

module.exports = { loadSources, askPage, fetchPage };
