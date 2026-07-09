#!/usr/bin/env node
// Assemble the licensing lab from lab/src/ + the shared engine.
//
// Outputs:
//   lab/index.html    self-contained page (works from file:// and GitHub Pages)
//   lab/artifact.html content-only variant for claude.ai Artifact publishing
//
// The engine is inlined verbatim from js/engine.js (design law: one engine,
// this script copies rather than forks it). Import lines are stripped because
// everything lives in one <script type="module"> block.

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const lab = dirname(fileURLToPath(import.meta.url));
const root = join(lab, '..');
const read = (p) => readFileSync(p, 'utf8');

const stripImports = (src) => src.replace(/^import .*$/gm, '');

const js = [
  read(join(root, 'js', 'engine.js')),
  stripImports(read(join(root, 'js', 'sim.js'))),
  read(join(lab, 'src', 'app.js')),
].join('\n');

// Syntax-check the combined module before emitting HTML.
const tmp = join(lab, '.combined-check.mjs');
writeFileSync(tmp, js);
const check = spawnSync('node', ['--check', tmp], { encoding: 'utf8' });
unlinkSync(tmp);
if (check.status !== 0) {
  console.error('Combined script failed node --check:\n' + check.stderr);
  process.exit(1);
}

const css = read(join(lab, 'src', 'style.css'));
const body = read(join(lab, 'src', 'body.html'));
const title = 'OVMG Licensing Lab';

const index = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Interactive companion to Reynolds, 'Grammaticality de-idealized': the OVMG licensing posterior, live.">
<title>${title}</title>
<style>
${css}
</style>
</head>
<body>
${body}
<script type="module">
${js}
</script>
</body>
</html>
`;

const artifact = `<title>${title}</title>
<style>
${css}
</style>
${body}
<script type="module">
${js}
</script>
`;

writeFileSync(join(lab, 'index.html'), index);
writeFileSync(join(lab, 'artifact.html'), artifact);
console.log('Built lab/index.html and lab/artifact.html (combined script passed node --check).');
