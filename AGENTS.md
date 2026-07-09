# AGENTS.md

Guidance for any coding agent working in this repo. CLAUDE.md and GEMINI.md
point here.

## Purpose

Companion software for Reynolds, *Grammaticality de-idealized* (OVMG):
a browser licensing lab (`lab/`) and an `ovmg` R package (`r/`) sharing one
Beta update engine. Full strategic brief: `notes/project-brief.md`.

## Role

Developer. Edit engine code, lab UI, R functions, tests, and docs. Do not
invent empirical results, corpus counts, or agreement statistics; corpus work
follows the portfolio source-grounding law.

## Non-negotiables

- **Design law:** one engine per language (JS `js/engine.js`, R in `r/`),
  kept numerically identical via the shared fixtures in `tests/fixtures/`.
  Fixture JSON is shared verbatim between the JS and R test suites.
- **Paper is the spec.** Cite equation numbers from the paper in docstrings
  (state theory and dynamics sections; eqs. 44-47 in the 2026-07-09 draft).
  Any deviation from the paper's math is a bug unless logged in DECISIONS.md.
  Paper source: `papers/retarget/grammaticality-de-idealized/`.
- **Fixtures must keep passing.** `make test` before claiming any engine
  change works.
- **rho-star identification law:** rho-star must be estimated on data disjoint
  from the licensing corpus (paper, identification protocol). Estimators that
  violate this are wrong even if convenient.
- Log non-trivial decisions to `DECISIONS.md` as they happen
  (`YYYY-MM-DD — Decision. Reason.`).
- Log decisions/blockers to MCP shared memory with the `pm-update` tag,
  identifying as `claude-code:ovmg-tools` (or the equivalent for your CLI).

## Commands

```bash
make test    # JS fixture suite (node tests/run-fixtures.mjs)
```

## Conventions

- Where docs are generated with linguistic content: single quotes for
  meanings, \mention{} for linguistic objects in LaTeX, no em-dashes.
- Lab prototype is a single self-contained HTML file (no CDN dependencies).
