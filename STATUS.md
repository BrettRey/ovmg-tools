# STATUS

## Current state (2026-07-09)

Project scaffolded. JS engine (`js/engine.js`) implements the paper's
discounted Beta filter (eqs. 44-47) with omission-mass helper, summaries, and
Beta quantiles. Shared fixture suite (`tests/fixtures/fig4-preemption.json`)
reproduces the paper's Figure 4 values; all 27 checks pass (`make test`).
Fixture values verified against `section3.tex` pgfplots coordinates and the
Beta(1,b) closed-form quantiles.

## Next action

Licensing lab Tab 1 (single node): sliders (opportunity rate N, rho-star,
positive-token rate, outside-option share, memory discount delta_m), posterior
trajectory with credible ribbon, live dot in the (mean, concentration) state
space, framing button, worked-example presets. Single-file HTML/JS wrapping
`js/engine.js`.

Then: Tab 2 (population, ~50 agents) -> Tab 3 (diagnostic walkthrough).
R package functions in build order: `niche_annotate()`,
`rate_per_opportunity()`, `rho_star()`, `fit_licensing()`,
`classify_regime()`, `dispersion_probe()`.

First empirical target: *whom* dispersion probe on Spoken BNC 1994 vs 2014
(speaker-linked); backup contrast *shall*. Needs functions 1-2 + 6 only.

## Blockers

None. One open decision: `ovmg` as standalone R package vs module in
`tools/kindred` (deferred; see DECISIONS.md).
