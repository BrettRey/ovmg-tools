# ovmg-tools

Companion software for Brett Reynolds, *Grammaticality de-idealized: The
Operator-Value Model of Grammaticality* (OVMG). Two deliverables share one
numerical core:

1. **Licensing lab** (`lab/`) -- an interactive single-page tool for building
   intuition about the paper's formalization. Browser only, no install;
   intended as a GitHub Pages companion to the paper.
2. **`ovmg` R package** (`r/`) -- corpus-facing estimators implementing the
   paper's identification protocol (rate-per-opportunity, rho-star norming,
   licensing fits, regime classification, dispersion probes).

## The engine

Per construction node kappa in conditioning state c, a Beta posterior over the
population licensing rate theta_t(kappa, c), updated on discounted evidence
streams (paper, section "Dynamics: evidence streams, weighted omissions, and
repair"; eqs. 44-47 in the 2026-07-09 draft):

```
a <- delta_m * a + lambda_pos * s_t            # positive tokens, coverage-weighted
b <- delta_m * b + lambda_neg * (e_t + p_t)    # error evidence + preemption mass
C = a / (a + b)      # posterior mean
nu = a + b           # concentration
```

Preemption mass per omission occasion: `p_i = r_i * q_i * delta_m^(t - t_i)`,
where `q_i = rho_star` when an in-repertoire competitor was chosen and
`q_i ~ 0` when the outside option (periphrasis/avoidance) was taken; `r_i` is
the niche-identification posterior.

**Design law:** the engine is implemented once per language (JS in
`js/engine.js`, R in `r/`), with the shared JSON fixtures in `tests/fixtures/`
keeping the two numerically identical. Everything else is UI or I/O around it.

## Layout

```
js/engine.js        Beta update engine, JS reference implementation
js/sim.js           Lab simulation layer (slider params -> evidence streams) + presets
lab/src/            Lab source (style.css, body.html, app.js)
lab/build.mjs       Build: inlines the engine, emits index.html + artifact.html
lab/index.html      Licensing lab, self-contained (open directly or serve)
r/                  ovmg R package (in progress)
tests/fixtures/     Shared JSON fixtures (paper Figure 4 values)
tests/              JS fixture runner + sim smoke tests
notes/              Project brief, source verification
```

## Build and test

```bash
make test    # engine fixtures + sim smoke tests
make lab     # rebuild lab/index.html and lab/artifact.html from lab/src/
```

Edit the lab under `lab/src/`; `lab/index.html` is generated. The smoke tests
prove the preempted-gap and starved presets reproduce Figure 4 through the
slider mapping and pin the framing rank order and the moribund
dispersion-before-mean profile.

The fixtures reproduce the plotted values of the paper's Figure 4 (Beta(1,1)
prior; per-step preemption mass 0.01 "rare" vs 5 "dense"), verified against
the paper's source and the Beta(1,b) closed-form quantiles.

## License

MIT (see `LICENSE`).
