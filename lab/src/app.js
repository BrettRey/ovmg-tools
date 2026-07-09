// app.js -- Licensing lab Tab 1 UI. Concatenated after engine.js and sim.js
// by lab/build.mjs; uses their functions directly (no imports here).
//
// The display runs on sampled evidence (simulateSampled) so the events that
// move the posterior are visible in the feed; the deterministic expectation
// (simulate) is drawn as a dotted overlay.

const T_MAX = 120;
const NU_MIN = 1;
const NU_MAX = 400;

const pct = (v) => `${Math.round(v * 100)}%`;

const SLIDER_SPEC = [
  { key: 'N', label: 'How often does the occasion come up?', sym: 'N', min: 0, max: 6, step: 0.05, fmt: (v) => `${v.toFixed(2)}/step` },
  { key: 'pi', label: 'When it does, how often is this expression what gets said?', sym: 'π', min: 0, max: 1, step: 0.01, fmt: pct },
  { key: 'rhoStar', label: 'If it were available, how often would speakers pick it over the competitor?', sym: 'ρ<sup>⋆</sup>', min: 0, max: 1, step: 0.01, fmt: pct },
  { key: 'omega', label: 'How much of the avoidance is just talking around it?', sym: 'ω', min: 0, max: 1, step: 0.01, fmt: pct },
  { key: 'deltaM', label: 'How well does old evidence stick?', sym: 'δ<sub>m</sub>', min: 0.9, max: 1, step: 0.001, fmt: (v) => (v === 1 ? 'never fades' : pct(v)) },
];

const ui = {
  preset: 'licensed',
  params: { ...PRESETS.licensed.params },
  framings: [],
  seed: PRESETS.licensed.seed,
  t: 0,
  playing: false,
  timer: null,
  run: null,       // { rows, events, tallies } from simulateSampled
  expected: null,  // rows from simulate
};

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Landmarks on the status map: each preset's deterministic endpoint.
const GHOSTS = Object.entries(PRESETS).map(([key, p]) => {
  const end = simulate(p.params, T_MAX).at(-1);
  return { key, label: p.label, mean: end.mean, nu: end.nu };
});

function recompute() {
  ui.run = simulateSampled({ ...ui.params, framings: ui.framings }, T_MAX, ui.seed);
  ui.expected = simulate({ ...ui.params, framings: ui.framings }, T_MAX);
}

// ---- classification (lab display convention; see DECISIONS.md) ----
function classify(row) {
  if (row.nu < 8) {
    return row.opp < 10
      ? { cls: 'uns', text: 'unsettled: starved', gloss: 'too little has happened to tell' }
      : { cls: 'uns', text: 'unsettled: avoidance', gloss: 'plenty happens, but it settles nothing' };
  }
  if (row.nu >= 40) {
    if (row.mean >= 0.75) return { cls: 'lic', text: 'licensed', gloss: 'the evidence is in, and it’s yes' };
    if (row.mean <= 0.25) return { cls: 'exc', text: 'confidently out', gloss: 'the evidence is in, and it’s no' };
    return { cls: 'int', text: 'split verdict', gloss: 'a population-level story: Tab 2' };
  }
  return { cls: 'set', text: 'still settling', gloss: 'evidence accumulating' };
}

// ---- controls ----
function buildPresets() {
  const box = $('presets');
  box.innerHTML = '';
  for (const [key, p] of Object.entries(PRESETS)) {
    const btn = document.createElement('button');
    btn.className = 'preset' + (key === ui.preset ? ' active' : '');
    btn.dataset.key = key;
    btn.innerHTML = `${p.label} <span class="ex"><span class="mark">${p.marker}</span><em class="mention">${p.example}</em></span>`;
    btn.addEventListener('click', () => setPreset(key));
    box.appendChild(btn);
  }
}

function setBanner() {
  if (ui.preset) {
    $('bannerQ').innerHTML = PRESETS[ui.preset].question;
    $('bannerWatch').textContent = PRESETS[ui.preset].watch;
  } else {
    $('bannerQ').textContent = 'A world you’ve built.';
    $('bannerWatch').textContent = 'Watch how the guess and the band respond to the evidence your sliders generate; replay or resample any time.';
  }
}

function buildSliders() {
  const box = $('sliders');
  box.innerHTML = '';
  for (const spec of SLIDER_SPEC) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `<label for="sl-${spec.key}">
        <span>${spec.label} <span class="symnote">(${spec.sym})</span></span>
        <output id="out-${spec.key}"></output>
      </label>
      <input type="range" id="sl-${spec.key}" min="${spec.min}" max="${spec.max}" step="${spec.step}">`;
    box.appendChild(row);
    const input = row.querySelector('input');
    input.value = ui.params[spec.key];
    row.querySelector('output').textContent = spec.fmt(ui.params[spec.key]);
    input.addEventListener('input', () => {
      ui.params[spec.key] = parseFloat(input.value);
      delete ui.params.decayTau; // manual moves leave preset decay mode
      ui.preset = null;
      document.querySelectorAll('.preset').forEach((b) => b.classList.remove('active'));
      setBanner();
      row.querySelector('output').textContent = spec.fmt(ui.params[spec.key]);
      recompute();
      render();
    });
  }
}

function syncSliders() {
  for (const spec of SLIDER_SPEC) {
    $(`sl-${spec.key}`).value = ui.params[spec.key];
    $(`out-${spec.key}`).textContent = spec.fmt(ui.params[spec.key]);
  }
}

function setPreset(key) {
  ui.preset = key;
  ui.params = { ...PRESETS[key].params };
  ui.framings = [];
  ui.seed = PRESETS[key].seed;
  ui.t = 0;
  document.querySelectorAll('.preset').forEach((b) =>
    b.classList.toggle('active', b.dataset.key === key));
  setBanner();
  syncSliders();
  recompute();
  if (reducedMotion) { ui.t = T_MAX; render(); } else { play(); }
}

function play() {
  if (ui.playing) return;
  if (ui.t >= T_MAX) ui.t = 0;
  ui.playing = true;
  $('playBtn').textContent = 'Pause';
  ui.timer = setInterval(() => {
    ui.t += 1;
    if (ui.t >= T_MAX) { ui.t = T_MAX; pause(); }
    render();
  }, 80);
}

function pause() {
  ui.playing = false;
  $('playBtn').textContent = ui.t >= T_MAX ? 'Replay' : 'Play';
  if (ui.timer) { clearInterval(ui.timer); ui.timer = null; }
}

// ---- rendering ----
const TRAJ = { w: 860, h: 300, l: 56, r: 14, top: 14, bot: 34 };
const SS = { w: 860, h: 330, l: 56, r: 14, top: 16, bot: 36 };

const txT = (t) => TRAJ.l + (t / T_MAX) * (TRAJ.w - TRAJ.l - TRAJ.r);
const tyV = (v) => TRAJ.top + (1 - v) * (TRAJ.h - TRAJ.top - TRAJ.bot);
const sxC = (c) => SS.l + c * (SS.w - SS.l - SS.r);
const syNu = (nu) => {
  const z = (Math.log10(Math.min(Math.max(nu, NU_MIN), NU_MAX)) - Math.log10(NU_MIN)) /
    (Math.log10(NU_MAX) - Math.log10(NU_MIN));
  return SS.top + (1 - z) * (SS.h - SS.top - SS.bot);
};

function renderTraj() {
  const rows = ui.run.rows;
  let s = '';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    s += `<line class="gridline" x1="${TRAJ.l}" x2="${TRAJ.w - TRAJ.r}" y1="${tyV(v)}" y2="${tyV(v)}"/>`;
    s += `<text class="axistext" x="${TRAJ.l - 7}" y="${tyV(v) + 3.5}" text-anchor="end">${v}</text>`;
  }
  for (let t = 0; t <= T_MAX; t += 20) {
    s += `<text class="axistext" x="${txT(t)}" y="${TRAJ.h - TRAJ.bot + 16}" text-anchor="middle">${t}</text>`;
  }
  s += `<line class="axisline" x1="${TRAJ.l}" x2="${TRAJ.w - TRAJ.r}" y1="${tyV(0)}" y2="${tyV(0)}"/>`;
  s += `<text class="axislabel" x="${(TRAJ.l + TRAJ.w - TRAJ.r) / 2}" y="${TRAJ.h - 4}" text-anchor="middle">exposure (steps)</text>`;
  s += `<text class="axislabel" transform="rotate(-90 14 ${(TRAJ.top + tyV(0)) / 2})" x="14" y="${(TRAJ.top + tyV(0)) / 2}" text-anchor="middle">share who license it</text>`;
  // plausible band
  const hi = rows.map((r) => `${txT(r.t)},${tyV(r.hi)}`).join(' ');
  const lo = rows.slice().reverse().map((r) => `${txT(r.t)},${tyV(r.lo)}`).join(' ');
  s += `<polygon class="ribbon" points="${hi} ${lo}"/>`;
  // framing markers
  for (const f of ui.framings) {
    s += `<line class="framingline" x1="${txT(f.t)}" x2="${txT(f.t)}" y1="${TRAJ.top}" y2="${tyV(0)}"/>`;
    s += `<text class="framingtext" x="${txT(f.t) + 4}" y="${TRAJ.top + 11}">frame +${f.boost}</text>`;
  }
  // expected path (dotted) then sampled guess (solid)
  const exp = ui.expected.map((r) => `${txT(r.t)},${tyV(r.mean)}`).join(' ');
  s += `<polyline class="expectedline" points="${exp}"/>`;
  const mean = rows.map((r) => `${txT(r.t)},${tyV(r.mean)}`).join(' ');
  s += `<polyline class="meanline" points="${mean}"/>`;
  const last = rows[rows.length - 1];
  s += `<text class="directlabel" x="${txT(T_MAX) - 4}" y="${tyV(last.mean) - 7}" text-anchor="end">guess</text>`;
  const early = rows[Math.round(T_MAX * 0.06)];
  s += `<text class="ribbonlabel" x="${txT(early.t) + 4}" y="${tyV((early.hi + early.lo) / 2) + 4}">still plausible</text>`;
  const now = rows[ui.t];
  s += `<circle class="nowdot" cx="${txT(now.t)}" cy="${tyV(now.mean)}" r="5"/>`;
  $('trajSvg').innerHTML = s;
}

function renderSS() {
  let s = '';
  const y40 = syNu(40);
  const y8 = syNu(8);
  const yTop = SS.top;
  const yBot = SS.h - SS.bot;
  s += `<rect class="regionbox" x="${sxC(0)}" y="${yTop}" width="${sxC(0.25) - sxC(0)}" height="${y40 - yTop}"/>`;
  s += `<text class="regiontext" x="${sxC(0.02)}" y="${y40 - 10}">confidently out</text>`;
  s += `<rect class="regionbox" x="${sxC(0.75)}" y="${yTop}" width="${sxC(1) - sxC(0.75)}" height="${y40 - yTop}"/>`;
  s += `<text class="regiontext" x="${sxC(0.98)}" y="${y40 - 10}" text-anchor="end">licensed</text>`;
  s += `<rect class="regionbox" x="${sxC(0)}" y="${y8}" width="${sxC(1) - sxC(0)}" height="${yBot - y8}"/>`;
  s += `<text class="regiontext" x="${sxC(0.02)}" y="${yBot - 8}">unsettled: not enough signal to tell</text>`;
  for (const nu of [1, 10, 100]) {
    s += `<line class="gridline" x1="${SS.l}" x2="${SS.w - SS.r}" y1="${syNu(nu)}" y2="${syNu(nu)}"/>`;
    s += `<text class="axistext" x="${SS.l - 7}" y="${syNu(nu) + 3.5}" text-anchor="end">${nu}</text>`;
  }
  for (const c of [0, 0.25, 0.5, 0.75, 1]) {
    s += `<text class="axistext" x="${sxC(c)}" y="${yBot + 16}" text-anchor="middle">${c}</text>`;
  }
  s += `<line class="axisline" x1="${SS.l}" x2="${SS.w - SS.r}" y1="${yBot}" y2="${yBot}"/>`;
  s += `<text class="axislabel" x="${(SS.l + SS.w - SS.r) / 2}" y="${SS.h - 4}" text-anchor="middle">best guess (share who license it)</text>`;
  s += `<text class="axislabel" transform="rotate(-90 14 ${(yTop + yBot) / 2})" x="14" y="${(yTop + yBot) / 2}" text-anchor="middle">weight of evidence (log)</text>`;
  for (const g of GHOSTS) {
    if (g.key === ui.preset) continue;
    s += `<circle class="ghost" cx="${sxC(g.mean)}" cy="${syNu(g.nu)}" r="4.5"/>`;
    const anchor = g.mean > 0.6 ? 'end' : 'start';
    const dx = g.mean > 0.6 ? -8 : 8;
    s += `<text class="ghosttext" x="${sxC(g.mean) + dx}" y="${syNu(g.nu) + 4}" text-anchor="${anchor}">${g.label}</text>`;
  }
  const pts = ui.run.rows.slice(0, ui.t + 1).map((r) => `${sxC(r.mean)},${syNu(r.nu)}`).join(' ');
  s += `<polyline class="trace" points="${pts}"/>`;
  const now = ui.run.rows[ui.t];
  s += `<circle class="nowdot" cx="${sxC(now.mean)}" cy="${syNu(now.nu)}" r="6"/>`;
  $('ssSvg').innerHTML = s;
}

function renderReadout() {
  const now = ui.run.rows[ui.t];
  const st = classify(now);
  const chip = $('chip');
  chip.className = `chip ${st.cls}`;
  chip.textContent = st.text;
  $('chipGloss').textContent = st.gloss;
  $('roMean').textContent = now.mean.toFixed(2);
  $('roNu').textContent = now.nu < 10 ? now.nu.toFixed(1) : Math.round(now.nu);
  $('roCri').textContent = `${now.lo.toFixed(2)}–${now.hi.toFixed(2)}`;
  $('scrub').value = ui.t;
  $('tOut').textContent = ui.t;
  if (!ui.playing) $('playBtn').textContent = ui.t >= T_MAX ? 'Replay' : 'Play';
}

function renderFeed() {
  const framingsByT = new Map();
  for (const f of ui.framings) framingsByT.set(f.t, (framingsByT.get(f.t) || 0) + f.boost);
  const evs = ui.run.events.slice(0, ui.t);
  const lines = [];
  let i = evs.length - 1;
  while (i >= 0 && lines.length < 14) {
    const e = evs[i];
    if (framingsByT.has(e.t)) {
      lines.push(`<div class="frame">step ${e.t} · friendly frame (+${framingsByT.get(e.t)} imagined uses)</div>`);
    }
    if (e.occasions === 0) {
      let j = i;
      while (j > 0 && evs[j - 1].occasions === 0 && !framingsByT.has(evs[j - 1].t)) j -= 1;
      lines.push(`<div class="meh">${j === i ? `step ${e.t}` : `steps ${evs[j].t}–${e.t}`} · nothing came up</div>`);
      i = j - 1;
    } else {
      const parts = [];
      if (e.heard) parts.push(`<span class="for">heard it ×${e.heard}</span>`);
      if (e.competitor) parts.push(`<span class="against">competitor won ×${e.competitor}</span>`);
      if (e.workaround) parts.push(`<span class="meh">workaround ×${e.workaround}</span>`);
      lines.push(`<div>step ${e.t} · ${parts.join(' · ')}</div>`);
      i -= 1;
    }
  }
  $('feed').innerHTML = lines.length ? lines.join('') : '<div class="meh">press Play</div>';
  const tal = ui.run.tallies;
  const upTo = evs.reduce((acc, e) => ({
    heard: acc.heard + e.heard,
    competitor: acc.competitor + e.competitor,
    workaround: acc.workaround + e.workaround,
    quiet: acc.quiet + (e.occasions === 0 ? 1 : 0),
  }), { heard: 0, competitor: 0, workaround: 0, quiet: 0 });
  const chips = [
    `<span class="tally"><span class="for">heard it</span> ×${upTo.heard}</span>`,
    `<span class="tally"><span class="against">competitor</span> ×${upTo.competitor}</span>`,
    `<span class="tally">workaround ×${upTo.workaround}</span>`,
  ];
  if (upTo.quiet > 0) chips.push(`<span class="tally">quiet steps ×${upTo.quiet}</span>`);
  $('tallies').innerHTML = chips.join('');
  void tal; // full-run tallies available if needed
}

function renderTable() {
  const head = '<tr><th>step</th><th>guess</th><th>low</th><th>high</th><th>evidence</th></tr>';
  const rows = [];
  for (let t = 0; t <= T_MAX; t += 10) {
    const r = ui.run.rows[t];
    rows.push(`<tr><td>${t}</td><td>${r.mean.toFixed(4)}</td><td>${r.lo.toFixed(4)}</td><td>${r.hi.toFixed(4)}</td><td>${r.nu.toFixed(1)}</td></tr>`);
  }
  $('dataTable').innerHTML = head + rows.join('');
}

function render() {
  renderTraj();
  renderSS();
  renderReadout();
  renderFeed();
  renderTable();
}

// ---- hover layer ----
function attachTrajHover() {
  const svg = $('trajSvg');
  const tip = $('trajTip');
  const toT = (evt) => {
    const rect = svg.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) / rect.width) * TRAJ.w;
    return Math.max(0, Math.min(T_MAX, Math.round(((x - TRAJ.l) / (TRAJ.w - TRAJ.l - TRAJ.r)) * T_MAX)));
  };
  svg.addEventListener('mousemove', (evt) => {
    const t = toT(evt);
    const r = ui.run.rows[t];
    const rect = svg.getBoundingClientRect();
    tip.style.display = 'block';
    tip.innerHTML = `step ${t}<br>guess ${r.mean.toFixed(3)}<br>plausible ${r.lo.toFixed(3)}–${r.hi.toFixed(3)}<br>evidence ${r.nu.toFixed(1)}`;
    const px = (txT(t) / TRAJ.w) * rect.width;
    tip.style.left = `${Math.min(px + 12, rect.width - 140)}px`;
    tip.style.top = '10px';
    const old = svg.querySelector('.crosshair');
    if (old) old.remove();
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'crosshair');
    line.setAttribute('x1', txT(t)); line.setAttribute('x2', txT(t));
    line.setAttribute('y1', TRAJ.top); line.setAttribute('y2', tyV(0));
    svg.appendChild(line);
  });
  svg.addEventListener('mouseleave', () => {
    tip.style.display = 'none';
    const old = svg.querySelector('.crosshair');
    if (old) old.remove();
  });
}

function attachSSHover() {
  const svg = $('ssSvg');
  const tip = $('ssTip');
  svg.addEventListener('mousemove', (evt) => {
    const now = ui.run.rows[ui.t];
    const rect = svg.getBoundingClientRect();
    tip.style.display = 'block';
    tip.innerHTML = `current state<br>guess ${now.mean.toFixed(3)} · evidence ${now.nu.toFixed(1)}`;
    tip.style.left = `${Math.min(evt.clientX - rect.left + 14, rect.width - 150)}px`;
    tip.style.top = `${evt.clientY - rect.top + 14}px`;
  });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
}

// ---- wiring ----
function init() {
  buildPresets();
  buildSliders();
  setBanner();
  recompute();
  $('playBtn').addEventListener('click', () => (ui.playing ? pause() : play()));
  $('resampleBtn').addEventListener('click', () => {
    ui.seed = 1 + Math.floor(Math.random() * 2147483646);
    ui.t = 0;
    pause();
    recompute();
    if (reducedMotion) { ui.t = T_MAX; render(); } else { play(); }
  });
  $('scrub').addEventListener('input', (e) => {
    pause();
    ui.t = parseInt(e.target.value, 10);
    render();
  });
  $('framingBtn').addEventListener('click', () => {
    ui.framings.push({ t: Math.max(1, ui.t), boost: FRAMING_BOOST });
    recompute();
    render();
  });
  attachTrajHover();
  attachSSHover();
  if (reducedMotion) { ui.t = T_MAX; render(); } else { render(); play(); }
}

init();
