import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CarVisual, randomTrafficDef, randomTrafficColor } from './cars.js';
import { attachCarModel } from './models.js';
import { clamp, lerp, smooth } from './util.js';

/* ===================================================================
 * OPEN WORLD — endless procedural map you can drive anywhere on.
 *  - hills, lakes and forests (value-noise terrain, streamed in chunks)
 *  - a grid of highways (curvy between towns, straight through them)
 *  - a town with buildings at every crossroads
 *  - roaming traffic, day/night cycle, minimap, checkpoint races (E)
 * Coordinates: forward = (sin yaw, cos yaw), same as the road mode.
 * =================================================================== */
const S = 1000;            // spacing between highways
const C = 160, N = 32;     // chunk size (m) and cells per chunk side
const CELL = C / N;
const RAD = 4;             // chunks loaded in each direction
const HALF = 7.4;          // road half width

/* ---------- noise ---------- */
function h2(a, b) { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); }
function vn(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(h2(ix, iz), h2(ix + 1, iz), u), lerp(h2(ix, iz + 1), h2(ix + 1, iz + 1), u), v);
}
function fbm(x, z, o) { let a = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { t += a * vn(x * f, z * f); f *= 2.03; a *= 0.5; } return t / (1 - Math.pow(0.5, o)); }

/* ---------- world shape ---------- */
const base = (x, z) => Math.max(5, 16 + 32 * (fbm(x / 800, z / 800, 3) - 0.5) * 2);
function wob(i, c) { return 120 * Math.sin(c / 260 + i * 1.7) + 70 * Math.sin(c / 97 + i * 3.1); }
const nearCross = (c) => Math.abs(c - Math.round(c / S) * S);
const fade = (c) => smooth((nearCross(c) - 180) / 240);
const roadX = (i, z) => i * S + wob(i, z) * fade(z);          // vertical roads (run along z)
const roadZ = (j, x) => j * S + wob(j + 40, x) * fade(x);     // horizontal roads (run along x)
const roadYv = (i, z) => base(roadX(i, z), z);
const roadYh = (j, x) => base(x, roadZ(j, x));

function detail(x, z) {
  let t = base(x, z) + 22 * (fbm(x / 210 + 50, z / 210 - 30, 3) - 0.5) * 2;
  const m = Math.max(0, fbm(x / 2600 + 9, z / 2600 + 4, 2) - 0.62) * 420;   // far-away mountain ranges
  return t + m;
}
export function terrainH(x, z) {
  let t = detail(x, z);
  // towns: flat plateau at every crossing
  const ci = Math.round(x / S), cj = Math.round(z / S), cx = ci * S, cz = cj * S;
  const dT = Math.hypot(x - cx, z - cz);
  if (dT < 270) t = lerp(base(cx, cz), t, smooth((dT - 140) / 130));
  const iv = Math.round(x / S), xr = roadX(iv, z), dV = Math.abs(x - xr);
  if (dV < 70) t = lerp(roadYv(iv, z), t, smooth((dV - 9.5) / 55));
  const jh = Math.round(z / S), zr = roadZ(jh, x), dH = Math.abs(z - zr);
  if (dH < 70) t = lerp(roadYh(jh, x), t, smooth((dH - 9.5) / 55));
  return t;
}
function roadDist(x, z) {
  const iv = Math.round(x / S), jh = Math.round(z / S);
  return Math.min(Math.abs(x - roadX(iv, z)), Math.abs(z - roadZ(jh, x)));
}

/* road point/heading helpers: axis 'v' travels along +z, 'h' along +x */
function roadPoint(axis, idx, c, off, dir, out) {
  out = out || {};
  if (axis === 'v') {
    const x = roadX(idx, c), dx = (roadX(idx, c + 2) - roadX(idx, c - 2)) / 4;
    out.x = x - (dir || 1) * (off || 0); out.z = c; out.yaw = Math.atan2(dx, 1) + (dir < 0 ? Math.PI : 0);
  } else {
    const z = roadZ(idx, c), dz = (roadZ(idx, c + 2) - roadZ(idx, c - 2)) / 4;
    out.x = c; out.z = z + (dir || 1) * (off || 0); out.yaw = Math.atan2(1, dz) + (dir < 0 ? Math.PI : 0);
  }
  return out;
}

/* ---------- textures ---------- */
function roadTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#3a3c40'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const v = 50 + Math.random() * 30; g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  g.fillStyle = '#e9e9ea'; g.fillRect(6, 0, 5, 256); g.fillRect(245, 0, 5, 256);
  g.fillStyle = '#f2c230'; g.fillRect(122, 0, 4, 256); g.fillRect(130, 0, 4, 256);
  g.fillStyle = '#dcdcdc'; g.fillRect(62, 0, 4, 90); g.fillRect(190, 0, 4, 90);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function windowTextures() {
  const mk = (lit) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = lit ? '#000' : '#9aa1a8'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const on = Math.random() < 0.45; if (lit) { if (!on) continue; g.fillStyle = '#ffd98a'; } else g.fillStyle = on ? '#3d5f80' : '#2b3e55';
      g.fillRect(x * 16 + 3, y * 16 + 4, 10, 9);
    }
    g.fillStyle = lit ? '#000' : '#9aa1a8'; g.fillRect(0, 0, 6, 6);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  return { map: mk(false), emi: mk(true) };
}

/* ---------- town layout (deterministic per crossing) ---------- */
const townCache = new Map();
function townOf(i, j) {
  const key = i + ',' + j; if (townCache.has(key)) return townCache.get(key);
  const cx = i * S, cz = j * S, list = [];
  for (let gx = -4; gx <= 4; gx++) for (let gz = -4; gz <= 4; gz++) {
    if (gx === 0 || gz === 0) continue;
    const r = h2(i * 13 + gx * 3.1, j * 7 + gz * 5.7); if (r < 0.22) continue;
    const dist = Math.hypot(gx, gz) / 5.7, hw = 6.5 + h2(gx + i, gz + j) * 4.5, hd = 6.5 + h2(gz - j, gx + i * 2) * 4.5;
    const h = 8 + Math.pow(h2(gx * 2 + i, gz * 3 + j), 2) * 75 * (1 - dist * 0.8);
    list.push({ x: cx + gx * 32 + (gx > 0 ? 6 : -6), z: cz + gz * 32 + (gz > 0 ? 6 : -6), hw, hd, h, y: base(cx, cz), tint: 0.75 + h2(gx, gz) * 0.35 });
  }
  townCache.set(key, list); return list;
}

/* ===================================================================== */
export class OpenWorld {
  constructor(game) {
    this.game = game; this.renderer = game.renderer;
    this.scene = new THREE.Scene(); this.scene.environment = game.env;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.3, 2400);
    this.chunks = new Map(); this.queue = [];
    this.roadMat = new THREE.MeshStandardMaterial({ map: roadTexture(), roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.terrMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    const w = windowTextures();
    this.bldMat = new THREE.MeshStandardMaterial({ map: w.map, vertexColors: true, roughness: 0.7, metalness: 0.1, emissive: 0xffffff, emissiveMap: w.emi, emissiveIntensity: 0 });
    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d26, roughness: 1 });
    this.leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true });
    this.trunkGeo = new THREE.CylinderGeometry(0.28, 0.4, 3, 6).translate(0, 1.5, 0);
    this.leafGeo = mergeGeometries([new THREE.ConeGeometry(2.4, 5, 7).translate(0, 5, 0), new THREE.ConeGeometry(1.8, 4, 7).translate(0, 7.4, 0)]);
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2b6f95, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.88 }));
    this.water.frustumCulled = false; this.scene.add(this.water);
    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x445533, 0.8); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.2); this.scene.add(this.sun, this.sun.target);
    this.head = new THREE.SpotLight(0xfff2cc, 0, 120, 0.5, 0.6, 1.2); this.scene.add(this.head, this.head.target);
    // sky dome
    const sg = new THREE.SphereGeometry(2200, 24, 12); sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sg.attributes.position.count * 3), 3));
    this.sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); this.sky.frustumCulled = false; this.scene.add(this.sky);
    this.sunDisk = new THREE.Mesh(new THREE.CircleGeometry(90, 24), new THREE.MeshBasicMaterial({ color: 0xfff1c0, fog: false, depthWrite: false, transparent: true })); this.scene.add(this.sunDisk);
    this.scene.fog = new THREE.Fog(0xaec8e6, 250, 950);
    this.tod = 0.32; this.todSpeed = 1 / 540; this.skyT = 99;
    this.markers = [0, 1].map((k) => { const g = new THREE.Group(); const beam = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 90, 20, 1, true).translate(0, 45, 0), new THREE.MeshBasicMaterial({ color: k ? 0xffd75e : 0x66ffb0, transparent: true, opacity: k ? 0.18 : 0.38, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); const ring = new THREE.Mesh(new THREE.TorusGeometry(HALF + 2, 0.5, 8, 28).rotateX(Math.PI / 2).translate(0, 0.6, 0), beam.material); g.add(beam, ring); g.visible = false; this.scene.add(g); return g; });
    this.traffic = []; this.car = null; this.p = null; this.race = null;
    this.mini = null; this.hudEl = null; this.camYaw = 0; this.camPos = new THREE.Vector3(); this.miniT = 0; this.shake = 0;
    window.addEventListener('keydown', (e) => {
      if (this.game.state !== 'open' || e.repeat) return;
      if (e.code === 'KeyE') this.race ? this.endRace('RACE CANCELLED') : this.startRace();
      if (e.code === 'KeyR') this.respawn(true);
      if (e.code === 'KeyT') { this.tod = (this.tod + 0.2) % 1; this.skyT = 99; }
    });
  }

  /* ---------------- start ---------------- */
  start(def, up, st, paint, glow) {
    this.def = def; this.st = st;
    if (this.car) { this.scene.remove(this.car.group); this.car.disposed = true; }
    this.car = new CarVisual(def, { paint }); this.scene.add(this.car.group); attachCarModel(this.car, def);
    if (glow) this.car.setUnderglow(glow, 0.8);
    this.traffic.forEach((t) => this.scene.remove(t.vis.group)); this.traffic = [];
    this.chunks.forEach((c) => this.dropChunk(c)); this.chunks.clear();
    // spawn on the highway nearest the origin, heading along it
    const pt = roadPoint('v', 0, 40, 3.6, 1, {});
    this.p = { x: pt.x, z: pt.z, y: terrainH(pt.x, pt.z), vy: 0, yaw: pt.yaw, vx: 0, vz: 0, v: 0, steer: 0, pitch: 0, roll: 0, nitro: 1, health: 100, air: false, water: 0, dist: 0, top: 0, skid: 0, nitroOn: false, rpm: 0.2, gear: 1, lastX: pt.x, lastZ: pt.z };
    this.race = null; this.markers.forEach((m) => { m.visible = false; });
    this.ensureChunks(true); this.spawnTraffic(true);
    this.camYaw = this.p.yaw; this.updateCar(0); this.camSnap = true;
    this.buildHud(); this.resize();
  }
  resize() { const w = window.innerWidth, h = window.innerHeight; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

  /* ---------------- HUD (own DOM so the road-mode HUD is untouched) ---------------- */
  buildHud() {
    if (this.hudEl) { this.hudEl.style.display = 'block'; return; }
    const d = this.hudEl = document.createElement('div'); d.id = 'owhud';
    d.innerHTML = `<style>
      #owhud{position:fixed;inset:0;pointer-events:none;z-index:11;font-family:inherit;color:#fff;font-weight:800;text-shadow:0 2px 6px rgba(0,0,0,.75)}
      #owhud .spd{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);text-align:center}
      #owhud .spd b{font-size:64px;font-style:italic;line-height:1}#owhud .spd i{display:block;font-size:12px;letter-spacing:3px;color:#7fe3ff;font-style:normal}
      #owhud .bar{position:absolute;bottom:18px;width:min(240px,32vw);height:9px;background:rgba(0,0,0,.5);border-radius:5px;overflow:hidden}
      #owhud .bar i{display:block;height:100%}#owhud .bar span{position:absolute;top:-17px;font-size:11px;letter-spacing:2px}
      #owDmg{left:18px}#owNit{right:18px}
      #owhud canvas{position:absolute;left:14px;top:64px;width:150px;height:150px;border-radius:50%;border:3px solid rgba(255,255,255,.65);background:rgba(10,14,20,.55)}
      #owhud .info{position:absolute;left:176px;top:72px;font-size:14px;line-height:1.5}
      #owhud .race{position:absolute;left:50%;top:70px;transform:translateX(-50%);text-align:center;font-size:20px}
      #owhud .tip{position:absolute;left:50%;top:16px;transform:translateX(-50%);font-size:12px;opacity:.85;text-align:center;white-space:nowrap}
      #owhud .msg{position:absolute;left:50%;top:34%;transform:translateX(-50%);font-size:34px;font-style:italic;opacity:0;transition:opacity .3s;text-align:center}
    </style>
    <div class="tip">OPEN WORLD · E start/stop checkpoint race · R respawn on road · T change time of day · C camera</div>
    <canvas width="300" height="300"></canvas><div class="info" id="owInfo"></div><div class="race" id="owRace"></div><div class="msg" id="owMsg"></div>
    <div class="spd"><b id="owSpd">0</b><i>KM/H</i></div>
    <div class="bar" id="owDmg"><span>DAMAGE</span><i style="background:linear-gradient(90deg,#ff4d4d,#ffd24d,#6dff8a)"></i></div>
    <div class="bar" id="owNit"><span>NITRO</span><i style="background:#18c8ff"></i></div>`;
    document.body.appendChild(d); this.mini = d.querySelector('canvas').getContext('2d');
    this.el = { spd: d.querySelector('#owSpd'), info: d.querySelector('#owInfo'), race: d.querySelector('#owRace'), msg: d.querySelector('#owMsg'), dmg: d.querySelector('#owDmg i'), nit: d.querySelector('#owNit i') };
  }
  hideHud() { if (this.hudEl) this.hudEl.style.display = 'none'; this.markers.forEach((m) => { m.visible = false; }); }
  flash(txt, ms) { const m = this.el.msg; m.textContent = txt; m.style.opacity = 1; clearTimeout(this._mt); this._mt = setTimeout(() => { m.style.opacity = 0; }, ms || 1600); }

  /* ---------------- chunks ---------------- */
  ensureChunks(all) {
    const cx = Math.floor(this.p.x / C), cz = Math.floor(this.p.z / C), want = new Set(), add = [];
    for (let dx = -RAD; dx <= RAD; dx++) for (let dz = -RAD; dz <= RAD; dz++) {
      if (dx * dx + dz * dz > (RAD + 0.5) * (RAD + 0.5)) continue;
      const k = (cx + dx) + ',' + (cz + dz); want.add(k); if (!this.chunks.has(k)) add.push([cx + dx, cz + dz, dx * dx + dz * dz]);
    }
    this.chunks.forEach((c, k) => { if (!want.has(k)) { this.dropChunk(c); this.chunks.delete(k); } });
    add.sort((a, b) => a[2] - b[2]);
    let n = all ? add.length : 2;
    for (const [x, z] of add) { if (n-- <= 0) break; this.chunks.set(x + ',' + z, this.makeChunk(x, z)); }
  }
  dropChunk(c) { this.scene.remove(c.group); c.group.traverse((o) => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); }); }

  makeChunk(cx, cz) {
    const x0 = cx * C, z0 = cz * C, group = new THREE.Group(), V = N + 1;
    const pos = new Float32Array(V * V * 3), col = new Float32Array(V * V * 3), nor = new Float32Array(V * V * 3), idx = [];
    const c = new THREE.Color(), grass = new THREE.Color(), rock = new THREE.Color(0x6f6a62), sand = new THREE.Color(0xd8c690), snow = new THREE.Color(0xf2f5f7), dirt = new THREE.Color(0x7d7160);
    for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) {
      const x = x0 + i * CELL, z = z0 + j * CELL, h = terrainH(x, z), k = (i * V + j) * 3;
      pos[k] = x - x0; pos[k + 1] = h; pos[k + 2] = z - z0;
      const hx = terrainH(x + 2, z) - terrainH(x - 2, z), hz = terrainH(x, z + 2) - terrainH(x, z - 2), nl = Math.hypot(hx, 4, hz);
      nor[k] = -hx / nl; nor[k + 1] = 4 / nl; nor[k + 2] = -hz / nl;
      const slope = Math.hypot(hx, hz) / 4, nz = vn(x / 18, z / 18);
      grass.setHSL(0.27 + nz * 0.05, 0.42 + nz * 0.1, 0.27 + nz * 0.1);
      c.copy(grass);
      if (h < 3.2) c.lerp(sand, clamp((3.2 - h) / 2.5, 0, 1));
      c.lerp(rock, clamp((slope - 0.45) * 2.2, 0, 1));
      if (h > 62) c.lerp(snow, clamp((h - 62) / 20, 0, 1));
      const rd = roadDist(x, z); if (rd < 14) c.lerp(dirt, clamp((14 - rd) / 5, 0, 1) * (rd > HALF ? 1 : 0.3));
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const a = i * V + j, b = a + 1, d = a + V, e = d + 1; idx.push(a, b, d, b, e, d); }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); tg.setIndex(idx);
    const terr = new THREE.Mesh(tg, this.terrMat); terr.position.set(x0, 0, z0); terr.matrixAutoUpdate = false; terr.updateMatrix(); group.add(terr);

    // roads crossing this chunk
    const rp = [], ru = [], ri = []; let vc = 0;
    const strip = (axis, id) => {
      const a0 = axis === 'v' ? z0 - 12 : x0 - 12, a1 = axis === 'v' ? z0 + C + 12 : x0 + C + 12, first = vc;
      for (let a = a0; a <= a1 + 0.01; a += 8) {
        const p = roadPoint(axis, id, a, 0, 1, {}); const y = (axis === 'v' ? roadYv(id, a) : roadYh(id, a)) + (axis === 'v' ? 0.07 : 0.09);
        const px = Math.cos(p.yaw), pz = -Math.sin(p.yaw); // perpendicular to the heading in the xz plane
        rp.push(p.x - px * HALF, y, p.z - pz * HALF, p.x + px * HALF, y, p.z + pz * HALF); ru.push(0, a / 12, 1, a / 12);
        if (vc > first) { const q = vc * 2; ri.push(q - 2, q, q - 1, q - 1, q, q + 1); } vc++;
      }
    };
    const ia = Math.round((x0 + C / 2) / S), ja = Math.round((z0 + C / 2) / S);
    for (let i = ia - 1; i <= ia + 1; i++) { const lo = roadX(i, z0), hi = roadX(i, z0 + C); if (Math.max(lo, hi) > x0 - 30 && Math.min(lo, hi) < x0 + C + 30) strip('v', i); }
    for (let j = ja - 1; j <= ja + 1; j++) { const lo = roadZ(j, x0), hi = roadZ(j, x0 + C); if (Math.max(lo, hi) > z0 - 30 && Math.min(lo, hi) < z0 + C + 30) strip('h', j); }
    // plain asphalt patch at crossings
    for (let i = ia - 1; i <= ia + 1; i++) for (let j = ja - 1; j <= ja + 1; j++) {
      const X = i * S, Z = j * S; if (X < x0 - 12 || X > x0 + C + 12 || Z < z0 - 12 || Z > z0 + C + 12) continue;
      const y = base(X, Z) + 0.12, q = rp.length / 3, r = HALF + 0.4;
      rp.push(X - r, y, Z - r, X + r, y, Z - r, X - r, y, Z + r, X + r, y, Z + r); for (let k = 0; k < 4; k++) ru.push(0.4, 0.2);
      ri.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
    }
    if (rp.length) {
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ru, 2)); rg.setIndex(ri); rg.computeVertexNormals();
      const nA = rg.attributes.normal; for (let k = 0; k < nA.count; k++) { nA.setXYZ(k, 0, 1, 0); }
      group.add(new THREE.Mesh(rg, this.roadMat));
    }

    // buildings (assigned to the chunk that contains them)
    const boxes = [], geos = [];
    for (let i = ia - 1; i <= ia + 1; i++) for (let j = ja - 1; j <= ja + 1; j++) {
      for (const b of townOf(i, j)) {
        if (b.x < x0 || b.x >= x0 + C || b.z < z0 || b.z >= z0 + C) continue;
        boxes.push(b);
        const g = new THREE.BoxGeometry(b.hw * 2, b.h, b.hd * 2); g.translate(b.x, b.y + b.h / 2 - 0.3, b.z);
        const uv = g.attributes.uv, cl = new Float32Array(uv.count * 3);
        for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
          const q = f * 4 + k, u = uv.getX(q), v = uv.getY(q);
          if (f === 2 || f === 3) uv.setXY(q, 0.01, 0.01);
          else uv.setXY(q, u * ((f < 2 ? b.hd : b.hw) * 2) / 7, v * b.h / 7);
          const roof = f === 2 ? 0.8 : 1; cl[q * 3] = b.tint * roof; cl[q * 3 + 1] = b.tint * roof; cl[q * 3 + 2] = b.tint * roof * 1.02;
        }
        g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); geos.push(g);
      }
    }
    if (geos.length) { const bg = mergeGeometries(geos); geos.forEach((g) => g.dispose()); group.add(new THREE.Mesh(bg, this.bldMat)); }

    // trees
    const trees = [], dens = fbm(x0 / 500 + 5, z0 / 500 + 8, 2) * 1.6;
    for (let k = 0; k < 70; k++) {
      if (h2(cx * 9.3 + k, cz * 4.1 + k * 1.7) > dens * 0.9) continue;
      const x = x0 + h2(cx + k * 3.3, cz - k) * C, z = z0 + h2(cz + k * 1.9, cx + k * 2.7) * C, h = terrainH(x, z);
      if (h < 3.5 || h > 58 || roadDist(x, z) < 15 || Math.hypot(x - Math.round(x / S) * S, z - Math.round(z / S) * S) < 190) continue;
      trees.push({ x, z, y: h, s: 0.8 + h2(k, cx * 7 + cz) * 1.0 });
    }
    if (trees.length) {
      const tm = new THREE.InstancedMesh(this.trunkGeo, this.trunkMat, trees.length), lm = new THREE.InstancedMesh(this.leafGeo, this.leafMat, trees.length), m4 = new THREE.Matrix4(), cc = new THREE.Color();
      trees.forEach((t, i) => { m4.makeScale(t.s, t.s, t.s).setPosition(t.x, t.y - 0.2, t.z); tm.setMatrixAt(i, m4); lm.setMatrixAt(i, m4); cc.setHSL(0.28 + (i % 5) * 0.015, 0.5, 0.2 + (i % 4) * 0.03); lm.setColorAt(i, cc); });
      tm.userData.shared = lm.userData.shared = true; group.add(tm, lm);
    }
    this.scene.add(group);
    return { group, boxes, trees };
  }

  /* ---------------- sky / time of day ---------------- */
  updateSky(dt) {
    this.tod = (this.tod + dt * this.todSpeed) % 1;
    const a = this.tod * Math.PI * 2 - Math.PI / 2, e = Math.sin(a), dayK = smooth((e + 0.12) / 0.4), duskK = 1 - Math.abs(clamp(e / 0.35, -1, 1));
    const sunDir = new THREE.Vector3(Math.cos(a) * 0.85, e, 0.5).normalize();
    this.sun.position.copy(this.car.group.position).addScaledVector(sunDir, 300); this.sun.target.position.copy(this.car.group.position);
    this.sun.intensity = 1.6 * smooth((e + 0.05) / 0.3); this.sun.color.setHSL(0.1 - duskK * 0.07, 0.4 + duskK * 0.5, 0.82 - duskK * 0.15);
    this.hemi.intensity = 0.18 + 0.75 * dayK;
    const night = new THREE.Color(0x070b18), nHor = new THREE.Color(0x15203a), dayTop = new THREE.Color(0x4f8fe0), dayHor = new THREE.Color(0xcfe3f5), duskHor = new THREE.Color(0xff8a4a);
    const top = night.clone().lerp(dayTop, dayK).lerp(new THREE.Color(0x3a4f86), duskK * 0.6 * (1 - dayK * 0.3));
    const hor = nHor.clone().lerp(dayHor, dayK).lerp(duskHor, duskK * 0.85);
    this.scene.fog.color.copy(hor); this.scene.background = hor;
    this.skyT += dt;
    if (this.skyT > 0.4) {
      this.skyT = 0; const p = this.sky.geometry.attributes.position, cl = this.sky.geometry.attributes.color, t = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const k = clamp(p.getY(i) / 2200, 0, 1); t.copy(hor).lerp(top, Math.pow(k, 0.55)); if (p.getY(i) < 0) t.copy(hor); cl.setXYZ(i, t.r, t.g, t.b); }
      cl.needsUpdate = true;
    }
    this.sky.position.copy(this.camera.position);
    this.sunDisk.position.copy(this.camera.position).addScaledVector(sunDir, 2000); this.sunDisk.lookAt(this.camera.position); this.sunDisk.visible = e > -0.12;
    this.sunDisk.material.color.setHSL(0.12 - duskK * 0.08, 0.9, 0.8);
    this.bldMat.emissiveIntensity = clamp(1 - dayK * 1.4, 0, 1);
    this.nightK = clamp(1 - dayK * 1.6, 0, 1);
    this.head.intensity = this.nightK * 3.5;
    this.scene.fog.near = 200 + dayK * 80; this.scene.fog.far = 700 + dayK * 400;
  }

  /* ---------------- traffic ---------------- */
  spawnTraffic(all) {
    const want = 18;
    while (this.traffic.length < want) this.traffic.push(this.newCar());
    this.traffic.forEach((t) => this.placeCar(t, all));
  }
  newCar() {
    const def = randomTrafficDef(), vis = new CarVisual(def, { paint: randomTrafficColor(), detail: false }); this.scene.add(vis.group);
    return { vis, def, axis: 'v', idx: 0, c: 0, dir: 1, lane: 2, speed: 18, x: 0, z: 0, yaw: 0, y: 0, hit: 0, far: true };
  }
  placeCar(t, near) {
    const p = this.p, ax = Math.random() < 0.5 ? 'v' : 'h', along = ax === 'v' ? p.z : p.x, across = ax === 'v' ? p.x : p.z;
    t.axis = ax; t.idx = Math.round(across / S) + (Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0);
    const sgn = Math.random() < 0.5 ? -1 : 1; t.c = along + sgn * (near ? 40 + Math.random() * 420 : 320 + Math.random() * 180);
    t.dir = Math.random() < 0.5 ? 1 : -1; t.lane = 1.9 + Math.floor(Math.random() * 2) * 3.6; t.speed = 13 + Math.random() * 18; t.hit = 0;
    this.moveCar(t, 0);
  }
  moveCar(t, dt) {
    t.c += t.dir * t.speed * dt; const q = roadPoint(t.axis, t.idx, t.c, t.lane, t.dir, {});
    t.x = q.x; t.z = q.z; t.yaw = q.yaw; t.y = terrainH(t.x, t.z);
    t.vis.group.position.set(t.x, t.y, t.z); t.vis.group.rotation.y = t.yaw;
    const q2 = roadPoint(t.axis, t.idx, t.c + t.dir * 6, t.lane, t.dir, {}); const y2 = terrainH(q2.x, q2.z); t.vis.group.rotation.x = -Math.atan2(y2 - t.y, 6); t.vis.update(dt, t.speed, 0);
  }

  /* ---------------- player ---------------- */
  respawn(manual) {
    const p = this.p, iv = Math.round(p.x / S), jh = Math.round(p.z / S), dV = Math.abs(p.x - roadX(iv, p.z)), dH = Math.abs(p.z - roadZ(jh, p.x));
    const axis = dV < dH ? 'v' : 'h', idx = axis === 'v' ? iv : jh, c = axis === 'v' ? p.z : p.x;
    const fwd = Math.sin(p.yaw) * (axis === 'h' ? 1 : 0) + Math.cos(p.yaw) * (axis === 'v' ? 1 : 0), dir = fwd >= 0 ? 1 : -1;
    const q = roadPoint(axis, idx, c, 3.6, dir, {}); Object.assign(p, { x: q.x, z: q.z, yaw: q.yaw, y: terrainH(q.x, q.z), vy: 0, vx: 0, vz: 0, v: 0, water: 0, air: false }); p.health = Math.max(p.health, manual ? p.health : 100);
    this.camSnap = true; if (!manual) p.health = 100; this.flash(manual ? 'BACK ON THE ROAD' : 'WRECKED — REPAIRED', 1400);
  }

  step(dt) {
    const p = this.p, st = this.st, inp = this.game.input, surf = this.surface(p.x, p.z);
    const touch = document.body.classList.contains('dev-touch');
    let gasK = inp.gas || inp.tG || 0; const brakeK = inp.brake || inp.tB, L = inp.L || inp.tL, R = inp.R || inp.tR, pad = this.game.tilt;
    let steerIn = (L ? 1 : 0) - (R ? 1 : 0); if (pad !== null && pad !== undefined && Math.abs(pad) > 0.02) steerIn = -pad;
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null; let gpGas = 0, gpBrake = 0, gpN = 0;
    if (gp) { const ax = gp.axes[0] || 0; if (Math.abs(ax) > 0.12) steerIn = -ax; gpGas = (gp.buttons[7] && gp.buttons[7].value > 0.1) || gp.buttons[0].pressed; gpBrake = (gp.buttons[6] && gp.buttons[6].value > 0.1) || gp.buttons[1].pressed; gpN = gp.buttons[2] && gp.buttons[2].pressed; }
    const brake = brakeK || gpBrake, gas = gasK || gpGas || (touch && this.game.settings.autoGas && !brake ? 1 : 0);
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = -fz, rz = fx;
    let vf = p.vx * fx + p.vz * fz, vl = p.vx * rx + p.vz * rz;
    const nitro = inp.nitro || inp.tN || gpN, useN = nitro && p.nitro > 0.02 && vf > 5; p.nitroOn = !!useN;
    if (useN) p.nitro = Math.max(0, p.nitro - dt * 0.28); else p.nitro = Math.min(1, p.nitro + dt * 0.06);
    const vmax = st.top * (useN ? 1.22 : 1) * (surf === 'grass' ? 0.62 : surf === 'water' ? 0.25 : 1);
    if (gas) vf += st.acc * (useN ? 1.8 : 1) * Math.max(0, 1 - Math.pow(Math.max(vf, 0) / vmax, 2.2)) * dt;
    if (brake) { if (vf > 0.6) vf = Math.max(0, vf - st.brk * dt); else vf = Math.max(-14, vf - st.acc * 0.5 * dt); }
    vf -= vf * (0.012 + (surf === 'grass' ? 0.35 : surf === 'water' ? 1.2 : 0) + (gas ? 0 : 0.05)) * dt * (1 + Math.abs(vf) / 40);
    if (vf > vmax) vf -= (vf - vmax) * Math.min(1, dt * 1.5);
    // steering
    const maxS = lerp(0.58, 0.1, clamp(Math.abs(vf) / 80, 0, 1)) * (0.8 + st.hnd * 0.25);
    p.steer += (steerIn * maxS - p.steer) * Math.min(1, dt * 9);
    let yawRate = vf * Math.tan(p.steer) / (this.def.sh.wb || 2.8), lim = (surf === 'road' ? 15 : 9) * st.hnd / Math.max(8, Math.abs(vf));
    yawRate = clamp(yawRate, -lim * 1.1, lim * 1.1); p.yaw += yawRate * dt;
    // grip: sideways velocity bleeds off (handbrake = drift)
    const grip = (surf === 'road' ? 8 : surf === 'grass' ? 3.2 : 1.2) * (brake && Math.abs(vf) > 12 ? 0.22 : 1);
    vl *= Math.exp(-grip * dt); p.skid = clamp(Math.abs(vl) / 6, 0, 1) * (p.air ? 0 : 1);
    const nfx = Math.sin(p.yaw), nfz = Math.cos(p.yaw), nrx = -nfz, nrz = nfx;
    p.vx = nfx * vf + nrx * vl; p.vz = nfz * vf + nrz * vl;
    p.x += p.vx * dt; p.z += p.vz * dt;
    p.v = vf; p.top = Math.max(p.top, Math.abs(vf)); p.dist += Math.hypot(p.vx, p.vz) * dt;
    // vertical
    const g = terrainH(p.x, p.z), prevG = p.gy === undefined ? g : p.gy; p.gy = g;
    p.vy -= 24 * dt; p.y += p.vy * dt;
    if (p.y <= g) { if (p.air && p.vy < -9) { p.shake = Math.min(1, -p.vy / 18); p.health -= Math.max(0, (-p.vy - 12)) * 1.2; this.game.sound.burst('scrape'); } p.y = g; p.vy = clamp((g - prevG) / Math.max(dt, 0.001), 0, 14); p.air = false; } else if (p.y > g + 0.35) p.air = true;
    // water
    if (g < 0.1) { p.water += dt; if (p.water > 2.5) this.respawn(false); } else p.water = Math.max(0, p.water - dt * 2);
    // obstacles
    this.collide(p);
    if (p.health <= 0) this.respawn(false);
    p.rpm = clamp(0.2 + Math.abs(vf) / Math.max(vmax, 1) * 0.7 + (gas ? 0.1 : 0), 0.15, 1); p.gear = clamp(1 + Math.floor(Math.abs(vf) / (st.top / 6)), 1, 6);
    p.shake = Math.max(0, (p.shake || 0) - dt * 2);
  }
  surface(x, z) { if (terrainH(x, z) < 0.15) return 'water'; return roadDist(x, z) < HALF + 1.2 ? 'road' : 'grass'; }

  hurt(imp, dx, dz) {
    const p = this.p; if (imp < 1.5) return;
    p.health -= imp * 0.45; p.shake = Math.max(p.shake || 0, clamp(imp / 10, 0.2, 1)); this.game.sound.burst(imp > 8 ? 'crash' : 'scrape');
    const sp = Math.hypot(p.vx, p.vz), k = 0.55; p.vx = p.vx * k + dx * 3; p.vz = p.vz * k + dz * 3;
    void sp;
  }
  collide(p) {
    const r = this.def.sh.W * 0.5 + 0.15, cx = Math.floor(p.x / C), cz = Math.floor(p.z / C);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const ch = this.chunks.get((cx + a) + ',' + (cz + b)); if (!ch) continue;
      for (const bx of ch.boxes) {
        if (p.y > bx.y + bx.h) continue;
        const nx = clamp(p.x, bx.x - bx.hw, bx.x + bx.hw), nz = clamp(p.z, bx.z - bx.hd, bx.z + bx.hd), dx = p.x - nx, dz = p.z - nz, d = Math.hypot(dx, dz);
        if (d < r + 0.6) {
          let ux = dx, uz = dz;
          if (d < 0.001) { ux = p.x - bx.x; uz = p.z - bx.z; }
          const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l;
          const into = -(p.vx * ux + p.vz * uz); p.x += ux * (r + 0.6 - d + 0.02); p.z += uz * (r + 0.6 - d + 0.02);
          if (into > 0) { p.vx += ux * into * 1.3; p.vz += uz * into * 1.3; this.hurt(into, ux, uz); }
        }
      }
      for (const t of ch.trees) {
        if (Math.abs(t.x - p.x) > 4 || Math.abs(t.z - p.z) > 4 || p.y > t.y + 3) continue;
        const dx = p.x - t.x, dz = p.z - t.z, d = Math.hypot(dx, dz), rr = r + 0.45 * t.s;
        if (d < rr && d > 0.001) { const ux = dx / d, uz = dz / d, into = -(p.vx * ux + p.vz * uz); p.x += ux * (rr - d); p.z += uz * (rr - d); if (into > 0) { p.vx += ux * into * 1.2; p.vz += uz * into * 1.2; this.hurt(into * 0.8, ux, uz); } }
      }
    }
    for (const t of this.traffic) {
      const dx = p.x - t.x, dz = p.z - t.z; if (Math.abs(dx) > 5 || Math.abs(dz) > 5) continue;
      const d = Math.hypot(dx, dz), rr = 2.5; if (d < rr && d > 0.001 && Math.abs(p.y - t.y) < 2.5) {
        const ux = dx / d, uz = dz / d, rel = Math.hypot(p.vx - Math.sin(t.yaw) * t.speed, p.vz - Math.cos(t.yaw) * t.speed);
        p.x += ux * (rr - d); p.z += uz * (rr - d); this.hurt(rel * 0.7, ux, uz); t.speed = Math.max(4, t.speed * 0.6); t.hit = 1.2;
        if (rel > 3) this.flash('CRASH', 700);
      }
    }
  }

  /* ---------------- race ---------------- */
  startRace() {
    const p = this.p, iv = Math.round(p.x / S), jh = Math.round(p.z / S), dV = Math.abs(p.x - roadX(iv, p.z)), dH = Math.abs(p.z - roadZ(jh, p.x));
    let axis = dV < dH ? 'v' : 'h', idx = axis === 'v' ? iv : jh, c = axis === 'v' ? p.z : p.x;
    const fwd = axis === 'v' ? Math.cos(p.yaw) : Math.sin(p.yaw); let dir = fwd >= 0 ? 1 : -1; const cps = [];
    for (let n = 0; n < 8; n++) {
      let rem = 380;
      while (rem > 0) {
        const nc = dir > 0 ? (Math.floor(c / S) + 1) * S : (Math.ceil(c / S) - 1) * S, dist = Math.abs(nc - c);
        if (dist <= rem) {
          rem -= dist; c = nc;
          if (Math.random() < 0.6) { const cross = Math.round(c / S), nc2 = idx * S; axis = axis === 'v' ? 'h' : 'v'; idx = cross; c = nc2; dir = Math.random() < 0.5 ? 1 : -1; }
          else c += dir * 0.01;
        } else { c += dir * rem; rem = 0; }
      }
      const q = roadPoint(axis, idx, c, 0, 1, {}); cps.push({ x: q.x, z: q.z, y: terrainH(q.x, q.z) });
    }
    this.race = { cps, i: 0, t: 0, left: 45, done: false };
    this.markers.forEach((m) => { m.visible = true; }); this.placeMarkers(); this.flash('CHECKPOINT RACE — GO!', 1600);
  }
  placeMarkers() { const r = this.race, a = r.cps[r.i], b = r.cps[r.i + 1]; this.markers[0].position.set(a.x, a.y, a.z); this.markers[1].visible = !!b; if (b) this.markers[1].position.set(b.x, b.y, b.z); }
  endRace(msg) { this.race = null; this.markers.forEach((m) => { m.visible = false; }); this.flash(msg, 2200); }
  updateRace(dt) {
    const r = this.race; if (!r) return; const p = this.p; r.t += dt; r.left -= dt;
    const cp = r.cps[r.i];
    if (Math.hypot(p.x - cp.x, p.z - cp.z) < HALF + 6) {
      r.i++; r.left += 13; this.game.sound.burst('near');
      if (r.i >= r.cps.length) { this.endRace(`FINISHED  ${r.t.toFixed(1)} s`); return; }
      this.flash(`CHECKPOINT ${r.i}/${r.cps.length}  +13 s`, 900); this.placeMarkers();
    }
    if (r.left <= 0) this.endRace('TIME UP');
  }

  /* ---------------- visuals ---------------- */
  updateCar(dt) {
    const p = this.p, v = this.car, W = this.def.sh.W, L = this.def.sh.L, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    const hf = terrainH(p.x + sy * L * 0.4, p.z + cy * L * 0.4), hb = terrainH(p.x - sy * L * 0.4, p.z - cy * L * 0.4);
    const hl = terrainH(p.x + cy * W / 2, p.z - sy * W / 2), hr = terrainH(p.x - cy * W / 2, p.z + sy * W / 2);
    const tp = p.air ? clamp(-p.vy * 0.02, -0.25, 0.25) : -Math.atan2(hf - hb, L * 0.8), tr = p.air ? 0 : Math.atan2(hl - hr, W);
    const k = dt ? Math.min(1, dt * 12) : 1; p.pitch += (tp - p.pitch) * k; p.roll += (tr - p.roll) * k;
    const lean = clamp(p.steer * Math.abs(p.v) * 0.004, -0.06, 0.06);
    v.group.position.set(p.x, p.y, p.z); v.group.rotation.set(p.pitch, p.yaw, p.roll - lean, 'YXZ');
    v.update(dt, p.v, p.steer); v.setBrake(this.game.input.brake || this.game.input.tB); v.setNitro(p.nitroOn ? 1 : 0);
  }
  updateCamera(dt) {
    const p = this.p, view = this.game.settings.view, cam = this.camera;
    let dy = p.yaw - this.camYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const vh = Math.hypot(p.vx, p.vz) > 6 ? Math.atan2(p.vx, p.vz) : p.yaw; let dv = vh - p.yaw; dv = Math.atan2(Math.sin(dv), Math.cos(dv));
    const target = p.yaw + dv * 0.25; dy = target - this.camYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.camYaw += dy * (this.camSnap ? 1 : Math.min(1, dt * 4.5));
    const yaw = view >= 2 && view <= 3 ? p.yaw : this.camYaw, sy = Math.sin(yaw), cy = Math.cos(yaw);
    const sh = this.def.sh, ratio = clamp(Math.hypot(p.vx, p.vz) / Math.max(this.st.top, 1), 0, 1.3);
    const D = [[7.6, 3.1, 7], [5.2, 2.0, 5], [0, 0, 0], [0, 0, 0], [13, 9.5, 12], [4.6, 0.9, 6]][view] || [7.6, 3.1, 7];
    let tx, ty, tz, lx, ly, lz;
    if (view === 2) { tx = p.x + sy * 0.3; tz = p.z + cy * 0.3; ty = p.y + sh.roofY - 0.1; lx = tx + sy * 20; lz = tz + cy * 20; ly = ty - 0.2 + Math.sin(p.pitch) * -6; }
    else if (view === 3) { tx = p.x + sy * (sh.L / 2 + 0.2); tz = p.z + cy * (sh.L / 2 + 0.2); ty = p.y + 0.55; lx = tx + sy * 20; lz = tz + cy * 20; ly = ty; }
    else { tx = p.x - sy * D[0]; tz = p.z - cy * D[0]; ty = p.y + D[1]; lx = p.x + sy * D[2]; lz = p.z + cy * D[2]; ly = p.y + 1.1; }
    ty = Math.max(ty, terrainH(tx, tz) + 1.0);
    if (this.camSnap) { this.camPos.set(tx, ty, tz); this.camSnap = false; } else this.camPos.lerp(new THREE.Vector3(tx, ty, tz), Math.min(1, dt * (view === 2 || view === 3 ? 30 : 9)));
    const sk = (p.shake || 0) * 0.25; cam.position.set(this.camPos.x + (Math.random() - 0.5) * sk, this.camPos.y + (Math.random() - 0.5) * sk, this.camPos.z + (Math.random() - 0.5) * sk);
    cam.lookAt(lx, ly, lz); const fov = 60 + ratio * 16 + (p.nitroOn ? 8 : 0); cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix();
    this.head.position.set(p.x + sy * 1.5, p.y + 0.9, p.z + cy * 1.5); this.head.target.position.set(p.x + sy * 40, p.y, p.z + cy * 40);
  }
  drawMini() {
    const g = this.mini, p = this.p, W = 300, M = 150, sc = 150 / 480; if (!g) return;
    g.clearRect(0, 0, W, W); g.save(); g.beginPath(); g.arc(M, M, M, 0, 7); g.clip();
    const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    // world offset -> screen (heading is up, car's right is screen right)
    const to = (x, z) => { const dx = x - p.x, dz = z - p.z; return [(-dx * cy + dz * sy) * sc, -(dx * sy + dz * cy) * sc]; };
    const ia = Math.round(p.x / S), ja = Math.round(p.z / S);
    g.lineWidth = 6; g.strokeStyle = '#9aa3ad'; g.lineJoin = 'round';
    for (let i = ia - 1; i <= ia + 1; i++) { g.beginPath(); for (let z = p.z - 520; z <= p.z + 520; z += 30) { const q = to(roadX(i, z), z); z === p.z - 520 ? g.moveTo(M + q[0], M + q[1]) : g.lineTo(M + q[0], M + q[1]); } g.stroke(); }
    for (let j = ja - 1; j <= ja + 1; j++) { g.beginPath(); for (let x = p.x - 520; x <= p.x + 520; x += 30) { const q = to(x, roadZ(j, x)); x === p.x - 520 ? g.moveTo(M + q[0], M + q[1]) : g.lineTo(M + q[0], M + q[1]); } g.stroke(); }
    g.fillStyle = '#e8b923'; for (let i = ia - 1; i <= ia + 1; i++) for (let j = ja - 1; j <= ja + 1; j++) { const q = to(i * S, j * S); g.beginPath(); g.arc(M + q[0], M + q[1], 9, 0, 7); g.fill(); }
    g.fillStyle = '#ff5050'; this.traffic.forEach((t) => { if (Math.abs(t.x - p.x) < 480 && Math.abs(t.z - p.z) < 480) { const q = to(t.x, t.z); g.fillRect(M + q[0] - 3, M + q[1] - 3, 6, 6); } });
    if (this.race) { const cp = this.race.cps[this.race.i]; let q = to(cp.x, cp.z); const d = Math.hypot(q[0], q[1]), mx = 128; if (d > mx) q = [q[0] / d * mx, q[1] / d * mx]; g.fillStyle = '#66ffb0'; g.beginPath(); g.arc(M + q[0], M + q[1], 11, 0, 7); g.fill(); }
    g.restore(); g.fillStyle = '#18c8ff'; g.beginPath(); g.moveTo(M, M - 16); g.lineTo(M + 11, M + 12); g.lineTo(M - 11, M + 12); g.closePath(); g.fill();
  }

  /* ---------------- frame ---------------- */
  frame(dt, running) {
    const g = this.game, p = this.p; if (!p) return;
    if (running) {
      const n = 2; for (let i = 0; i < n; i++) this.step(dt / n);
      this.ensureChunks(false); this.updateRace(dt);
      this.traffic.forEach((t) => {
        if (t.hit > 0) { t.hit -= dt; t.speed += (14 - t.speed) * dt * 0.5; }
        this.moveCar(t, dt);
        if (Math.hypot(t.x - p.x, t.z - p.z) > 620) this.placeCar(t, false);
      });
      g.sound.update({ rpm: p.rpm, thr: g.input.gas || g.input.tG ? 1 : 0.15, speed: Math.abs(p.v), skid: p.skid, nitro: p.nitroOn ? 1 : 0, siren: 0, rain: false, running: true });
    } else g.sound.update({ rpm: 0.1, thr: 0, speed: 0, skid: 0, nitro: 0, siren: 0, rain: false, running: false });
    this.updateCar(dt); this.updateSky(running ? dt : 0); this.updateCamera(dt);
    this.water.position.set(this.camera.position.x, 0, this.camera.position.z);
    const tt = performance.now() * 0.002; this.markers.forEach((m) => { m.rotation.y = tt; });
    // HUD
    const e = this.el; e.spd.textContent = Math.round(Math.abs(p.v) * 3.6); e.dmg.style.width = clamp(p.health, 0, 100) + '%'; e.nit.style.width = p.nitro * 100 + '%';
    const hrs = Math.floor(this.tod * 24), mins = Math.floor((this.tod * 24 - hrs) * 60);
    const ci = Math.round(p.x / S), cj = Math.round(p.z / S);
    e.info.innerHTML = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}<br>${(p.dist / 1000).toFixed(2)} km<br>Town ${ci},${cj}`;
    e.race.innerHTML = this.race ? `CHECKPOINT ${this.race.i + 1}/${this.race.cps.length}<br>⏱ ${Math.max(0, this.race.left).toFixed(1)} s` : '';
    this.miniT += dt; if (this.miniT > 0.08) { this.miniT = 0; this.drawMini(); }
    this.renderer.render(this.scene, this.camera);
  }
}
