#!/usr/bin/env node
// Run the shared JSON fixtures against the JS engine. Exit 1 on any failure.
// The R engine must pass these same fixtures (see r/README.md).

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeState, update, mean, credibleInterval } from '../js/engine.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.json')).sort();

let checks = 0;
let failures = 0;

function assertClose(label, computed, expected, tol) {
  checks += 1;
  const diff = Math.abs(computed - expected);
  if (!(diff <= tol)) {
    failures += 1;
    console.error(
      `FAIL ${label}: computed ${computed.toFixed(6)}, expected ${expected}, |diff| ${diff.toExponential(2)} > ${tol}`
    );
  }
}

for (const file of files) {
  const fx = JSON.parse(readFileSync(join(fixturesDir, file), 'utf8'));
  const params = {
    deltaM: fx.params.delta_m,
    lambdaPos: fx.params.lambda_pos,
    lambdaNeg: fx.params.lambda_neg,
  };
  for (const sc of fx.scenarios) {
    let state = makeState(fx.prior.a, fx.prior.b);
    const byT = new Map(sc.checks.map((c) => [c.t, c]));
    const maxT = Math.max(...sc.checks.map((c) => c.t));
    for (let t = 0; t <= maxT; t++) {
      if (t > 0) state = update(state, sc.evidence_per_step, params);
      const check = byT.get(t);
      if (!check) continue;
      const tag = `${fx.name}/${sc.id} t=${t}`;
      if (check.mean !== undefined) {
        assertClose(`${tag} mean`, mean(state), check.mean, fx.tolerance);
      }
      if (check.cri95 !== undefined) {
        const [lo, hi] = credibleInterval(state, fx.cri_level ?? 0.95);
        assertClose(`${tag} CrI lo`, lo, check.cri95[0], fx.tolerance);
        assertClose(`${tag} CrI hi`, hi, check.cri95[1], fx.tolerance);
      }
    }
  }
  console.log(`${file}: done`);
}

if (failures > 0) {
  console.error(`\n${failures}/${checks} checks FAILED`);
  process.exit(1);
}
console.log(`\nAll ${checks} fixture checks passed.`);
