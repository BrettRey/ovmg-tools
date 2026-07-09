#!/usr/bin/env node
// Smoke tests for the lab simulation layer (js/sim.js). Verifies that the
// preempted/starved presets reproduce the Figure 4 fixtures through the
// slider-to-stream mapping, and that the other presets show the qualitative
// profiles the paper assigns them (framing rank order, moribund dispersion).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulate, PRESETS, FRAMING_BOOST } from '../js/sim.js';

let checks = 0;
let failures = 0;

function ok(label, cond, detail = '') {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function close(label, computed, expected, tol) {
  ok(label, Math.abs(computed - expected) <= tol,
    `computed ${computed.toFixed(6)}, expected ${expected}`);
}

// 1. Preset-to-fixture reproduction: the preempted and starved presets must
// reproduce the Figure 4 fixture values through the sim mapping.
const fx = JSON.parse(readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fig4-preemption.json'), 'utf8'));
const presetFor = { dense: 'preempted', rare: 'starved' };
for (const sc of fx.scenarios) {
  const traj = simulate(PRESETS[presetFor[sc.id]].params, 50);
  for (const c of sc.checks) {
    const row = traj[c.t];
    if (c.mean !== undefined) close(`${sc.id} preset t=${c.t} mean`, row.mean, c.mean, fx.tolerance);
    if (c.cri95 !== undefined) {
      close(`${sc.id} preset t=${c.t} CrI lo`, row.lo, c.cri95[0], fx.tolerance);
      close(`${sc.id} preset t=${c.t} CrI hi`, row.hi, c.cri95[1], fx.tolerance);
    }
  }
}

// 2. Licensed preset ends licensed: high mean, high concentration.
{
  const end = simulate(PRESETS.licensed.params, 120).at(-1);
  ok('licensed preset: mean > 0.9 at t=120', end.mean > 0.9, `mean ${end.mean.toFixed(3)}`);
  ok('licensed preset: nu > 40 at t=120', end.nu > 40, `nu ${end.nu.toFixed(1)}`);
}

// 3. Winnerless preset stays diffuse despite a dense niche.
{
  const end = simulate(PRESETS.winnerless.params, 120).at(-1);
  ok('winnerless preset: mean < 0.35 at t=120', end.mean < 0.35, `mean ${end.mean.toFixed(3)}`);
  ok('winnerless preset: nu < 10 at t=120', end.nu < 10, `nu ${end.nu.toFixed(1)}`);
  ok('winnerless preset: dense opportunities', end.opp > 100, `opp ${end.opp.toFixed(0)}`);
}

// 4. Framing rank order (satiation): a +2 prior shift at t=25 moves the
// starved posterior and barely moves the preempted one.
{
  const jump = (key) => {
    const base = simulate(PRESETS[key].params, 30);
    const framed = simulate({ ...PRESETS[key].params, framings: [{ t: 25, boost: FRAMING_BOOST }] }, 30);
    return framed[26].mean - base[26].mean;
  };
  const jStarved = jump('starved');
  const jPreempted = jump('preempted');
  ok('framing: starved jumps (> 0.2)', jStarved > 0.2, `jump ${jStarved.toFixed(3)}`);
  ok('framing: preempted pinned (< 0.05)', jPreempted < 0.05, `jump ${jPreempted.toFixed(3)}`);
  ok('framing: rank order (>5x)', jStarved > 5 * jPreempted,
    `${jStarved.toFixed(3)} vs ${jPreempted.toFixed(3)}`);
}

// 5. Moribund contrast: concentration falls and the interval widens before the
// mean moves.
{
  const traj = simulate(PRESETS.moribund.params, 100);
  const t20 = traj[20];
  const t80 = traj[80];
  ok('moribund: nu falls (nu80 < 0.7*nu20)', t80.nu < 0.7 * t20.nu,
    `nu20 ${t20.nu.toFixed(1)}, nu80 ${t80.nu.toFixed(1)}`);
  ok('moribund: mean stable (|diff| < 0.06)', Math.abs(t80.mean - t20.mean) < 0.06,
    `mean20 ${t20.mean.toFixed(3)}, mean80 ${t80.mean.toFixed(3)}`);
  ok('moribund: CrI widens', (t80.hi - t80.lo) > (t20.hi - t20.lo),
    `width20 ${(t20.hi - t20.lo).toFixed(3)}, width80 ${(t80.hi - t80.lo).toFixed(3)}`);
}

if (failures > 0) {
  console.error(`\n${failures}/${checks} sim smoke checks FAILED`);
  process.exit(1);
}
console.log(`All ${checks} sim smoke checks passed.`);
