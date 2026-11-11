import { Game, statsFor, hasModel } from './game.js';
import { assets } from './models.js';
import { Sound } from './audio.js';
import { CARS, carById, STARTER } from './cars.js';
import { TRACKS, trackById, STYLE_INFO } from './tracks.js';
import { store, clamp, hash } from './util.js';
import { OpenWorld } from './openworld.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'umuhanda.save.v2';
const PAINTS = ['#e8b923', '#d6342b', '#ff7a00', '#c8ff2e', '#2f7d4f', '#3fb6a8', '#2e6ec9', '#7a3fd0', '#ff4fa3', '#e5e5ea', '#6a6e75', '#17171a'];
const GLOWS = [null, '#00e5ff', '#ff3d6e', '#7dff9b', '#b56bff', '#ffd75e'];
const UPS = [['eng', 'ENGINE'], ['tur', 'TURBO'], ['tyr', 'TYRES'], ['brk', 'BRAKES']];

const save = Object.assign({ owned: [STARTER], sel: STARTER, track: 'guia-circuit-macau', paint: {}, glow: {}, up: {}, best: {}, set: { quality: 1.5, assist: true, autoGas: true, sound: true, dev: 'auto', tilt: false } }, store(SAVE_KEY) || {});
save.set = Object.assign({ dev: 'auto', tilt: false }, save.set);
const persist = () => store(SAVE_KEY, save);

const sound = new Sound();
const game = new Game($('gl'), sound);
window.__game = game; window.__tracks = trackById;
Object.assign(game.settings, { quality: save.set.quality, assist: save.set.assist, autoGas: save.set.autoGas, tilt: !!save.set.tilt }); sound.on = save.set.sound;
game.resize();

/* ---------- generated fallback art (used when a web image fails to load) ---------- */
const artCache = {};
function art(name, kind) {
  const k = kind + name; if (artCache[k]) return artCache[k];
  const c = document.createElement('canvas'); c.width = 320; c.height = 200; const g = c.getContext('2d');
  const h = Math.floor(hash(name.length * 17 + name.charCodeAt(0) * 3) * 360);
  const gr = g.createLinearGradient(0, 0, 320, 200); gr.addColorStop(0, `hsl(${h},60%,22%)`); gr.addColorStop(1, `hsl(${(h + 60) % 360},70%,10%)`);
  g.fillStyle = gr; g.fillRect(0, 0, 320, 200);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3;
  if (kind === 't') { g.beginPath(); g.moveTo(40, 160); g.bezierCurveTo(90, 20, 160, 190, 200, 80); g.bezierCurveTo(230, 20, 290, 60, 280, 140); g.stroke(); }
  else { g.beginPath(); g.moveTo(40, 140); g.lineTo(80, 110); g.lineTo(130, 95); g.lineTo(200, 95); g.lineTo(250, 120); g.lineTo(285, 140); g.stroke(); g.beginPath(); g.arc(95, 145, 18, 0, 7); g.arc(235, 145, 18, 0, 7); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.85)'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.fillText(name.length > 26 ? name.slice(0, 25) + '…' : name, 160, 185);
  return (artCache[k] = c.toDataURL('image/jpeg', 0.8));
}
document.addEventListener('error', (e) => { const t = e.target; if (t.tagName === 'IMG' && t.dataset.n && !t.dataset.fb) { t.dataset.fb = 1; t.src = art(t.dataset.n, t.dataset.k); } }, true);
const img = (url, name, kind, extra = '') => `<img ${extra} src="${url || art(name, kind)}" data-n="${name.replace(/"/g, '')}" data-k="${kind}" loading="lazy" referrerpolicy="no-referrer" alt="">`;
function setImg(el, url, name, kind) { el.dataset.fb = ''; el.dataset.n = name; el.dataset.k = kind; el.referrerPolicy = 'no-referrer'; el.src = url || art(name, kind); }

const upOf = (id) => (save.up[id] = save.up[id] || { eng: 0, tur: 0, tyr: 0, brk: 0 });
const paintOf = (def) => save.paint[def.id] || def.paint;
const show = (id) => $(id).classList.remove('hide');
const hide = (id) => $(id).classList.add('hide');
const screens = ['title', 'modes', 'garage', 'tracks', 'settings', 'pause', 'over'];
function go(id) { screens.forEach(hide); if (id) show(id); $('hud').classList.toggle('hide', id !== null && id !== 'pause'); }

let runMode = 'open', theme = 'auto', dens = 1;

function applyCar() { const def = carById(save.sel); game.paint = paintOf(def); game.glow = save.glow[def.id] || null; return def; }
function demo() {
  document.body.classList.remove('ow-mode'); if (game.ow) game.ow.hideHud();
  const def = applyCar(); game.settings.density = 1;
  game.reset('highway', def, upOf(def.id), true, trackById(save.track)); game.settings.theme = trackById(save.track).theme; game.applyTheme(game.settings.theme); game.state = 'title';
}

/* ---------- device detection: controls follow the device in use ---------- */
let device = 'keyboard', lastPad = false;
function hintText() {
  if (device === 'touch') return save.set.tilt ? 'Tilt phone to steer · BRAKE · N₂O nitro · 📷 camera' : 'Hold ◀ ▶ to steer · BRAKE · N₂O nitro · 📷 camera';
  if (device === 'pad') return 'Left stick steer · RT / A gas · LT / B brake · X nitro · Y camera · Start pause';
  return '← → / A D steer · ↑ W gas · ↓ S Space brake · Shift / N nitro · C camera · P pause';
}
function setDevice(d) {
  if (save.set.dev !== 'auto') d = save.set.dev;
  device = d; document.body.classList.toggle('dev-touch', d === 'touch'); document.body.classList.toggle('dev-pad', d === 'pad');
  document.body.classList.toggle('tilt', d === 'touch' && !!save.set.tilt);
  $('keysInfo').innerHTML = hintText() + '<br>Controls follow the device you are using (touch, keyboard or gamepad).';
}
setDevice(matchMedia('(pointer:coarse)').matches ? 'touch' : 'keyboard');
window.addEventListener('touchstart', () => { if (device !== 'touch') setDevice('touch'); }, { passive: true });
window.addEventListener('keydown', () => { if (device !== 'keyboard') setDevice('keyboard'); });
window.addEventListener('mousemove', (e) => { if (e.movementX && device === 'touch' && !matchMedia('(pointer:coarse)').matches) setDevice('keyboard'); });
setInterval(() => {
  const gps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const active = gps.some((g) => g.buttons.some((b) => b.pressed) || g.axes.some((a) => Math.abs(a) > 0.5));
  if (active && !lastPad) setDevice('pad'); lastPad = active;
}, 400);
let hintTimer = 0;
function flashHint() { const h = $('hint'); h.textContent = hintText(); h.classList.add('on'); clearTimeout(hintTimer); hintTimer = setTimeout(() => h.classList.remove('on'), 7000); }
// tilt steering
function tiltHandler(e) {
  const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0; let v;
  if (ang === 90) v = e.beta; else if (ang === 270 || ang === -90) v = -e.beta; else v = e.gamma;
  game.tilt = clamp((v || 0) / 28, -1, 1);
  if (Math.abs(game.tilt) < 0.06) game.tilt = 0;
}
function enableTilt(on) {
  game.settings.tilt = on; document.body.classList.toggle('tilt', on && device === 'touch');
  if (!on) { game.tilt = null; window.removeEventListener('deviceorientation', tiltHandler); return; }
  const add = () => window.addEventListener('deviceorientation', tiltHandler);
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted') add(); else { save.set.tilt = false; game.settings.tilt = false; } }).catch(() => {}); else add();
}
if (save.set.tilt) enableTilt(true);

/* ---------- title / modes ---------- */
$('bPlay').onclick = () => { sound.init(); sound.burst('ui'); updateBest(); refreshTrackCard(); go('modes'); };
$('bGarage').onclick = () => { sound.init(); openGarage(); };
$('bSet').onclick = () => { sound.init(); go('settings'); };
$('mBack').onclick = () => go('title');
function updateBest() { const b = save.best; $('bestH').textContent = b.highway ? 'BEST ' + Math.round(b.highway).toLocaleString() : ''; $('bestP').textContent = b.pursuit ? 'BEST HEAT ' + b.pursuit : ''; }
document.querySelectorAll('.card').forEach((c) => { c.onclick = () => { document.querySelectorAll('.card').forEach((x) => x.classList.remove('sel')); c.classList.add('sel'); runMode = c.dataset.mode; }; });
const chipGroup = (sel, fn) => document.querySelectorAll(sel + ' button').forEach((b) => { b.onclick = () => { document.querySelectorAll(sel + ' button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); fn(b); }; });
chipGroup('#themeChips', (b) => { theme = b.dataset.t; });
chipGroup('#densChips', (b) => { dens = parseFloat(b.dataset.d); });
$('mGo').onclick = () => startRun();
function refreshTrackCard() { const t = trackById(save.track); setImg($('tcImg'), t.img, t.name, 't'); $('tcName').textContent = t.name; $('tcMeta').textContent = `${t.label}${t.country ? ' · ' + t.country : ''}`; }
function startOpen() {
  sound.init();
  const def = applyCar(), up = upOf(def.id);
  if (!game.ow) game.ow = new OpenWorld(game);
  game.ow.start(def, up, statsFor(def, up), game.paint, game.glow);
  game.state = 'open'; document.body.classList.add('ow-mode');
  $('pops').innerHTML = ''; go(null); $('hud').classList.remove('hide'); flashHint();
  game.popup('OPEN WORLD — DRIVE ANYWHERE', 'good');
}
function startRun() {
  if (runMode === 'open') return startOpen();
  document.body.classList.remove('ow-mode'); if (game.ow) game.ow.hideHud();
  sound.init();
  const def = applyCar(), tr = trackById(save.track);
  game.settings.theme = theme === 'auto' ? tr.theme : theme; game.settings.density = dens;
  game.reset(runMode, def, upOf(def.id), false, tr);
  $('topC').classList.toggle('hide', runMode !== 'pursuit');
  setImg($('hudImg'), def.img, def.name, 'c'); $('hudCar').textContent = def.name; $('hudTrack').textContent = tr.name;
  $('pops').innerHTML = ''; go(null); $('hud').classList.remove('hide'); flashHint();
  game.popup(runMode === 'pursuit' ? 'HOT PURSUIT — ESCAPE THE POLICE' : 'HIGHWAY RUSH — NEAR MISSES = POINTS', runMode === 'pursuit' ? 'warn' : 'good');
}

/* ---------- track picker ---------- */
let tFilter = '', tText = '';
function buildTracks() {
  const q = tText.toLowerCase();
  const list = TRACKS.filter((t) => (!tFilter || t.style === tFilter) && (!q || (t.name + ' ' + t.country).toLowerCase().includes(q)));
  $('tGrid').innerHTML = list.map((t) => `<button class="tcard ${t.id === save.track ? 'on' : ''}" data-id="${t.id}">${img(t.img, t.name, 't')}<div class="cap"><span>${t.label} · ${t.country || ''}</span>${t.name}</div></button>`).join('') || '<p class="muted">No circuits match.</p>';
  $('tGrid').querySelectorAll('.tcard').forEach((b) => { b.onclick = () => { save.track = b.dataset.id; persist(); refreshTrackCard(); sound.burst('ui'); go('modes'); }; });
}
$('trackCard').onclick = () => { go('tracks'); buildTracks(); };
$('tBack').onclick = () => go('modes');
$('tSearch').oninput = (e) => { tText = e.target.value; buildTracks(); };
chipGroup('#tFilter', (b) => { tFilter = b.dataset.f; buildTracks(); });

/* ---------- settings ---------- */
$('sQual').value = String(save.set.quality); $('sAssist').value = save.set.assist ? '1' : '0'; $('sGas').value = save.set.autoGas ? '1' : '0'; $('sSnd').value = save.set.sound ? '1' : '0'; $('sDev').value = save.set.dev; $('sTilt').value = save.set.tilt ? '1' : '0';
$('sBack').onclick = () => {
  save.set.quality = parseFloat($('sQual').value); save.set.assist = $('sAssist').value === '1'; save.set.autoGas = $('sGas').value === '1'; save.set.sound = $('sSnd').value === '1';
  save.set.dev = $('sDev').value; const tilt = $('sTilt').value === '1'; const tiltChanged = tilt !== save.set.tilt; save.set.tilt = tilt;
  Object.assign(game.settings, { quality: save.set.quality, assist: save.set.assist, autoGas: save.set.autoGas }); sound.setOn(save.set.sound); game.resize();
  if (tiltChanged) enableTilt(tilt); setDevice(device); persist(); go('title');
};

/* ---------- garage ---------- */
let curId = save.sel, gText = '';
const filtered = () => { const q = gText.toLowerCase(); return CARS.filter((c) => !q || (c.name + ' ' + c.cls).toLowerCase().includes(q)); };
function openGarage() { curId = save.sel; gText = ''; $('gSearch').value = ''; game.state = 'garage'; go('garage'); buildList(); refreshGarage(true); }
function buildList() {
  $('gList').innerHTML = filtered().map((c) => `<button class="ccard ${c.id === curId ? 'on' : ''}" data-id="${c.id}">${img(c.img, c.name, 'c')}<div><b>${c.name}</b><span class="${save.owned.includes(c.id) ? 'own' : ''}">${save.owned.includes(c.id) ? 'OWNED' : '$ ' + c.price.toLocaleString()}</span><span class="tier">${'★'.repeat(c.tier)}</span></div></button>`).join('');
  $('gList').querySelectorAll('.ccard').forEach((b) => { b.onclick = () => { curId = b.dataset.id; refreshGarage(true); markList(); }; });
}
function markList() { $('gList').querySelectorAll('.ccard').forEach((b) => { const on = b.dataset.id === curId; b.classList.toggle('on', on); if (on) b.scrollIntoView({ inline: 'center', block: 'nearest' }); }); }
function bar(label, v) { return `<div class="s">${label}<i><b style="width:${clamp(v, 0, 1) * 100}%"></b></i></div>`; }
function refreshGarage(reload) {
  const def = carById(curId), owned = save.owned.includes(def.id), up = upOf(def.id), st = statsFor(def, up);
  $('gName').textContent = def.name; $('gCls').textContent = def.cls + ' · ' + '★'.repeat(def.tier) + (hasModel(def.id) ? ' · REAL 3D MODEL' : ' · generic 3D body');
  setImg($('gImg'), def.img, def.name, 'c');
  $('gStats').innerHTML = bar('SPEED', st.top * 3.6 / 440) + bar('ACCEL', st.acc / 18) + bar('HANDLING', st.hnd / 1.7) + bar('BRAKES', st.brk / 44) + bar('NITRO', st.nit / 1.9);
  const b = $('gBuy');
  if (!owned) { b.textContent = `BUY — $ ${def.price.toLocaleString()} (FREE · ∞ CASH)`; b.className = 'big'; }
  else if (save.sel !== def.id) { b.textContent = 'SELECT THIS CAR'; b.className = 'big'; }
  else { b.textContent = '✔ SELECTED — DRIVE'; b.className = 'big alt'; }
  const pc = paintOf(def), gl = save.glow[def.id] || null;
  $('gPaint').innerHTML = PAINTS.map((c) => `<button style="background:${c}" data-c="${c}" class="${c === pc ? 'on' : ''}"></button>`).join('');
  $('gGlow').innerHTML = GLOWS.map((c) => `<button style="background:${c || '#222'}" data-c="${c || ''}" class="${c === gl ? 'on' : ''}">${c ? '' : '✕'}</button>`).join('');
  $('gPaint').querySelectorAll('button').forEach((x) => { x.onclick = () => { ensureOwned(def); save.paint[def.id] = x.dataset.c; persist(); game.recolorGarage(x.dataset.c, save.glow[def.id]); refreshGarage(); }; });
  $('gGlow').querySelectorAll('button').forEach((x) => { x.onclick = () => { ensureOwned(def); save.glow[def.id] = x.dataset.c || null; persist(); game.recolorGarage(paintOf(def), save.glow[def.id]); refreshGarage(); }; });
  $('gUp').innerHTML = UPS.map(([k, l]) => `<div class="up"><span>${l}</span><div class="pips">${[1, 2, 3, 4, 5].map((n) => `<u class="${up[k] >= n ? 'on' : ''}"></u>`).join('')}</div><button data-k="${k}">${up[k] >= 5 ? 'MAX' : '+'}</button></div>`).join('');
  $('gUp').querySelectorAll('button').forEach((x) => { x.onclick = () => { ensureOwned(def); const k = x.dataset.k; if (up[k] < 5) up[k]++; persist(); refreshGarage(); }; });
  if (reload) game.showInGarage(def, pc, gl);
}
function ensureOwned(def) { if (!save.owned.includes(def.id)) { save.owned.push(def.id); sound.burst('ui'); persist(); buildList(); } }
$('gBuy').onclick = () => {
  const def = carById(curId); sound.burst('ui');
  if (!save.owned.includes(def.id)) { ensureOwned(def); save.sel = def.id; } else if (save.sel !== def.id) save.sel = def.id; else { leaveGarage(); return; }
  persist(); buildList(); refreshGarage();
};
$('gSearch').oninput = (e) => { gText = e.target.value; buildList(); };
$('gBack').onclick = leaveGarage;
function leaveGarage() { demo(); go('title'); }

/* ---------- pause / result ---------- */
game.onPauseKey = () => { if (game.state === 'play' || game.state === 'open') pause(); else if (game.state === 'paused' || game.state === 'openpaused') resume(); };
function pause() { game.state = game.state === 'open' ? 'openpaused' : 'paused'; go('pause'); $('hud').classList.remove('hide'); }
function resume() { game.state = game.state === 'openpaused' ? 'open' : 'play'; go(null); $('hud').classList.remove('hide'); game.last = performance.now(); }
$('pauseBtn').onclick = pause; $('pResume').onclick = resume;
$('pRestart').onclick = () => startRun();
$('pQuit').onclick = () => { demo(); go('title'); };
game.onEnd = (r) => {
  const key = r.mode === 'pursuit' ? 'pursuit' : 'highway';
  const val = key === 'pursuit' ? r.heat : r.score; if (val > (save.best[key] || 0)) save.best[key] = val; persist();
  $('oTitle').textContent = r.reason === 'BUSTED' ? 'BUSTED!' : 'WRECKED!'; $('oTitle').className = 'bad';
  const rows = [['Track', game.track.name], ['Car', r.car], ['Score', Math.round(r.score).toLocaleString()], ['Distance', (r.dist / 1000).toFixed(2) + ' km'], ['Top speed', Math.round(r.topV * 3.6) + ' km/h'], ['Near misses', r.near]];
  if (r.mode === 'pursuit') rows.push(['Heat reached', r.heat], ['Takedowns', r.takedowns]);
  $('oStats').innerHTML = rows.map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join('');
  setTimeout(() => { go('over'); }, 900);
};
$('oAgain').onclick = startRun; $('oGarage').onclick = openGarage; $('oMenu').onclick = () => { demo(); go('title'); };

/* ---------- HUD ---------- */
game.onPopup = (txt, cls) => {
  const d = document.createElement('div'); d.className = 'pop ' + cls; d.textContent = txt; const box = $('pops'); box.appendChild(d);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => d.remove(), 1500);
};
const el = { spd: $('spd'), gear: $('gear'), rpm: $('rpmFill'), nit: $('nitFill'), hp: $('hpFill'), score: $('score'), combo: $('combo'), dist: $('distT'), bust: $('bustFill'), esc: $('escFill'), heat: $('heatN'), cop: $('copN'), tk: $('tkN'), siren: $('sirenfx'), flash: $('flashfx'), fx: $('speedfx') };
setInterval(() => {
  if (game.state !== 'play' && game.state !== 'paused') return;
  const p = game.p;
  el.spd.textContent = Math.round(p.v * 3.6); el.gear.textContent = p.gear; el.rpm.style.width = p.rpm * 100 + '%';
  el.nit.style.width = p.nitro * 100 + '%'; el.hp.style.width = p.health + '%';
  el.score.textContent = Math.round(p.score).toLocaleString(); el.combo.textContent = p.combo > 1 ? 'COMBO x' + p.combo : '';
  el.dist.textContent = (p.dist / 1000).toFixed(2) + ' km';
  if (game.mode === 'pursuit') {
    el.bust.style.width = p.bust * 100 + '%'; el.esc.style.width = p.esc * 100 + '%'; el.heat.textContent = 'HEAT ' + p.heat;
    el.cop.textContent = '🚔 ' + game.cops.filter((c) => !c.dead).length; el.tk.textContent = p.takedowns ? '💥 ' + p.takedowns : '';
    const f = Math.floor(performance.now() / 160) % 2, a = game.sirenAmt || 0;
    el.siren.style.opacity = a * 0.55; el.siren.style.background = f ? 'radial-gradient(ellipse at 0% 50%,rgba(255,30,50,.8),transparent 55%)' : 'radial-gradient(ellipse at 100% 50%,rgba(40,90,255,.8),transparent 55%)';
  } else el.siren.style.opacity = 0;
  el.flash.style.opacity = p.flash;
  el.fx.style.opacity = 0.35 + clamp((p.v - 40) / 70, 0, 1) * 0.6;
}, 70);

/* ---------- touch buttons ---------- */
[['tL', 'tL'], ['tR', 'tR'], ['tB', 'tB'], ['tN', 'tN']].forEach(([id, key]) => {
  const b = $(id);
  const on = (e) => { e.preventDefault(); game.input[key] = 1; b.classList.add('on'); sound.init(); };
  const off = (e) => { e.preventDefault(); game.input[key] = 0; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
$('tC').addEventListener('pointerdown', (e) => { e.preventDefault(); game.nextView(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && (game.state === 'play' || game.state === 'open')) pause(); });
document.addEventListener('contextmenu', (e) => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });

go('title'); demo();
