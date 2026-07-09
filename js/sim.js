// sim.js -- Tab-1 simulation layer for the licensing lab.
//
// Maps interface parameters to the engine's per-step evidence streams and runs
// the discounted Beta filter (engine.js; paper eqs. 44-47) over T steps. The
// parameter-to-stream mapping below is a lab modelling convention (logged in
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
// Expected per-step streams (deterministic, expectation-level; sampling noise
// is Tab 2's job):
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

// Worked-example presets (paper, worked-examples section). Slider values are
// illustrative modelling choices; the qualitative profiles are the paper's.
// The preempted and starved presets reproduce Figure 4 exactly (dense: p = 5
// per step; rare: p = 0.01 per step) -- enforced by tests/run-sim-smoke.mjs.
export const PRESETS = {
  licensed: {
    label: 'Licensed',
    example: 'Which car did you buy?',
    marker: '',
    params: { N: 3, pi: 0.95, rhoStar: 0.9, omega: 0.3, deltaM: 1 },
    blurb: 'Dense niche, target nearly always chosen: the posterior climbs and concentrates high.',
  },
  preempted: {
    label: 'Preempted gap',
    example: 'Which did you buy car?',
    marker: '*',
    params: { N: 5, pi: 0, rhoStar: 1, omega: 0, deltaM: 1 },
    blurb: 'Dense niche, a competitor always chosen with rho* = 1: the posterior falls and concentrates (Figure 4, dense).',
  },
  starved: {
    label: 'Starved',
    example: 'friend of whose',
    marker: '?',
    params: { N: 0.01, pi: 0, rhoStar: 1, omega: 0, deltaM: 1 },
    blurb: 'The niche almost never arises: the posterior stays near its prior and the interval spans nearly the whole unit interval (Figure 4, rare).',
  },
  winnerless: {
    label: 'Winnerless cell',
    example: "pobedit' 1SG",
    marker: '',
    params: { N: 5, pi: 0, rhoStar: 0.9, omega: 0.99, deltaM: 1 },
    blurb: 'Dense niche but the outside option absorbs production: little confident evidence either way, so low mean and low concentration.',
  },
  moribund: {
    label: 'Moribund contrast',
    example: 'whom (spoken)',
    marker: '',
    params: { N: 2, pi: 0.85, rhoStar: 0.5, omega: 0.5, deltaM: 0.97, decayTau: 25 },
    blurb: 'Opportunities decay while memory discounts: concentration falls and the interval widens before the mean moves.',
  },
};
