// app.js -- Licensing lab Tab 1 UI. Concatenated after engine.js and sim.js
// by lab/build.mjs; uses their functions directly (no imports here).

const T_MAX = 120;
const NU_MIN = 1;
const NU_MAX = 400;

const SLIDER_SPEC = [
  { key: 'N', label: 'Opportunity rate', sym: 'N', min: 0, max: 6, step: 0.05, fmt: (v) => v.toFixed(2) },
  { key: 'pi', label: 'Positive-token rate', sym: 'π', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'rhoStar', label: 'Counterfactual choice', sym: 'ρ<sup>⋆</sup>', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'omega', label: 'Outside-option share', sym: 'ω', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'deltaM', label: 'Memory discount', sym: 'δ<sub>m</sub>', min: 0.9, max: 1, step: 0.001, fmt: (v) => v.toFixed(3) },
];

const ui = {
  preset: 'licensed',
  params: { ...PRESETS.licensed.params },
  framings: [],
  t: 0,
  playing: false,
  timer: null,
  traj: null,
};

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ghost markers: where each preset ends up at t=120 (computed from the engine,
// so the fig. 2 landmarks are honest).
const GHOSTS = Object.entries(PRESETS).map(([key, p]) => {
  const end = simulate(p.params, T_MAX).at(-1);
  return { key, label: p.label, mean: end.mean, nu: end.nu };
});

function recompute() {
  ui.traj = simulate({ ...ui.params, framings: ui.framings }, T_MAX);
}

// ---- classification (lab display convention; see DECISIONS.md) ----
function classify(row) {
  if (row.nu < 8) {
    return row.opp < 10
      ? { cls: 'uns', text: 'unsettled — starved' }
      : { cls: 'uns', text: 'unsettled — avoidance-divided' };
  }
  if (row.nu >= 40) {
    if (row.mean >= 0.75) return { cls: 'lic', text: 'licensed' };
    if (row.mean <= 0.25) return { cls: 'exc', text: 'excluded' };
    return { cls: 'int', text: 'interior (heterogeneity: Tab 2)' };
  }
  return { cls: 'set', text: 'settling…' };
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
  $('presetBlurb').textContent = PRESETS[ui.preset].blurb;
}

function buildSliders() {
  const box = $('sliders');
  box.innerHTML = '';
  for (const spec of SLIDER_SPEC) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `<label for="sl-${spec.key}">
        <span>${spec.label} <span class="var">${spec.sym}</span></span>
        <output id="out-${spec.key}"></output>
      </label>
      <input type="range" id="sl-${spec.key}" min="${spec.min}" max="${spec.max}" step="${spec.step}">`;
    box.appendChild(row);
    const input = row.querySelector('input');
    input.value = ui.params[spec.key];
    row.querySelector('output').textContent = spec.fmt(ui.params[spec.key]);
    input.addEventListener('input', () => {
      ui.params[spec.key] = parseFloat(input.value);
      delete ui.params.decayTau; // manual slider moves leave preset decay mode
      ui.preset = null;
      document.querySelectorAll('.preset').forEach((b) => b.classList.remove('active'));
      $('presetBlurb').textContent = 'Custom parameters.';
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
  ui.t = 0;
  document.querySelectorAll('.preset').forEach((b) =>
    b.classList.toggle('active', b.dataset.key === key));
  $('presetBlurb').textContent = PRESETS[key].blurb;
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
  }, 45);
}

function pause() {
  ui.playing = false;
  $('playBtn').textContent = 'Play';
  if (ui.timer) { clearInterval(ui.timer); ui.timer = null; }
}

// ---- rendering ----
const TRAJ = { w: 860, h: 300, l: 46, r: 14, top: 14, bot: 34 };
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
  const rows = ui.traj;
  let s = '';
  // grid + axes
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    s += `<line class="gridline" x1="${TRAJ.l}" x2="${TRAJ.w - TRAJ.r}" y1="${tyV(v)}" y2="${tyV(v)}"/>`;
    s += `<text class="axistext" x="${TRAJ.l - 7}" y="${tyV(v) + 3.5}" text-anchor="end">${v}</text>`;
  }
  for (let t = 0; t <= T_MAX; t += 20) {
    s += `<text class="axistext" x="${txT(t)}" y="${TRAJ.h - TRAJ.bot + 16}" text-anchor="middle">${t}</text>`;
  }
  s += `<line class="axisline" x1="${TRAJ.l}" x2="${TRAJ.w - TRAJ.r}" y1="${tyV(0)}" y2="${tyV(0)}"/>`;
  s += `<text class="axislabel" x="${(TRAJ.l + TRAJ.w - TRAJ.r) / 2}" y="${TRAJ.h - 4}" text-anchor="middle">experience (steps)</text>`;
  // ribbon
  const hi = rows.map((r) => `${txT(r.t)},${tyV(r.hi)}`).join(' ');
  const lo = rows.slice().reverse().map((r) => `${txT(r.t)},${tyV(r.lo)}`).join(' ');
  s += `<polygon class="ribbon" points="${hi} ${lo}"/>`;
  // framing markers
  for (const f of ui.framings) {
    s += `<line class="framingline" x1="${txT(f.t)}" x2="${txT(f.t)}" y1="${TRAJ.top}" y2="${tyV(0)}"/>`;
    s += `<text class="framingtext" x="${txT(f.t) + 4}" y="${TRAJ.top + 11}">framing +${f.boost}</text>`;
  }
  // mean line + direct labels
  const mean = rows.map((r) => `${txT(r.t)},${tyV(r.mean)}`).join(' ');
  s += `<polyline class="meanline" points="${mean}"/>`;
  const last = rows[rows.length - 1];
  s += `<text class="directlabel" x="${txT(T_MAX) - 4}" y="${tyV(last.mean) - 7}" text-anchor="end">mean</text>`;
  // ribbon label sits inside the early ribbon, which starts wide in every scenario
  const early = rows[Math.round(T_MAX * 0.06)];
  s += `<text class="ribbonlabel" x="${txT(early.t) + 4}" y="${tyV((early.hi + early.lo) / 2) + 4}">95% CrI</text>`;
  // current-t dot
  const now = rows[ui.t];
  s += `<circle class="nowdot" cx="${txT(now.t)}" cy="${tyV(now.mean)}" r="5"/>`;
  $('trajSvg').innerHTML = s;
}

function renderSS() {
  let s = '';
  // regions (display convention thresholds: nu >= 40 concentrated, nu < 8 diffuse)
  const y40 = syNu(40);
  const y8 = syNu(8);
  const yTop = SS.top;
  const yBot = SS.h - SS.bot;
  s += `<rect class="regionbox" x="${sxC(0)}" y="${yTop}" width="${sxC(0.25) - sxC(0)}" height="${y40 - yTop}"/>`;
  s += `<text class="regiontext" x="${sxC(0.02)}" y="${y40 - 10}">excluded · preempted gap</text>`;
  s += `<rect class="regionbox" x="${sxC(0.75)}" y="${yTop}" width="${sxC(1) - sxC(0.75)}" height="${y40 - yTop}"/>`;
  s += `<text class="regiontext" x="${sxC(0.98)}" y="${y40 - 10}" text-anchor="end">licensed</text>`;
  s += `<rect class="regionbox" x="${sxC(0)}" y="${y8}" width="${sxC(1) - sxC(0)}" height="${yBot - y8}"/>`;
  s += `<text class="regiontext" x="${sxC(0.02)}" y="${yBot - 8}">unsettled — starved / avoidance-divided (low ν)</text>`;
  // grid + axes
  for (const nu of [1, 10, 100]) {
    s += `<line class="gridline" x1="${SS.l}" x2="${SS.w - SS.r}" y1="${syNu(nu)}" y2="${syNu(nu)}"/>`;
    s += `<text class="axistext" x="${SS.l - 7}" y="${syNu(nu) + 3.5}" text-anchor="end">${nu}</text>`;
  }
  for (const c of [0, 0.25, 0.5, 0.75, 1]) {
    s += `<text class="axistext" x="${sxC(c)}" y="${yBot + 16}" text-anchor="middle">${c}</text>`;
  }
  s += `<line class="axisline" x1="${SS.l}" x2="${SS.w - SS.r}" y1="${yBot}" y2="${yBot}"/>`;
  s += `<text class="axislabel" x="${(SS.l + SS.w - SS.r) / 2}" y="${SS.h - 4}" text-anchor="middle">posterior mean C</text>`;
  s += `<text class="axislabel" transform="rotate(-90 14 ${(yTop + yBot) / 2})" x="14" y="${(yTop + yBot) / 2}" text-anchor="middle">concentration ν (log)</text>`;
  // ghost markers: preset end states
  for (const g of GHOSTS) {
    if (g.key === ui.preset) continue;
    s += `<circle class="ghost" cx="${sxC(g.mean)}" cy="${syNu(g.nu)}" r="4.5"/>`;
    const anchor = g.mean > 0.6 ? 'end' : 'start';
    const dx = g.mean > 0.6 ? -8 : 8;
    s += `<text class="ghosttext" x="${sxC(g.mean) + dx}" y="${syNu(g.nu) + 4}" text-anchor="${anchor}">${g.label}</text>`;
  }
  // trace up to current t
  const pts = ui.traj.slice(0, ui.t + 1).map((r) => `${sxC(r.mean)},${syNu(r.nu)}`).join(' ');
  s += `<polyline class="trace" points="${pts}"/>`;
  const now = ui.traj[ui.t];
  s += `<circle class="nowdot" cx="${sxC(now.mean)}" cy="${syNu(now.nu)}" r="6"/>`;
  $('ssSvg').innerHTML = s;
}

function renderReadout() {
  const now = ui.traj[ui.t];
  const st = classify(now);
  const chip = $('chip');
  chip.className = `chip ${st.cls}`;
  chip.textContent = st.text;
  $('roMean').textContent = now.mean.toFixed(3);
  $('roNu').textContent = now.nu.toFixed(1);
  $('roCri').textContent = `${now.lo.toFixed(3)}–${now.hi.toFixed(3)}`;
  const Nt = ui.params.decayTau && ui.t > 0
    ? ui.params.N * Math.exp(-(ui.t - 1) / ui.params.decayTau) : ui.params.N;
  const sV = Nt * ui.params.pi;
  const pV = Nt * (1 - ui.params.pi) * (1 - ui.params.omega) * ui.params.rhoStar;
  $('roStreams').innerHTML = `<small><span class="var">s</span> ${sV.toFixed(2)} · <span class="var">p</span> ${pV.toFixed(2)}</small>`;
  $('scrub').value = ui.t;
  $('tOut').textContent = ui.t;
}

function renderTable() {
  const head = '<tr><th>t</th><th>mean</th><th>2.5%</th><th>97.5%</th><th>ν</th></tr>';
  const rows = [];
  for (let t = 0; t <= T_MAX; t += 10) {
    const r = ui.traj[t];
    rows.push(`<tr><td>${t}</td><td>${r.mean.toFixed(4)}</td><td>${r.lo.toFixed(4)}</td><td>${r.hi.toFixed(4)}</td><td>${r.nu.toFixed(1)}</td></tr>`);
  }
  $('dataTable').innerHTML = head + rows.join('');
}

function render() {
  renderTraj();
  renderSS();
  renderReadout();
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
    const r = ui.traj[t];
    const rect = svg.getBoundingClientRect();
    tip.style.display = 'block';
    tip.innerHTML = `<span class="var">t</span> ${t}<br>mean ${r.mean.toFixed(3)}<br>CrI ${r.lo.toFixed(3)}–${r.hi.toFixed(3)}<br><span class="var">ν</span> ${r.nu.toFixed(1)}`;
    const px = ((txT(t)) / TRAJ.w) * rect.width;
    tip.style.left = `${Math.min(px + 12, rect.width - 130)}px`;
    tip.style.top = '10px';
    // crosshair drawn on top of existing content
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
    const now = ui.traj[ui.t];
    const rect = svg.getBoundingClientRect();
    tip.style.display = 'block';
    tip.innerHTML = `current state<br>mean ${now.mean.toFixed(3)} · <span class="var">ν</span> ${now.nu.toFixed(1)}`;
    tip.style.left = `${Math.min(evt.clientX - rect.left + 14, rect.width - 150)}px`;
    tip.style.top = `${evt.clientY - rect.top + 14}px`;
  });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
}

// ---- wiring ----
function init() {
  buildPresets();
  buildSliders();
  recompute();
  $('playBtn').addEventListener('click', () => (ui.playing ? pause() : play()));
  $('resetBtn').addEventListener('click', () => {
    ui.framings = [];
    ui.t = 0;
    pause();
    recompute();
    render();
  });
  $('scrub').addEventListener('input', (e) => {
    pause();
    ui.t = parseInt(e.target.value, 10);
    render();
  });
  $('framingBtn').addEventListener('click', () => {
    ui.framings.push({ t: ui.t, boost: FRAMING_BOOST });
    recompute();
    render();
  });
  attachTrajHover();
  attachSSHover();
  if (reducedMotion) { ui.t = T_MAX; render(); } else { render(); play(); }
}

init();
