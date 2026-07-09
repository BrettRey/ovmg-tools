// engine.js -- OVMG Beta update engine, JavaScript reference implementation.
//
// Implements the discounted conjugate filter of Reynolds, "Grammaticality
// de-idealized" (the OVMG paper), section "Dynamics: evidence streams,
// weighted omissions, and repair" (label sec:update; eqs. 44-47 in the
// 2026-07-09 draft):
//
//   a <- delta_m * a + lambda_pos * s_t          (eq. 44)
//   b <- delta_m * b + lambda_neg * (e_t + p_t)  (eq. 45)
//   C = a / (a + b),  nu = a + b                 (eq. 46, label eq:beta-update)
//
// Per-occasion omission mass (eq. 47, label eq:attributability, high-confidence
// regimes): q_i = rho_star when an in-repertoire competitor was chosen,
// q_i ~ 0 when the outside option (periphrasis/avoidance) was taken. The
// occasion's contribution to p_t is r_i * q_i * delta_m^(t - t_i), with r_i
// the niche-identification posterior.
//
// Design law: this engine is implemented once per language (JS here, R in
// r/), kept numerically identical via the shared fixtures in tests/fixtures/.
// Any deviation from the paper's math is a bug unless logged in DECISIONS.md.

/** Beta posterior state over the population licensing rate theta_t(kappa, c). */
export function makeState(a = 1, b = 1) {
  if (!(a > 0) || !(b > 0)) {
    throw new RangeError(`Beta parameters must be positive, got a=${a}, b=${b}`);
  }
  return { a, b };
}

/**
 * One update step (eqs. 44-45).
 * evidence: { s, e, p } -- positive tokens, error evidence, preemption mass.
 * params:   { deltaM in (0,1], lambdaPos >= 0, lambdaNeg >= 0 }.
 * Returns a new state; does not mutate.
 */
export function update(state, evidence = {}, params = {}) {
  const { s = 0, e = 0, p = 0 } = evidence;
  const { deltaM = 1, lambdaPos = 1, lambdaNeg = 1 } = params;
  if (!(deltaM > 0) || deltaM > 1) {
    throw new RangeError(`deltaM must be in (0, 1], got ${deltaM}`);
  }
  if (s < 0 || e < 0 || p < 0 || lambdaPos < 0 || lambdaNeg < 0) {
    throw new RangeError('evidence streams and weights must be non-negative');
  }
  return {
    a: deltaM * state.a + lambdaPos * s,
    b: deltaM * state.b + lambdaNeg * (e + p),
  };
}

/**
 * Preemption mass contributed by one omission occasion at lag dt (eq. 47,
 * high-confidence regimes): p_i = r * q * deltaM^dt, with q = rhoStar for an
 * in-repertoire competitor choice and q = 0 for the outside option.
 */
export function omissionMass({ r = 1, rhoStar, outsideOption = false, deltaM = 1, dt = 0 }) {
  if (!(rhoStar >= 0) || rhoStar > 1) {
    throw new RangeError(`rhoStar must be in [0, 1], got ${rhoStar}`);
  }
  const q = outsideOption ? 0 : rhoStar;
  return r * q * Math.pow(deltaM, dt);
}

/** Posterior mean C_t (eq. 46). */
export const mean = ({ a, b }) => a / (a + b);

/** Concentration nu_t = a + b (eq. 46). */
export const concentration = ({ a, b }) => a + b;

/** Equal-tailed credible interval [lo, hi] at the given level (default 95%). */
export function credibleInterval(state, level = 0.95) {
  const tail = (1 - level) / 2;
  return [betaQuantile(tail, state.a, state.b), betaQuantile(1 - tail, state.a, state.b)];
}

/** Convenience summary of a state. */
export function summary(state, level = 0.95) {
  return {
    mean: mean(state),
    nu: concentration(state),
    cri: credibleInterval(state, level),
  };
}

// ---------------------------------------------------------------------------
// Numerics: log-gamma (Lanczos), regularized incomplete beta (continued
// fraction), Beta quantile (bisection). Standard algorithms; accurate to well
// below the fixture tolerance of 5e-5.
// ---------------------------------------------------------------------------

const LANCZOS_G = 7;
const LANCZOS_C = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(x) {
  if (x < 0.5) {
    // Reflection formula.
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const z = x - 1;
  let sum = LANCZOS_C[0];
  for (let i = 1; i < LANCZOS_C.length; i++) sum += LANCZOS_C[i] / (z + i);
  const t = z + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

function betaContinuedFraction(x, a, b) {
  const MAXIT = 300;
  const EPS = 3e-15;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) return h;
  }
  throw new Error('betaContinuedFraction failed to converge');
}

/** Regularized incomplete beta function I_x(a, b), the Beta(a, b) CDF at x. */
export function regularizedIncompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnFront =
    logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log(1 - x);
  const front = Math.exp(lnFront);
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (front * betaContinuedFraction(1 - x, b, a)) / b;
}

/** Beta(a, b) quantile: the x with I_x(a, b) = p. Bisection; ~1e-14 accuracy. */
export function betaQuantile(p, a, b) {
  if (p < 0 || p > 1) throw new RangeError(`p must be in [0, 1], got ${p}`);
  if (p === 0) return 0;
  if (p === 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (regularizedIncompleteBeta(mid, a, b) < p) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-15) break;
  }
  return (lo + hi) / 2;
}
