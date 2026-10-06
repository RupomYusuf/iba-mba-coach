# IBA-MBA Coach

An unofficial, privacy-first web coach and progress tracker for the **MBA admission test of the Institute of Business Administration (IBA), University of Dhaka** — full-time/part-time MBA only (not EMBA, not BBA, not any other IBA).

**Live app:** https://rupomyusuf.github.io/iba-mba-coach/ *(after Pages finishes building)*

---

## What it does

| Module | What you get |
|---|---|
| **Dashboard** | Days-to-test countdown, readiness score /100, current level per section (weighted 50/30/20 across your last 3 mocks), section gates (Strong / Borderline / Danger / Critical), trend arrows, admission-chance band, pattern flags, today's tasks |
| **Profile & Eligibility** | Last-cycle eligibility rules (CGPA ≥ 2.50/4.00, SSC & HSC GPA ≥ 3.00 each, no third division, O/A-Level minimums) → ELIGIBLE / AT RISK / NOT ELIGIBLE / UNKNOWN with reasons; official-circular overrides; stress/confidence check-in |
| **Mocks & Analysis** | Log correct/wrong per section → net marks = correct − 0.25 × wrong; accuracy, attempt rate, negative-marking loss; trajectory chart; conservative projection (gains capped ≈1.5 pp/week) |
| **Topics & Drills** | The full topic taxonomy with exact IDs and P1/P2/P3 tags; mastery bands per topic; study-time weight = section marks share × tag × (1 − mastery); top targets with question counts and per-question time limits |
| **Error Log** | Concept / careless / time / misread classification with a fix note and spaced retries at **2, 7 and 21 days** |
| **Writing Lab** | 30-mark format (2 × 15 in 30 min), PEEL structure, rubric self-scoring (relevance 4 · thesis 4 · evidence 3 · language 3 · coherence 1), rotating prompt bank (Bangladesh economy, business, tech, society, global, abstract) |
| **Study Plan** | Next 7 days generated from your priorities, hours and mock cadence (Day 1, then every 7 days, every 3 in the final 10); auto-scaled 4-week roadmap; compressed mode under 30 days |
| **Viva Studio** | Readiness meter, STAR story bank (6 target), mock-interview counter, English-speaking rating, current-affairs notebook, question bank, coaching rules |
| **Exam Guide** | Test structure, negative-marking expected-value calculator (4 vs 5 options), exam-day strategy, math formula bank, grammar checklist, vocab/current-affairs plans, scope guard |

## The honesty contract

- The **admission-chance figure is a labeled assumption model**, not official statistics: bands (Safe 60–80% · Competitive 35–60% · Borderline 10–35% · Unlikely <10%) with ±5–10 adjustments for academics, experience, viva readiness and trend.
- **No fabricated numbers**: no cut-off marks, seat counts or applicant statistics are invented; unknowns are labeled unknown.
- All exam rules carry a **[VERIFY]** tag where they come from the last confirmed cycle (2025-26, 68th batch: test Fri 5 Dec 2025). The 2026-27 circular is **not announced**; dates default to *expected* values you can override.
- The syllabus and priority tags are **community-derived** — cross-check with the official circular (www.iba-du.edu) and recent test-takers.
- Scope guard: this tool covers the **IBA DU MBA only**.

## Privacy & data

There is **no server, no account, no analytics**. Everything is stored in your browser's `localStorage`. Use **Data → Download JSON** to back up (the export mirrors the coach's user-input schema), and **Import** to restore. Clearing site data erases your logs, so export regularly.

## Run locally

Static site, no build step:

```bash
# any static server works
npx serve .          # or: python -m http.server 8080
```

Then open the printed localhost URL. Opening `index.html` directly via `file://` also works.

## Tech

Vanilla HTML/CSS/JS — zero dependencies, zero trackers, ~40 KB total. Charts are hand-rolled SVG.

## Disclaimer

This is an unofficial study aid by and for test-takers. It is not affiliated with, endorsed by, or reviewed by IBA, University of Dhaka. Eligibility decisions and exam content belong solely to IBA.

## License

MIT — see [LICENSE](LICENSE).
