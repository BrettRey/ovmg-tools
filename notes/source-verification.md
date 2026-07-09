# Source verification log

Claims baked into this repo and their verification status.

## Verified

- **Fixture values (`tests/fixtures/fig4-preemption.json`).** All expected
  means and 95% CrI endpoints are copied from the pgfplots coordinates of
  Figure 4 (`fig:posterior-means`) in
  `papers/retarget/grammaticality-de-idealized/section3.tex` (lines 678-695,
  2026-07-09 working copy); `main.aux` confirms the label compiles as
  figure 4 (p. 31). Cross-checked computationally: with a Beta(1,1) prior and
  pure preemption mass, b_t = 1 + p*t and the quantiles follow the closed
  form x_p = 1 - (1-p)^(1/b), which reproduces every checkpoint to within
  4-decimal rounding. Verified 2026-07-09.
- **Update equations in docstrings.** a/b updates, C and nu definitions, and
  the attributability weight match `main.tex` section
  "Dynamics: evidence streams, weighted omissions, and repair"
  (`sec:update`, eqs. 44-47 in the compiled 2026-07-09 draft). Verified
  2026-07-09.

## Unverified / queued

- **Figure 4 figure number is draft-relative.** If the paper is restructured,
  re-check `main.aux` and update the fixture `source` field and README.
- **Spoken BNC 1994 vs 2014 speaker-linked design** (first empirical target,
  *whom* dispersion probe): corpus access, licensing, and speaker-linking
  details not yet checked. Verify before any `dispersion_probe()` claims.
- **Expected Parrot / norming platform details** for rho-star forced-choice
  norming: not yet checked; REB constraints may apply (see portfolio
  CLAUDE.md, REB workflow).
