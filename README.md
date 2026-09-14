# Immigration Source Check

Every Monday morning this reads the official government pages behind the reference
workbook and emails **what changed**. It never edits the workbook — a person does that,
after reading the evidence.

That split is deliberate. The QA sheet rates government fee accuracy as a **critical**
error category, so no figure should reach a client without someone having seen it.

---

## What it watches

**15 figures across 10 official pages.**

| Country | Figures |
|---|---|
| Canada | PR fee incl. RPRF · dependent child · biometrics · biometrics family max · proof of funds · latest Express Entry draw · number of active categories |
| Australia | Subclass 189 charge · Subclass 190 charge · latest SkillSelect round |
| USA | I-140 · Asylum Program Fee · premium processing · USCIS Immigrant Fee · immigrant visa fee |

Only `canada.ca`, `ircc.canada.ca`, `homeaffairs.gov.au`, `uscis.gov` and `state.gov`
are used — a self-test enforces that, so a blog or a forum can never become a source.

## What the email looks like

Only what moved is shown as a card, with the old value, the new value, **the sentence
from the page that states it**, and a link to check:

> **Canada · Biometrics, family maximum** — Workbook tab: Fees & Calculator
> ~~CAD 170~~ → **CAD 180** (+10)
> *"The maximum biometrics fee for a family applying together is $180."*
> Check the official page →

Below that: **could not be checked**, then **checked and unchanged**.

### Could not be checked is not the same as unchanged

If a page moves, times out or stops stating a figure, it appears in its own section and
is never counted as unchanged. A quiet report that means "we did not look" is worse than
no report at all.

## The next Express Entry draw

IRCC does not announce dates. The report calculates an **expected window** from the last
draw and the usual two-week rhythm, and labels it as an estimate everywhere it appears:

> **Estimate only.** IRCC never announces draw dates in advance. This is calculated for
> planning, and must never be quoted to a client as a date.

If the window has passed, the report says so, which usually means a new draw has run and
the workbook needs the row.

## After a change: two edits, not one

1. Update the figure in the **workbook**
2. Update `current` for that item in **config.js**

If you skip the second, the same change is reported again every week until you do.

## Running it

Scheduled **Mondays at 9:00 AM PKT**. Or Actions → Immigration Source Check → Run
workflow, with a dry run option that prints and emails nobody. The HTML report is saved
as an artifact on every run.

## Secrets

`GEMINI_KEY` — reads the figures off the pages
`RESEND_KEY` — sends the report

Without `GEMINI_KEY` the pages cannot be read and the report says so rather than
reporting everything as unchanged.

## Adding a figure

Add an entry to `WATCH` in `config.js`: the country, the workbook tab it belongs to, the
page to read, a plain question, and the value the workbook holds now. Run
`node selftest.js` — it checks every entry has a real source, a question and a tab.

## Changing the rules

Every rule is a check in `selftest.js`. It reports `23 passed, 0 failed` and runs before
each weekly check, so a broken rule stops the run rather than producing a wrong report.
