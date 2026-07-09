# STATUS

## Current state (2026-07-09, later)

Licensing lab Tab 1 built and working. `lab/index.html` (built by `make lab`
from `lab/src/` + the shared engine): worked-example presets (licensed,
preempted gap, starved, winnerless cell, moribund contrast), five evidence
sliders, framing-shift button, playback, posterior trajectory with 95% CrI
ribbon, and the fig. 2 state space with region boxes and engine-computed
ghost markers for each preset. Light/dark themes, validated palettes, hover
tooltips, data table. Prototype artifact published:
https://claude.ai/code/artifact/70c3f5f1-6223-476d-a933-01e93abda97c

Tests: 27 engine fixture checks + 38 sim smoke checks pass (`make test`).
The smoke suite proves the preempted/starved presets reproduce Figure 4
through the slider mapping, and pins the framing rank order (starved jumps,
preempted pinned) and the moribund dispersion-before-mean profile.

JS engine (`js/engine.js`): the paper's discounted Beta filter (eqs. 44-47)
with omission-mass helper, summaries, and Beta quantiles; fixtures verified
against `section3.tex` pgfplots coordinates and Beta(1,b) closed forms.

## Next action

Tab 2 (population): ~50 agents on sampled input streams, histogram of
individual means bimodalizing, repair-coupling toggle; makes the
epistemic-vs-heterogeneity distinction visible. Then Tab 3 (diagnostic
walkthrough). Consider GitHub Pages enablement once Tab 2 lands.
R package functions in build order: `niche_annotate()`,
`rate_per_opportunity()`, `rho_star()`, `fit_licensing()`,
`classify_regime()`, `dispersion_probe()`.

First empirical target: *whom* dispersion probe on Spoken BNC 1994 vs 2014
(speaker-linked); backup contrast *shall*. Needs functions 1-2 + 6 only.

## Blockers

None. One open decision: `ovmg` as standalone R package vs module in
`tools/kindred` (deferred; see DECISIONS.md).
