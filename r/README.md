# ovmg (R)

Corpus-facing estimators implementing the paper's identification protocol.
Open decision (see DECISIONS.md): standalone `ovmg` package vs module in
`tools/kindred`.

The R engine must mirror `../js/engine.js` exactly and pass the shared
fixtures in `../tests/fixtures/` (design law).

Functions, in build order:

1. `niche_annotate()` — LLM-assisted opportunity annotation from a niche spec
   (communicative job, intended value, competitor set, outside option,
   specified without using target acceptability). Human-validated sample
   required; report agreement.
2. `rate_per_opportunity()` — k/N with Wilson intervals per cell; generalizes
   the existing `agr-coca-projection` probe.
3. `rho_star()` — rho-star estimation via forced-choice norming data and/or
   LLM virtual-informant first pass. MUST be estimated on data disjoint from
   the licensing corpus (identification law).
4. `fit_licensing()` — the engine over corpus periods; (C_t, nu_t)
   trajectories; diachronic mode for COHA-style corpora.
5. `classify_regime()` — preempted / starved / avoidance-divided /
   heterogeneous from (N, rho-star-hat, k, outside-option share); mandatory
   robustness report across >= 2 niche granularities.
6. `dispersion_probe()` — between-speaker variance of rate-per-opportunity
   over apparent time; tests dispersion-leads-means.

First empirical target: the *whom* dispersion probe on Spoken BNC 1994 vs 2014
(speaker-linked); backup contrast *shall*. Needs functions 1-2 + 6 only.
Later / high-stakes: repair mining in CA corpora; policing-intensity
regression on N·Delta.
