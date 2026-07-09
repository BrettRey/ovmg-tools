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

2026-07-09 — Lab is built from `lab/src/` by `lab/build.mjs`, which inlines
`js/engine.js` verbatim (single-source law: the build copies, never forks) and
emits `lab/index.html` (self-contained; file:// and GitHub Pages) plus
`lab/artifact.html` (content-only, for claude.ai artifact publishing). The
combined script is node --check'd at build time.

2026-07-09 — Tab-1 slider-to-stream mapping (lab modelling convention, not
paper math): s = N·π; p = N·(1−π)·(1−ω)·ρ⋆; e = 0; deterministic
expectation-level updates, sampling noise deferred to Tab 2. Preempted and
starved preset parameters chosen so those presets reproduce Figure 4 exactly;
enforced by tests/run-sim-smoke.mjs.

2026-07-09 — Lab display conventions: status chip uses ν < 8 (diffuse) and
ν ≥ 40 (concentrated) with C ≥ 0.75 licensed / C ≤ 0.25 excluded; starved vs
avoidance-divided split on cumulative opportunities < 10; framing shift = +2
positive pseudo-counts. Display conventions for the readout only, not paper
claims; the smoke tests pin the rank-order behaviour they illustrate.

2026-07-09 — Chart palettes validated with the dataviz six-checks script:
light #2E6E9E/#B4533A on #FBFBF9; dark #4A8BC4/#C96A4E on #16181D. All pass
(CVD ΔE ≥ 49; contrast ≥ 3:1).

2026-07-09 — Tab 1 rebuilt for interpretability after Brett's review ("no idea
what I'm looking at"). Root cause: the first version plotted estimator
internals (C, ν, streams) with no visible evidence and no on-ramp. Changes:
(a) the display now runs on sampled discrete occasions (seeded mulberry32,
Poisson opportunities) with an event feed and running tallies, so the evidence
that moves the posterior is on screen; the deterministic expectation stays as
a dotted overlay and remains the tested path; (b) every surface is
plain-language first (sliders as questions, tiles as words: best guess,
weight of evidence, still plausible), symbols demoted to the footer;
(c) each preset is framed as a question with a one-line what-to-watch caption.
Shipped preset seeds are pinned by smoke tests to display the profile their
caption promises.

2026-07-09 — Sampled-mode occasion model: Poisson(N_t) occasions per step;
each occasion is heard (prob π), workaround ((1−π)·ω, contributes nothing),
or competitor choice ((1−π)·(1−ω), contributes ρ⋆). Expectations match the
deterministic mapping exactly; verified by a 40-seed convergence check.
