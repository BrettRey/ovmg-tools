# STATUS

## Current state (2026-07-09, evening)

Licensing lab Tab 1 built, then rebuilt for interpretability after Brett's
review (first version was estimator-internals-only and uninterpretable; see
DECISIONS.md). The lab now teaches from zero: an orientation line, presets
framed as questions ("Can you say *Which did you buy car?*"), a sampled
event feed (heard it / competitor won / workaround / nothing came up) that
visibly drives the posterior, plain-language tiles (best guess, weight of
evidence, still plausible), a what-to-watch caption per preset, and the
fig. 2 status map with glossed regions. Deterministic expectation stays as a
dotted overlay; Resample draws a new community. Artifact (same URL):
https://claude.ai/code/artifact/70c3f5f1-6223-476d-a933-01e93abda97c

Tests: 27 engine fixture checks + 46 sim smoke checks pass (`make test`).
The suite proves the preempted/starved presets reproduce Figure 4 in
expectation, pins the framing rank order and moribund dispersion profile,
checks sampled-mode convergence to the deterministic path (40 seeds), and
pins each shipped preset seed to the profile its caption promises.

JS engine (`js/engine.js`): the paper's discounted Beta filter (eqs. 44-47)
with omission-mass helper, summaries, and Beta quantiles; fixtures verified
against `section3.tex` pgfplots coordinates and Beta(1,b) closed forms.

**Not signed off.** Brett's verdict on the rebuilt Tab 1 (2026-07-09, end of
session): "needs work". The interpretability rebuild improved things but did
not clear the bar; no specifics were given before the session ended.

## Next action

Another interpretability pass on Tab 1, starting by getting Brett's specific
friction points (which element still doesn't explain itself). Do NOT proceed
to Tab 2 until Tab 1 is signed off; Tab 2 inherits Tab 1's display language.

Then: Tab 2 (population, epistemic-vs-heterogeneity), Tab 3 (diagnostic
walkthrough), GitHub Pages enablement.
R package functions in build order: `niche_annotate()`,
`rate_per_opportunity()`, `rho_star()`, `fit_licensing()`,
`classify_regime()`, `dispersion_probe()`.

First empirical target: *whom* dispersion probe on Spoken BNC 1994 vs 2014
(speaker-linked); backup contrast *shall*. Needs functions 1-2 + 6 only.

## Blockers

None. One open decision: `ovmg` as standalone R package vs module in
`tools/kindred` (deferred; see DECISIONS.md).
