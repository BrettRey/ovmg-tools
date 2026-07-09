# OVMG Tools — project brief

*(As supplied by Brett, 2026-07-09. Preserved verbatim; treat as the strategic
spec. Fixture values below were verified against the paper on 2026-07-09; see
`notes/source-verification.md`.)*

Companion software for Reynolds, *Grammaticality de-idealized* (OVMG). Two deliverables sharing one numerical core:

1. **Licensing lab** — interactive single-page tool for building intuition about the formalization (browser, no install; eventual GitHub Pages companion to the paper).
2. **`ovmg` R package** (or module in `kindred`) — corpus-facing estimators implementing the §3.6/§3.8 identification protocol.

**Design law:** the Beta update engine is implemented once per language (JS and R), with a shared JSON test-fixture suite so the two stay numerically identical. Everything else is UI or I/O around it.

## The engine (from §3–4 of the paper)

Per construction node $\kappa$ in conditioning state $c$, a Beta posterior over the population licensing rate $\theta_t(\kappa,c)$, updated on discounted evidence streams:

- `a ← δ_m·a + λ⁺·s_t`  (positive tokens, coverage-weighted)
- `b ← δ_m·b + λ⁻·(e_t + p_t)`  (error evidence + preemption mass, most-specific-node weighted)
- Preemption mass per omission occasion: `p = r_i · q_i · δ_m^(t−t_i)` where `q_i = ρ⋆` when an in-repertoire competitor was chosen and `q_i ≈ 0` when the outside option (periphrasis/avoidance) was taken; `r_i` = niche-identification posterior.
- Outputs: mean `C = a/(a+b)`, concentration `ν = a+b`, 95% credible interval (Beta quantiles).
- Status regions: licensed / excluded / unsettled-starved / unsettled-avoidance-divided / heterogeneous (interior θ, high ν — population-level only).

**Test fixtures (must reproduce exactly; these are the paper's Figure 4 values, independently verified):**
- Prior Beta(1,1); per-step preemption mass 0.01 ("rare"): mean after 50 steps = 0.4000; 95% CrI at t=50 = (0.0167, 0.9145).
- Prior Beta(1,1); per-step preemption mass 5 ("dense"): mean after 1 step = 1/7 ≈ 0.1429; CrI at t=1 = (0.0042, 0.4593) [Beta(1,b) quantiles: x_p = 1−(1−p)^(1/b)]; mean at t=50 ≈ 0.0040.

## Deliverable 1: Licensing lab

Single-file HTML/JS (prototype as claude.ai artifact; production on GitHub Pages).

**Tab 1 — single node.** Sliders: opportunity rate N, counterfactual choice ρ⋆, positive-token rate, outside-option share, memory discount δ_m. Displays: (a) posterior mean trajectory with credible ribbon; (b) live dot in the (mean, concentration) state space with the four regions labelled (paper Fig. 2). **Framing button:** injects a prior shift mid-run; starved/divided states jump, preempted gaps don't — the satiation rank order, one click. Presets loading the worked examples: licensed (*Which car did you buy?*), preempted gap (\*Which did you buy car?), starved (*friend of whose*), winnerless cell (*pobedit'* 1sg), moribund contrast (N decays; dispersion rises before mean moves).

**Tab 2 — population.** ~50 agents, each running the engine on its own sampled input stream; histogram of individual means bimodalizing over time; repair-coupling toggle (steepens basins). Shows emergent categoricality and makes the epistemic-vs-heterogeneity distinction visible: per-agent CrI = epistemic; histogram spread = heterogeneity.

**Tab 3 — diagnostic walkthrough.** The §3.4.1 four-step tree (coverage → unification → saturation → licensing) as guided interaction, outputting predicted (F, Φ) phenomenology per case.

Build order: Tab 1 → fixtures pass → Tab 2 → Tab 3.

## Deliverable 2: `ovmg` R package

Functions, in build order:

1. `niche_annotate()` — LLM-assisted opportunity annotation from a niche spec (communicative job, intended value, competitor set, outside option — specified without using target acceptability). Human-validated sample required; report agreement.
2. `rate_per_opportunity()` — k/N with Wilson intervals per cell; generalizes the existing `agr-coca-projection` probe.
3. `rho_star()` — ρ⋆ estimation via forced-choice norming data and/or LLM virtual-informant first pass; MUST be estimated on data disjoint from the licensing corpus (identification law, §3.6).
4. `fit_licensing()` — the engine over corpus periods; (C_t, ν_t) trajectories; diachronic mode for COHA-style corpora.
5. `classify_regime()` — preempted / starved / avoidance-divided / heterogeneous from (N, ρ̂⋆, k, outside-option share); mandatory robustness report across ≥2 niche granularities.
6. `dispersion_probe()` — between-speaker variance of rate-per-opportunity over apparent time; tests dispersion-leads-means.

**First empirical target:** the *whom* dispersion probe on Spoken BNC 1994 vs 2014 (speaker-linked). Backup contrast: *shall*. Prediction: between-speaker dispersion rises before mean rate falls — the framework's distinctive registered-test candidate. Needs only functions 1–2 + 6.

**Later / high-stakes:** repair mining in CA corpora, policing-intensity regression on N·Δ (the controller claim's earn-or-defeat test).

## Conventions

- Cite equation numbers from the paper (§3 state theory, §4 dynamics) in docstrings; any deviation from the paper's math is a bug unless logged as a decision.
- Fixtures in `tests/fixtures/*.json`, shared verbatim between JS and R test suites.
- LaTeX conventions per author preferences where docs are generated (single quotes for meanings, \mention{} for linguistic objects, no em-dashes).
- Log decisions/blockers to shared-memory with pm-update tag per LLM-CLI-projects protocol; identify as claude-code:[folder].
