// sim.js -- Tab-1 simulation layer for the licensing lab.
//
// Two modes over the same engine (engine.js; paper eqs. 44-47):
//   simulate()        deterministic, expectation-level. Used by the test
//                     suite (Figure 4 reproduction) and as the lab's
//                     "expected path" overlay.
//   simulateSampled() discrete occasions sampled from a seeded RNG. Drives
//                     the lab display, so the evidence that moves the
//                     posterior is visible as events.
//
// The parameter-to-stream mapping is a lab modelling convention (logged in
// DECISIONS.md), not paper math; all posterior arithmetic is the engine's.
//
// Interface parameters:
//   N        expected niche opportunities per step
//   pi       positive-token rate: share of opportunities realized as target tokens
//   rhoStar  counterfactual choice probability rho* for competitor omissions
//   omega    outside-option share of omission occasions (periphrasis/avoidance;
//            attributability q ~ 0, so those occasions contribute no mass)
//   deltaM   memory discount delta_m
//   decayTau optional: opportunities decay as N * exp(-(t-1)/decayTau)
//            (the moribund-contrast preset)
//   framings optional [{t, boost}]: prior shift injected at step t
//            (a facilitating frame as transient positive pseudo-counts)
//
// Expected per-step streams (identical in both modes, in expectation):
//   s_t = N_t * pi
//   p_t = N_t * (1 - pi) * (1 - omega) * rhoStar     (r_i = 1, dt = 0)
//   e_t = 0

import { makeState, update, mean, concentration, credibleInterval } from './engine.js';

export const FRAMING_BOOST = 2;

function snap(t, state, opp) {
  const [lo, hi] = credibleInterval(state);
  return { t, a: state.a, b: state.b, mean: mean(state), nu: concentration(state), lo, hi, opp };
}

function boostSum(framings, t) {
  let sum = 0;
  for (const f of framings) if (f.t === t) sum += f.boost;
  return sum;
}

export function simulate(params, T = 120) {
  const {
    N = 1, pi = 0, rhoStar = 1, omega = 0, deltaM = 1,
    priorA = 1, priorB = 1, decayTau = null, framings = [],
  } = params;
  let state = makeState(priorA, priorB);
  const b0 = boostSum(framings, 0);
  if (b0 > 0) state = { a: state.a + b0, b: state.b };
  let opp = 0;
  const out = [snap(0, state, opp)];
  for (let t = 1; t <= T; t++) {
    const Nt = decayTau ? N * Math.exp(-(t - 1) / decayTau) : N;
    opp += Nt;
    const s = Nt * pi;
    const p = Nt * (1 - pi) * (1 - omega) * rhoStar;
    state = update(state, { s, e: 0, p }, { deltaM });
    const boost = boostSum(framings, t);
    if (boost > 0) state = { a: state.a + boost, b: state.b };
    out.push(snap(t, state, opp));
  }
  return out;
}

// Small fast seeded RNG (mulberry32); reproducible runs, resampleable seeds.
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePoisson(lambda, rand) {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do { k += 1; p *= rand(); } while (p > L);
  return k - 1;
}

// Sampled mode: each step draws Poisson(N_t) occasions; each occasion is
// heard (prob pi), a workaround (prob (1-pi)*omega, contributes ~nothing),
// or a competitor choice (prob (1-pi)*(1-omega), contributes rhoStar).
// Expectations match simulate() exactly.
export function simulateSampled(params, T = 120, seed = 1) {
  const {
    N = 1, pi = 0, rhoStar = 1, omega = 0, deltaM = 1,
    priorA = 1, priorB = 1, decayTau = null, framings = [],
  } = params;
  const rand = mulberry32(seed);
  let state = makeState(priorA, priorB);
  const b0 = boostSum(framings, 0);
  if (b0 > 0) state = { a: state.a + b0, b: state.b };
  let opp = 0;
  const tallies = { heard: 0, competitor: 0, workaround: 0, quiet: 0 };
  const events = [];
  const rows = [snap(0, state, opp)];
  for (let t = 1; t <= T; t++) {
    const Nt = decayTau ? N * Math.exp(-(t - 1) / decayTau) : N;
    const occasions = samplePoisson(Nt, rand);
    let heard = 0;
    let competitor = 0;
    let workaround = 0;
    for (let i = 0; i < occasions; i++) {
      if (rand() < pi) heard += 1;
      else if (rand() < omega) workaround += 1;
      else competitor += 1;
    }
    opp += occasions;
    if (occasions === 0) tallies.quiet += 1;
    tallies.heard += heard;
    tallies.competitor += competitor;
    tallies.workaround += workaround;
    state = update(state, { s: heard, e: 0, p: competitor * rhoStar }, { deltaM });
    const boost = boostSum(framings, t);
    if (boost > 0) state = { a: state.a + boost, b: state.b };
    events.push({ t, occasions, heard, competitor, workaround });
    rows.push(snap(t, state, opp));
  }
  return { rows, events, tallies };
}

// Worked-example presets (paper, worked-examples section). Slider values are
// illustrative modelling choices; the qualitative profiles are the paper's.
// The preempted and starved presets reproduce Figure 4 exactly in
// deterministic mode (dense: p = 5 per step; rare: p = 0.01 per step),
// enforced by tests/run-sim-smoke.mjs, which also pins the behaviour of each
// shipped seed.
export const PRESETS = {
  licensed: {
    label: 'Licensed',
    example: 'Which car did you buy?',
    marker: '',
    question: 'Can you say <em class="mention">Which car did you buy?</em>',
    watch: 'Everyone says it. The guess climbs and the band tightens: the verdict is in, and it’s yes.',
    seed: 20260709,
    params: { N: 3, pi: 0.95, rhoStar: 0.9, omega: 0.3, deltaM: 1 },
    blurb: 'Dense niche, target nearly always chosen: the posterior climbs and concentrates high.',
  },
  preempted: {
    label: 'Preempted gap',
    example: 'Which did you buy car?',
    marker: '*',
    question: 'Can you say <span class="mark">*</span><em class="mention">Which did you buy car?</em>',
    watch: 'Nobody says it, and every occasion where the competitor wins counts quietly against it. The guess sinks and the band tightens: confidently out.',
    seed: 20260710,
    params: { N: 5, pi: 0, rhoStar: 1, omega: 0, deltaM: 1 },
    blurb: 'Dense niche, a competitor always chosen with rho* = 1: the posterior falls and concentrates (Figure 4, dense).',
  },
  starved: {
    label: 'Starved',
    example: 'friend of whose',
    marker: '?',
    question: 'Can you say <span class="mark">?</span><em class="mention">friend of whose</em>',
    watch: 'The occasion almost never arises, so almost nothing is learned. The band barely narrows: not out, just unsettled.',
    seed: 20260711,
    params: { N: 0.01, pi: 0, rhoStar: 1, omega: 0, deltaM: 1 },
    blurb: 'The niche almost never arises: the posterior stays near its prior (Figure 4, rare).',
  },
  winnerless: {
    label: 'Winnerless cell',
    example: "pobedit' 1SG",
    marker: '',
    question: 'What’s the first-person-singular future of Russian <em class="mention">pobedit’</em> ‘win’?',
    watch: 'Occasions abound but speakers talk around the gap, and a workaround is barely evidence. Endless experience, no verdict: unsettled in a different way.',
    seed: 20260702,
    params: { N: 5, pi: 0, rhoStar: 0.9, omega: 0.99, deltaM: 1 },
    blurb: 'Dense niche but the outside option absorbs production: little confident evidence either way.',
  },
  moribund: {
    label: 'Moribund contrast',
    example: 'whom (spoken)',
    marker: '',
    question: 'Is <em class="mention">whom</em> still part of your spoken English?',
    watch: 'Occasions dry up while memory fades. The band widens again before the guess moves: uncertainty returns first, then the form goes.',
    seed: 20260703,
    params: { N: 2, pi: 0.85, rhoStar: 0.5, omega: 0.5, deltaM: 0.97, decayTau: 25 },
    blurb: 'Opportunities decay while memory discounts: concentration falls and the interval widens before the mean moves.',
  },
};
