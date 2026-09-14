# Immigration Reference Workbook — redesign and weekly updates

## Two things to fix today

**1. An internal note is sitting in a reference sheet.** The Dashboard reads:

> Next Express Entry draw — *"No fixed date announced - Ali bhai"*
> Next Subclass 189 round — *"No current official date - Ali bhai"*

A consultant reading that on a call sees a name, not an instruction. It should say
**"No date announced — do not quote one"**, which is what it actually means.

**2. The Australia occupation list looks cut off.** It ends at *Clinical Psychologist*,
which is alphabetically early. If the list really stops there, consultants will tell
clients an occupation is not eligible when it is. Worth checking against the
4 June 2026 round before anyone relies on it.

Everything else I checked adds up: Canada 3,990 + 170 biometrics, USA 1,015 petition
and 2,175 grand total, and every USD→AED conversion at 3.6725.

---

## The real problem: the workbook is organised by source, not by task

A consultant quoting a USA NIW client currently opens **four tabs**: Dashboard for
status, Fees & Calculator for government fees, HOF Fee Structure for the consultancy
price, and Sources to check it is current. On a live call, that is three tabs too many.

The fix is a single tab per country that answers everything for that call.

### The new structure

| Tab | Who uses it | What is on it |
|---|---|---|
| **START HERE** | everyone, first time | What each tab is for, what must never be quoted, who to ask |
| **🇨🇦 Canada — quote sheet** | consultants, on calls | Status, eligibility, government fees, HOF price, POF, what to say and what not to say |
| **🇦🇺 Australia — quote sheet** | consultants, on calls | Same shape |
| **🇺🇸 USA NIW — quote sheet** | consultants, on calls | Same shape |
| **Occupations** | consultants, when checking eligibility | Searchable, filtered by country |
| **Draw history** | managers, for trends | Unchanged |
| **Sources** | compliance | Unchanged |
| **QA errors** | managers and training | Unchanged |

The three quote sheets are the whole point. Each is one screen, laid out in the order a
call actually goes:

```
🇺🇸 USA — EB-2 NIW                              Last checked: 12 Sep 2026

1  IS THE CLIENT ELIGIBLE
   Advanced degree, OR bachelor's + 5 years progressive experience
   → if neither, stop. Do not proceed to pricing.

2  WHAT HOF CHARGES
   One-time              USD 6,000    AED 22,035    no approval needed
   Instalments           USD 8,000    AED 29,380    4,000 start + 4,000 after approval
   Absolute minimum      USD 5,000    AED 18,363    MANAGER APPROVAL REQUIRED
   Splitting the first 4,000 also needs Manager approval.

3  GOVERNMENT FEES — separate from our fee, the client pays these
   I-140 petition        USD 1,015    (715 filing + 300 Asylum Program)
   Premium processing    USD 2,805    optional
   Immigrant visa        USD 345      per person
   USCIS Immigrant Fee   USD 235      per person
   Example, client + spouse: USD 2,175 total

4  NEVER SAY
   ✗ "PR is guaranteed"          ✗ "the government will find you a job"
   ✗ a specific approval date    ✗ a price below the minimum without approval
```

Same shape for Canada and Australia, with POF on the Canada sheet because that is where
consultants get it wrong.

### Why this shape

The QA tab already tells you where consultants fail: **government fee accuracy**,
**HOF pricing compliance**, **misrepresentation**, and **proof of funds** are all rated
Critical or High. The quote sheet puts exactly those four things in front of them at the
moment they are about to make the mistake — the manager-approval rule sits next to the
price, and the "never say" list sits at the bottom of every sheet.

A reference nobody opens mid-call prevents nothing.

---

## The weekly update agent

### What it can realistically do

It cannot decide that a fee changed and silently rewrite the sheet — if it misreads a
government page, wrong numbers go to clients. What it can do is watch the official
sources and tell you the moment something moves.

**Every Monday morning it:**

1. Fetches each official source already listed in the Sources tab
2. Pulls the figures that matter: Canada PR and RPRF fees, biometrics, POF thresholds,
   the latest Express Entry draw number, date, category and cut-off, Australian visa
   charges for 189/190/491, the latest SkillSelect round, USCIS I-140, premium
   processing, immigrant visa and USCIS Immigrant Fee
3. Compares each against the value the workbook currently holds
4. Emails a report: **what changed, what it was, what it is now, and the source link**
5. Updates the "Last Checked" dates for everything that did not change

**The report only shouts when something actually moved:**

> **2 changes this week**
> **Canada — biometrics, family maximum** 170 → 180 CAD
> *ircc.canada.ca/english/information/fees/fees.asp*
> **Express Entry** — draw 442 on 17 Sep 2026, Provincial Nominee Program, 541 cut-off
> *Not yet in the workbook.*
>
> 14 other figures checked, unchanged.

### Getting changes into the sheet

Three options, in order of how much trust they need:

| | How it works | Trade-off |
|---|---|---|
| **Report only** | The agent emails changes, you edit the sheet | Safest. A person approves every number a client will hear. |
| **Live cells** | The agent publishes a CSV, and the sheet pulls it with `IMPORTDATA()` | Draw history and fees update themselves. No API access needed. |
| **Direct write** | The agent writes to the sheet | Needs Google Sheets API access, and a bad parse reaches clients unseen |

**My recommendation: report only for fees, live cells for draw history.**

Draw history is append-only factual data and low risk — a new row for draw 442 cannot
mislead anyone. Fees are what consultants quote to clients, and the QA tab already
records fee accuracy as a Critical error category. A human should approve those.

### What it will also catch

Beyond price changes, the same run can flag:

- **A source page that has moved or gone** — a dead official link in a compliance
  workbook is its own problem
- **Nothing checked for N weeks** — if the agent stops running, the report says so
  rather than going quiet, so silence is never mistaken for "nothing changed"
- **A category list that changed** — Canada's category-based selection changes yearly
  and drives which occupations consultants can quote

---

## What I need to build it

1. **Who receives the weekly report**
2. **Whether the Australia occupation list is genuinely truncated**, so the agent knows
   what a complete list looks like
3. **Which figures must never auto-update** — my assumption is every fee, but confirm
4. Whether to build the three quote sheets first, or the agent first. The quote sheets
   are the bigger day-to-day win; the agent stops the sheet going stale.
