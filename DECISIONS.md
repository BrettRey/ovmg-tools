# DECISIONS

2026-07-09 — Project lives at `tools/ovmg-tools/`, public GitHub under
`BrettRey/`, MIT license. Software tool defaults per portfolio setup skill;
nothing restricted in scope (fixtures derive from Brett's own paper).

2026-07-09 — Design law adopted from the project brief: the Beta update engine
is implemented once per language (JS and R) with a shared JSON fixture suite
(`tests/fixtures/`) keeping the implementations numerically identical. Any
deviation from the paper's math is a bug unless logged here.

2026-07-09 — JS engine is the reference implementation, built first. Reason:
the licensing lab is deliverable 1 and the brief's build order starts with
Tab 1 -> fixtures pass.

2026-07-09 — Fixture provenance: expected values are the plotted coordinates
of the paper's Figure 4 (`fig:posterior-means`, `section3.tex` lines 678-695,
confirmed as figure 4 in `main.aux`), cross-checked against the Beta(1,b)
closed form x_p = 1 - (1-p)^(1/b). Fixtures assume delta_m = 1 and
lambda_pos = lambda_neg = 1, matching the figure's setup (Beta(1,1) prior,
per-step preemption mass 0.01 vs 5, no positive tokens).

2026-07-09 — Fixture tolerance 5e-5. Reason: the paper's coordinates are
rounded to 4 decimal places, so agreement within 5e-5 is exact agreement with
the generator.

2026-07-09 — Deferred: whether `ovmg` ships as a standalone R package or a
module in `tools/kindred`. The brief leaves it open; decide when R work starts.
