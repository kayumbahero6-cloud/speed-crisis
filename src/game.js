import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Road, buildRoadMeshes, LANE_W, OUR_LANES, ONC_LANES, WALL_L, WALL_R } from './road.js';
import { World, THEMES, GLOW } from './world.js';
import { trackById } from './tracks.js';
import { attachCarModel, loadSky, PropField, initAssets, hasModel } from './models.js';
import { CARS, TPL, carById, CarVisual, randomTrafficDef, randomTrafficColor, buildTruck } from './cars.js';
import { clamp, lerp, damp, rand, pick } from './util.js';

const COP_DEF = { id: 'cop', sh: TPL[7].sh };

export { hasModel };
export function statsFor(def, up) {
  up = up || { eng: 0, tur: 0, tyr: 0, brk: 0 };
  return {
    top: (def.top * (1 + 0.03 * up.eng)) / 3.6, acc: def.acc * (1 + 0.06 * up.eng),
    hnd: def.hnd * (1 + 0.04 * up.tyr), brk: def.brk * (1 + 0.05 * up.brk), nit: def.nit * (1 + 0.1 * up.tur),
  };
}

export class Game {
  constructor(canvas, sound) {
    this.canvas = canvas; this.sound = sound;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    this.settings = { quality: 1.5, assist: true, autoGas: true, view: 0, theme: 'day', density: 1, tilt: false }; this.tilt = null;
    this.VIEWS = ['CHASE', 'CLOSE CHASE', 'HOOD', 'BUMPER', 'DRONE', 'LOW CINEMATIC'];
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1800);
    const pm = new THREE.PMREMGenerator(r);
    this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.env;
    this.road = new Road();
    this.rm = buildRoadMeshes(this.road, r);
    this.scene.add(this.rm.group);
    this.world = new World(this.scene, this.road);
    this.world.attachCamera(this.camera); this.world.farMat = this.rm.farMat;
    this.input = { L: 0, R: 0, gas: 0, brake: 0, nitro: 0, tL: 0, tR: 0, tB: 0, tN: 0, tG: 0 };
    this.state = 'title'; // title | garage | play | paused | over
    this.hud = null; this.onEnd = () => {}; this.sparks = this.makeSparks();
    this.lightPts = this.makeLightPoints();
    this.garage = this.makeGarage();
    this.tmpV = new THREE.Vector3(); this.tmpP = {}; this.clock = 0; this.hudT = 0;
    this.carVis = null; this.traffic = []; this.cops = [];
    this.props = new PropField(this.scene, this.road); this.defaultEnv = this.env; initAssets();
    this.bindKeys(); this.resize();
    window.addEventListener('resize', () => this.resize());
    this.applyTheme(this.settings.theme);
    this.reset('highway', carById('honda-integra-type-r-dc2'), null, true);
    this.last = performance.now();
    const loop = (t) => { const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.frame(dt); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.settings.quality));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.garage.cam.aspect = w / h; this.garage.cam.updateProjectionMatrix();
    if (this.ow) this.ow.resize();
  }
  applyTheme(k) { this.settings.theme = k; this.world.setTheme(k, this.rm.roadMat, this.scene); this.nightish = THEMES[k].head; }

  /* ---------------- input ---------------- */
  bindKeys() {
    const map = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'brake', KeyS: 'brake', Space: 'brake', ShiftLeft: 'nitro', ShiftRight: 'nitro', KeyN: 'nitro' };
    window.addEventListener('keydown', (e) => {
      if (map[e.code]) { this.input[map[e.code]] = 1; if (this.state === 'play') e.preventDefault(); }
      if (e.code === 'KeyC' && !e.repeat) this.nextView();
      if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) this.onPauseKey && this.onPauseKey();
    });
    window.addEventListener('keyup', (e) => { if (map[e.code]) this.input[map[e.code]] = 0; });
    window.addEventListener('blur', () => { Object.keys(this.input).forEach((k) => { this.input[k] = 0; }); });
  }

  async applySky(track) {
    const tex = await loadSky(track.id, track.style);
    if (track !== this.track) return;
    if (tex) {
      const pm = new THREE.PMREMGenerator(this.renderer); const env = pm.fromEquirectangular(tex).texture; pm.dispose();
      this.scene.background = tex; this.scene.environment = env; this.world.sky.visible = false; this.world.stars.visible = false; this.realSky = true;
    } else { this.scene.background = null; this.scene.environment = this.defaultEnv; this.world.sky.visible = true; this.world.stars.visible = true; this.realSky = false; }
  }
  nextView() { this.settings.view = (this.settings.view + 1) % this.VIEWS.length; this.popup('CAMERA: ' + this.VIEWS[this.settings.view], ''); }
  /* ---------------- pooled effects ---------------- */
  makeSparks() {
    const N = 120, pos = new Float32Array(N * 3), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: GLOW, color: 0xffb040, size: 5, sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; this.scene.add(pts);
    return { N, pos, g, pts, vel: new Float32Array(N * 3), life: new Float32Array(N), i: 0 };
  }
  spark(x, y, z, n, spread) {
    const S = this.sparks;
    for (let k = 0; k < n; k++) {
      const i = S.i++ % S.N;
      S.pos[i * 3] = x; S.pos[i * 3 + 1] = y; S.pos[i * 3 + 2] = z;
      S.vel[i * 3] = (Math.random() - 0.5) * spread; S.vel[i * 3 + 1] = Math.random() * spread * 0.7; S.vel[i * 3 + 2] = (Math.random() - 0.5) * spread; S.life[i] = 0.5 + Math.random() * 0.5;
    }
  }
  updateSparks(dt) {
    const S = this.sparks;
    for (let i = 0; i < S.N; i++) {
      if (S.life[i] > 0) { S.life[i] -= dt; S.vel[i * 3 + 1] -= 18 * dt; S.pos[i * 3] += S.vel[i * 3] * dt; S.pos[i * 3 + 1] += S.vel[i * 3 + 1] * dt; S.pos[i * 3 + 2] += S.vel[i * 3 + 2] * dt; }
      else S.pos[i * 3 + 1] = -999;
    }
    S.g.attributes.position.needsUpdate = true;
  }
  makeLightPoints() {
    const N = 120, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: GLOW, size: 7, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; this.scene.add(pts);
    return { N, pos, col, g, pts };
  }

  /* ---------------- garage preview ---------------- */
  makeGarage() {
    const sc = new THREE.Scene(); sc.environment = this.env; sc.environmentIntensity = 1.1;
    sc.background = new THREE.Color(0x0b0f1a); sc.fog = new THREE.Fog(0x0b0f1a, 12, 40);
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    sc.add(new THREE.HemisphereLight(0xaac4ff, 0x222233, 0.8));
    const k = new THREE.DirectionalLight(0xffffff, 2.6); k.position.set(5, 8, 4); sc.add(k);
    const rim = new THREE.DirectionalLight(0x66aaff, 2.0); rim.position.set(-6, 3, -5); sc.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.35, metalness: 0.6 }));
    floor.rotation.x = -Math.PI / 2; sc.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.55, 64), new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; sc.add(ring);
    return { sc, cam, car: null, ang: 0.6 };
  }
  showInGarage(def, paint, glow, wheelSpin) {
    const G = this.garage;
    if (G.car) G.sc.remove(G.car.group);
    G.car = new CarVisual(def, { paint, detail: true }); G.car.group.rotation.order = 'YXZ';
    G.car.shadow.visible = false;
    if (glow) G.car.setUnderglow(glow, 0.55);
    G.sc.add(G.car.group); G.def = def; attachCarModel(G.car, def).then((ok) => { if (ok) G.car.setPaint(paint); }); void wheelSpin;
  }
  recolorGarage(paint, glow) { const G = this.garage; if (G.car) { G.car.setPaint(paint); G.car.setUnderglow(glow || '#000', glow ? 0.55 : 0); } }

  /* ---------------- session ---------------- */
  /** mode: 'highway' | 'pursuit'; demo = title-screen autopilot */
  reset(mode, def, up, demo, track) {
    this.track = track || this.track || trackById('guia-circuit-macau');
    this.road.configure(this.track.params); this.world.setStyle(this.track.style, this.rm);
    if (this.rm.barMat) this.rm.barMat.color.set(this.track.style === 'oval' ? 0x37d6c4 : 0xffffff); // teal speedway walls
    this.applySky(this.track); this.props.setup(this.track.id, this.track.style);
    this.mode = mode; this.def = def; this.up = up || { eng: 0, tur: 0, tyr: 0, brk: 0 }; this.demo = !!demo;
    this.st = statsFor(def, this.up);
    if (this.carVis) this.scene.remove(this.carVis.group);
    this.traffic.forEach((t) => this.scene.remove(t.vis.group)); this.traffic = [];
    this.cops.forEach((c) => this.scene.remove(c.vis.group)); this.cops = [];
    this.carVis = new CarVisual(def, { paint: this.paint || def.paint, detail: true });
    this.scene.add(this.carVis.group); attachCarModel(this.carVis, def);
    if (this.glow) this.carVis.setUnderglow(this.glow, 0.5);
    if (this.headSpot) this.carVis.group.remove(this.headSpot);
    const sp = this.headSpot = new THREE.SpotLight(0xfff0d0, 0, 120, 0.55, 0.7, 1.2);
    sp.position.set(0, 1, 1.5); sp.target.position.set(0, -2, 40);
    this.carVis.group.add(sp, sp.target);
    const p = this.p = {
      s: 120, lat: OUR_LANES[1], v: demo ? 38 : 22, latVel: 0, yawRel: 0, steer: 0, health: 100, nitro: 1, nitroOn: false,
      score: 0, combo: 0, comboT: 0, dist: 0, near: 0, takedowns: 0, time: 0, topV: 0, shake: 0, skid: 0, flash: 0, hitCd: 0,
      heat: 1, bust: 0, esc: 0, copTimer: 2, blockTimer: 20, roadSide: 0, oncT: 0, over: false, rpm: 0, gear: 1,
    };
    this.camLat = p.lat; this.fov = 62; this.camS = p.s - 9;
    this.spawnTrafficInitial();
    this.applyTheme(this.settings.theme);
    this.state = demo ? 'title' : 'play';
    this.carVis.setBrake(false);
  }
  trafficTarget() { return Math.round((this.mode === 'pursuit' ? 14 : 22) * this.settings.density); }
  spawnTrafficInitial() { for (let i = 0; i < this.trafficTarget(); i++) this.spawnTraffic(true); }
  spawnTraffic(initial) {
    const p = this.p; const dir = Math.random() < 0.3 ? -1 : 1;
    const li = (Math.random() * (dir > 0 ? 3 : 2)) | 0; const lat = dir > 0 ? OUR_LANES[li] : ONC_LANES[li];
    const s = p.s + (initial ? rand(70, 700) : rand(520, 780));
    if (this.traffic.some((t) => Math.abs(t.lat - lat) < 2 && Math.abs(t.s - s) < 45)) return;
    const v = dir > 0 ? [rand(27, 36), rand(21, 30), rand(15, 24)][li] : -rand(24, 36);
    const isTruck = Math.random() < 0.09;
    let vis, len, wid;
    if (isTruck) { const tk = buildTruck(randomTrafficColor()); vis = { group: tk.group, root: tk.root, sh: tk.sh }; len = 9.6; wid = 2.6; }
    else { const d = randomTrafficDef(); vis = new CarVisual({ id: d.id, sh: d.sh }, { paint: randomTrafficColor(), detail: false }); len = d.sh.L; wid = d.sh.W; }
    this.scene.add(vis.group);
    this.traffic.push({ vis, s, lat, v, dir, len, wid, truck: isTruck, hit: false, latVel: 0, spin: 0, yaw: 0, tLat: lat, lcT: rand(4, 14), prevDs: s - p.s, done: false, cool: 0, block: false });
  }
  spawnCop() {
    const p = this.p; const vis = new CarVisual(COP_DEF, { cop: true, detail: false });
    this.scene.add(vis.group);
    const lat = pick(OUR_LANES);
    this.cops.push({ vis, s: p.s - rand(110, 190), lat, v: p.v * 0.9, latVel: 0, hp: 100, dead: false, deadT: 0, spin: 0, yaw: 0, len: COP_DEF.sh.L, wid: COP_DEF.sh.W, ramCd: 0, side: Math.random() < 0.5 ? -1 : 1 });
    this.popup('POLICE IN PURSUIT', 'warn');
  }
  spawnRoadblock() {
    const p = this.p, gap = (Math.random() * 3) | 0, s = p.s + 620;
    OUR_LANES.forEach((lat, i) => {
      if (i === gap) return;
      const vis = new CarVisual(COP_DEF, { cop: true, detail: false }); this.scene.add(vis.group);
      this.traffic.push({ vis, s: s + (Math.random() - 0.5) * 3, lat, v: 0, dir: 1, len: 4.75, wid: 1.9, truck: false, hit: false, latVel: 0, spin: 0, yaw: 0.0, tLat: lat, lcT: 999, prevDs: s - p.s, done: false, cool: 0, block: true });
    });
    this.popup('ROADBLOCK AHEAD', 'warn');
  }

  popup(txt, cls) { this.onPopup && this.onPopup(txt, cls || ''); }

  end(reason) {
    if (this.p.over) return; this.p.over = true; this.state = 'over';
    if (reason === 'BUSTED') this.sound.burst('busted');
    this.onEnd({ reason, mode: this.mode, ...this.p, car: this.def.name });
  }

  /* ---------------- frame ---------------- */
  frame(dt) {
    this.clock += dt;
    if (this.state === 'garage') { this.renderGarage(dt); return; }
    if ((this.state === 'open' || this.state === 'openpaused') && this.ow) { this.ow.frame(dt, this.state === 'open'); return; }
    if (this.state === 'play' || this.state === 'title') this.step(dt);
    this.updateCamera(dt);
    this.world.update(this.p.s, this.camera.position, this.state === 'paused' ? 0 : this.p.v, dt, this.clock);
    this.rm.update(this.camS, this.camera.position.x, this.camera.position.z);
    this.updateSparks(dt); this.props.update(this.p.s);
    this.updateLights();
    this.renderer.render(this.scene, this.camera);
  }
  renderGarage(dt) {
    const G = this.garage; G.ang += dt * 0.35;
    if (G.car) {
      const d = G.def.sh.L; G.cam.position.set(Math.sin(G.ang) * (d * 1.45 + 2.2), 1.6 + Math.sin(G.ang * 0.7) * 0.15, Math.cos(G.ang) * (d * 1.45 + 2.2));
      G.cam.lookAt(0, 0.7, 0); G.car.update(dt, 0, 0);
    }
    this.renderer.render(G.sc, G.cam);
  }

  /* ---------------- simulation ---------------- */
  step(dt) {
    const p = this.p, I = this.input, st = this.st, road = this.road, demo = this.demo;
    const road0 = road.sample(p.s, this.tmpP);
    p.time += dt;
    // --- controls
    let steerT = (I.R || I.tR) - (I.L || I.tL);
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null; let gas = I.gas || I.tG, brake = I.brake || I.tB, nitroKey = I.nitro || I.tN;
    if (this.settings.tilt && this.tilt !== null) steerT = this.tilt;
    if (gp) {
      const y = gp.buttons[3] && gp.buttons[3].pressed, st9 = gp.buttons[9] && gp.buttons[9].pressed;
      if (y && !this._yPrev) this.nextView(); if (st9 && !this._sPrev && this.onPauseKey) this.onPauseKey(); this._yPrev = y; this._sPrev = st9;
    }
    if (gp) { const ax = gp.axes[0] || 0; if (Math.abs(ax) > 0.12) steerT = ax; gas = gas || (gp.buttons[7] && gp.buttons[7].value > 0.1) || gp.buttons[0].pressed; brake = brake || (gp.buttons[6] && gp.buttons[6].value > 0.1) || gp.buttons[1].pressed; nitroKey = nitroKey || (gp.buttons[2] && gp.buttons[2].pressed); }
    if (this.settings.autoGas && !brake) gas = 1;
    if (demo) { // autopilot for the title screen
      gas = p.v < 40 ? 1 : 0; brake = 0; nitroKey = 0;
      const desired = clamp((OUR_LANES[1] - p.lat) * 1.2, -3, 3) - road0.k * p.v * p.v * 0.07;
      steerT = clamp(desired / (st.hnd * 9), -1, 1);
    }
    const rate = Math.abs(steerT) > Math.abs(p.steer) ? 6.5 : 9;
    p.steer = damp(p.steer, steerT, rate, dt);
    // --- speed
    const nitroWant = nitroKey && p.nitro > 0.02 && p.v > 8 && !brake;
    if (nitroWant && !p.nitroOn) this.sound.burst('nitro');
    p.nitroOn = !!nitroWant;
    const vmax = st.top * (p.nitroOn ? 1.28 : 1);
    let a;
    if (gas) a = st.acc * Math.max(0, 1 - Math.pow(p.v / vmax, 1.6)) * (p.v < 4 ? 1.2 : 1) + (p.nitroOn ? 9 * st.nit * Math.max(0, 1 - p.v / (vmax * 1.02)) : 0);
    else a = -(1.5 + 0.0007 * p.v * p.v);
    if (p.v > vmax) a -= (p.v - vmax) * 0.7;
    if (brake) a = -st.brk * (0.6 + 0.4 * Math.min(1, p.v / 25)) - 1;
    a -= 9.81 * road0.slope * 0.55;
    p.v = Math.max(0, p.v + a * dt);
    if (p.nitroOn) p.nitro = Math.max(0, p.nitro - dt * 0.2 / st.nit); else if (p.v > 25) p.nitro = Math.min(1, p.nitro + dt * 0.025);
    p.topV = Math.max(p.topV, p.v);
    // --- lateral
    const maxLat = st.hnd * lerp(9.5, 7.0, clamp(p.v / 95, 0, 1)) * clamp(p.v / 6, 0, 1) * (brake ? 1.1 : 1);
    const push = road0.k * p.v * p.v * (this.settings.assist ? 0.065 : 0.115) / st.hnd;
    p.latVel = damp(p.latVel, p.steer * maxLat + push, 7, dt);
    p.lat += p.latVel * dt;
    p.yawRel = Math.atan2(p.latVel, Math.max(p.v, 6));
    const hw = this.def.sh.W / 2;
    if (!demo) {
      if (p.lat < WALL_L + hw || p.lat > WALL_R - hw) {
        const left = p.lat < WALL_L + hw; p.lat = left ? WALL_L + hw : WALL_R - hw;
        const imp = Math.abs(p.latVel);
        if (imp > 1.2) { p.v *= 1 - clamp(imp * 0.012, 0.01, 0.1); p.health -= imp * 0.35; p.shake = Math.max(p.shake, clamp(imp / 8, 0.2, 1)); this.sound.burst('scrape'); p.combo = 0; }
        this.worldSpark(p.s, p.lat + (left ? -hw : hw), 0.4, 10);
        p.latVel = -p.latVel * 0.3 + (left ? 0.5 : -0.5);
      }
    } else p.lat = clamp(p.lat, WALL_L + 2, WALL_R - 2);
    const ds = p.v * Math.cos(p.yawRel) * dt;
    p.s += ds; p.dist += ds;
    p.skid = p.v > 22 ? clamp((Math.abs(p.latVel - p.steer * maxLat * 0.5) - 5.5) / 4, 0, 1) : 0;
    p.hitCd = Math.max(0, p.hitCd - dt); p.shake = Math.max(0, p.shake - dt * 1.8); p.flash = Math.max(0, p.flash - dt * 2);
    // --- score
    if (!demo) {
      p.score += dt * p.v * 0.35;
      if (p.lat < -0.5 && p.v > 28) { p.oncT += dt; p.score += dt * p.v * 1.2; if (p.oncT > 1.2 && !p._onc) { p._onc = true; this.popup('ONCOMING LANE x2', 'good'); } } else { p.oncT = 0; p._onc = false; }
      p.comboT -= dt; if (p.comboT <= 0) p.combo = 0;
    }
    // --- world actors
    this.updateTraffic(dt);
    if (this.mode === 'pursuit' && !demo) this.updatePursuit(dt);
    if (!demo && p.health <= 0) { p.health = 0; this.end('WRECKED'); }
    // --- visuals of player car
    const yawVis = clamp(p.yawRel * 1.5, -0.6, 0.6);
    this.placeCar(this.carVis.group, p.s, p.lat, yawVis, false);
    const vis = this.carVis;
    vis.root.rotation.z = lerp(vis.root.rotation.z, -p.steer * 0.045 * clamp(p.v / 50, 0, 1.5) - p.latVel * 0.004, 0.2);
    vis.root.rotation.x = lerp(vis.root.rotation.x, (brake ? 0.03 : 0) - (gas && p.v < 40 ? 0.025 : 0), 0.15);
    vis.update(dt, p.v, p.steer * 0.42); vis.setBrake(brake && p.v > 1); vis.setNitro(p.nitroOn ? 1 : 0);
    this.headSpot.intensity = this.nightish ? 900 : 0;
    // rpm / gear for HUD and sound
    const gearTop = st.top * 1.28 / 6; p.gear = clamp(Math.ceil(p.v / gearTop), 1, 6);
    const lo = (p.gear - 1) * gearTop; p.rpm = clamp(0.18 + 0.82 * (p.v - lo) / gearTop, 0.15, 1);
    this.sound.update({ rpm: p.rpm, thr: gas ? 1 : 0.1, speed: p.v, skid: p.skid, nitro: p.nitroOn ? 1 : 0, siren: this.sirenAmt || 0, rain: this.settings.theme === 'rain', running: this.state === 'play' });
  }
  worldSpark(s, lat, up, n) { const v = this.road.pos(s, lat, up, this.tmpV); this.spark(v.x, v.y, v.z, n, 9); }

  placeCar(group, s, lat, yaw, flip, extraYaw) {
    const p = this.road.sample(s, this.tmpP); const rx = -Math.cos(p.th), rz = Math.sin(p.th);
    group.position.set(p.x + rx * lat, p.y, p.z + rz * lat);
    group.rotation.y = p.th - yaw + (flip ? Math.PI : 0) + (extraYaw || 0);
    group.rotation.x = flip ? Math.atan(p.slope) : -Math.atan(p.slope);
  }

  updateTraffic(dt) {
    const p = this.p, T = this.traffic, demo = this.demo;
    // keep population
    if (T.filter((t) => !t.block).length < this.trafficTarget() && Math.random() < 0.25) this.spawnTraffic(false);
    for (let i = T.length - 1; i >= 0; i--) {
      const t = T[i];
      // car following + lane changes
      if (!t.hit && !t.block && t.dir > 0) {
        for (const o of T) {
          if (o === t || o.dir < 0 || Math.abs(o.lat - t.lat) > 2.2) continue;
          const gap = o.s - t.s - (o.len + t.len) / 2;
          if (gap > 0 && gap < 20) t.v += (Math.min(o.v, t.v) - t.v) * Math.min(1, dt * 3);
        }
        t.lcT -= dt;
        if (t.lcT <= 0) {
          t.lcT = rand(6, 16); const idx = OUR_LANES.findIndex((l) => Math.abs(l - t.tLat) < 0.5); const ni = idx + (Math.random() < 0.5 ? -1 : 1);
          if (ni >= 0 && ni < 3 && !T.some((o) => o !== t && Math.abs(o.lat - OUR_LANES[ni]) < 2.5 && Math.abs(o.s - t.s) < 30) && Math.abs(t.s - p.s) > 40) t.tLat = OUR_LANES[ni];
        }
        t.lat += clamp(t.tLat - t.lat, -2.4 * dt, 2.4 * dt);
      }
      t.s += t.v * dt;
      if (t.hit) { t.lat += t.latVel * dt; t.latVel *= 1 - dt; t.yaw += t.spin * dt; t.v *= 1 - dt * 0.6; t.lat = clamp(t.lat, WALL_L + 1, WALL_R - 1); t.spin *= 1 - dt * 0.7; }
      t.cool = Math.max(0, t.cool - dt);
      const dsP = t.s - p.s;
      // cull
      if (dsP < -140 || dsP > 900) { this.scene.remove(t.vis.group); T.splice(i, 1); continue; }
      t.vis.group.visible = dsP < 760;
      this.placeCar(t.vis.group, t.s, t.lat, t.yaw, t.dir < 0);
      if (!demo && !p.over) {
        const lx = (this.def.sh.W + t.wid) / 2, ly = (this.def.sh.L + t.len) / 2;
        const dl = Math.abs(t.lat - p.lat), crossed = (t.prevDs > 0) !== (dsP > 0) && Math.abs(dsP - t.prevDs) < 30;
        if (dl < lx * 0.92 && (Math.abs(dsP) < ly * 0.92 || (crossed && dl < lx * 0.9)) && t.cool === 0) { this.hitTraffic(t); }
        else if (crossed && !t.hit && !t.block) { // passed beside us: near miss?
          const gap = dl - lx;
          if (gap < 1.15 && p.v > 20 && p.hitCd < 0.2) this.nearMiss(t, gap);
        }
      }
      t.prevDs = dsP;
    }
  }
  nearMiss(t, gap) {
    const p = this.p; p.combo++; p.comboT = 3.2; p.near++;
    const pts = Math.round((60 + p.v * 2.2) * (t.dir < 0 ? 2 : 1) * (1 + p.combo * 0.35) * (gap < 0.5 ? 1.5 : 1));
    p.score += pts; p.nitro = Math.min(1, p.nitro + 0.07);
    this.popup(`${t.dir < 0 ? 'ONCOMING ' : ''}NEAR MISS +${pts}${p.combo > 1 ? '  x' + p.combo : ''}`, 'good');
    this.sound.burst('near');
  }
  hitTraffic(t) {
    const p = this.p; const tv = t.v; const rel = t.dir < 0 ? p.v + Math.abs(tv) : Math.abs(p.v - tv);
    const dmg = clamp(rel * 0.5 * (t.truck ? 1.4 : 1) * (t.block ? 1.2 : 1), 4, 70);
    p.health -= dmg; p.hitCd = 0.6; p.combo = 0; p.shake = 1; p.flash = 1; t.cool = 0.8;
    if (t.dir < 0 || t.block) p.v *= 0.35; else p.v = Math.max(tv * 0.8, p.v * 0.55);
    const sg = p.lat >= t.lat ? 1 : -1; p.latVel += sg * 4;
    if (!t.block) { t.hit = true; t.latVel = -sg * 6; t.spin = -sg * rand(1.5, 4); t.v = t.dir > 0 ? Math.max(t.v, p.v) * 0.8 : t.v * 0.4; }
    this.worldSpark(p.s, p.lat, 0.6, 30); this.sound.burst('crash');
    this.popup('CRASH  -' + Math.round(dmg) + '%', 'bad');
  }

  /* ---------------- Hot Pursuit ---------------- */
  updatePursuit(dt) {
    const p = this.p, st = this.st, C = this.cops; const want = Math.min(1 + p.heat, 5);
    p.copTimer -= dt; if (C.filter((c) => !c.dead).length < want && p.copTimer <= 0) { this.spawnCop(); p.copTimer = 3.5; }
    if (p.heat >= 2) { p.blockTimer -= dt; if (p.blockTimer <= 0) { this.spawnRoadblock(); p.blockTimer = rand(24, 34); } }
    const copTop = Math.min(98, st.top * 0.93 * (1 + 0.04 * (p.heat - 1)));
    let near = false, nearestBehind = 9999; this.sirenAmt = 0;
    for (let i = C.length - 1; i >= 0; i--) {
      const c = C[i]; const gap = p.s - c.s;
      if (c.dead) {
        c.deadT += dt; c.v *= 1 - dt * 1.4; c.s += c.v * dt; c.yaw += c.spin * dt; c.lat += c.latVel * dt; c.latVel *= 1 - dt;
        if (c.deadT > 5 || gap > 200 || gap < -400) { this.scene.remove(c.vis.group); C.splice(i, 1); continue; }
      } else {
        let tv, tlat = p.lat + c.side * 1.6;
        if (gap > 45) tv = p.v + clamp(gap * 0.22, 5, 26); else if (gap > -6) tv = p.v + 4; else tv = p.v * 0.75;
        tv = Math.min(tv, copTop);
        // avoid traffic ahead
        for (const o of this.traffic) {
          if (o.dir < 0 && !o.block) continue; const g2 = o.s - c.s - (o.len + c.len) / 2;
          if (g2 > 0 && g2 < 32 && Math.abs(o.lat - c.lat) < 2.4 && !o.hit) { tv = Math.min(tv, o.v + (g2 < 10 ? -6 : 3)); tlat = c.lat + (c.lat < 6 ? 1 : -1) * LANE_W; }
        }
        c.v += clamp(tv - c.v, -26 * dt, 13 * dt); c.v = Math.max(0, c.v);
        c.latVel = damp(c.latVel, clamp((tlat - c.lat) * 1.8, -8, 8), 4, dt);
        c.s += c.v * dt; c.lat = clamp(c.lat + c.latVel * dt, WALL_L + 1.2, WALL_R - 1.2);
        c.ramCd = Math.max(0, c.ramCd - dt);
        // cop vs traffic
        for (const o of this.traffic) {
          if (o.dir < 0 && Math.abs(o.s - c.s) > 12) continue;
          if (Math.abs(o.s - c.s) < (o.len + c.len) / 2 * 0.9 && Math.abs(o.lat - c.lat) < (o.wid + c.wid) / 2 * 0.9 && !o.hit && o.cool === 0) {
            o.cool = 1; if (!o.block) { o.hit = true; o.latVel = rand(-4, 4); o.spin = rand(-3, 3); } c.hp -= 60; c.latVel = rand(-4, 4);
          }
        }
        // cop vs player
        const lx = (c.wid + this.def.sh.W) / 2, ly = (c.len + this.def.sh.L) / 2;
        if (Math.abs(c.lat - p.lat) < lx * 0.93 && Math.abs(c.s - p.s) < ly * 0.93 && c.ramCd === 0) {
          c.ramCd = 0.8; const rel = Math.abs(p.v - c.v); const sg = p.lat >= c.lat ? 1 : -1;
          const playerRammed = p.s > c.s; // player is ahead => cop rams from behind
          p.latVel += sg * 4.5; c.latVel -= sg * 5.5;
          p.health -= playerRammed ? 2.5 + rel * 0.1 : 3 + rel * 0.35; c.hp -= playerRammed ? 14 : 30 + rel * 3;
          p.shake = Math.max(p.shake, 0.6); p.flash = 0.6; p.v *= playerRammed ? 0.985 : 0.93; this.sound.burst('crash'); this.worldSpark(p.s, p.lat, 0.6, 18);
        }
        if (c.hp <= 0) { c.dead = true; c.spin = rand(-4, 4); p.takedowns++; p.score += 1000; this.popup('TAKEDOWN +1000', 'good'); }
        // busted logic
        if (gap > -12 && gap < 22 && Math.abs(c.lat - p.lat) < 5.5) near = true;
        if (gap > 0) nearestBehind = Math.min(nearestBehind, gap);
        const dist = Math.abs(gap); if (dist < 90) this.sirenAmt = Math.max(this.sirenAmt, 1 - dist / 90);
      }
      this.placeCar(c.vis.group, c.s, c.lat, c.dead ? c.yaw : clamp(c.latVel * 0.025, -0.3, 0.3) + c.yaw, false);
      c.vis.update(dt, c.v, 0);
    }
    p.bust = clamp(p.bust + (near ? 0.2 : -0.14) * dt * (p.nitroOn ? 0.6 : 1), 0, 1);
    if (p.bust >= 1) { this.end('BUSTED'); return; }
    // escape meter
    if (nearestBehind > 140 || !C.some((c) => !c.dead)) p.esc += dt * 0.05; else if (nearestBehind < 70) p.esc -= dt * 0.03;
    p.esc = clamp(p.esc, 0, 1);
    if (p.esc >= 1) {
      p.score += 2000 * p.heat; this.popup(`HEAT ${p.heat} ESCAPED  +${2000 * p.heat}`, 'good'); p.heat++; p.esc = 0; p.copTimer = 4; p.bust = 0;
      this.popup(`HEAT ${p.heat} — MORE COPS`, 'warn');
    }
  }

  /* ---------------- camera ---------------- */
  updateCamera(dt) {
    const cam = this.camera, p = this.p, road = this.road; const view = this.settings.view;
    const dist = [9.5, 6.4, -0.3, -2.3, 17, 5.4][view], h = [3.3, 2.35, 1.3, 0.62, 10, 0.95][view], look = [16, 14, 40, 40, 20, 12][view];
    this.camLat = damp(this.camLat, p.lat, view >= 2 && view <= 3 ? 20 : 5.5, dt);
    const k = clamp(p.v / 100, 0, 1.2);
    const targetFov = (view === 2 || view === 3 ? 74 : view === 5 ? 66 : 60) + k * 16 + (p.nitroOn ? 9 : 0);
    this.fov = damp(this.fov, targetFov, 4, dt);
    const camDist = dist + (p.nitroOn ? 0.8 : 0) - k * 0.8;
    this.camS = p.s - camDist;
    const orbit = view === 5 ? Math.sin(this.clock * 0.5) * 2.6 : 0;
    const pos = road.pos(this.camS, this.camLat * (view === 2 || view === 3 ? 1 : 0.9) + orbit, h, this.tmpV);
    const sh = (p.shake * 0.35 + k * 0.025);
    cam.position.set(pos.x + (Math.random() - 0.5) * sh, pos.y + (Math.random() - 0.5) * sh, pos.z + (Math.random() - 0.5) * sh);
    const tg = road.pos(p.s + look, lerp(this.camLat, p.lat, 0.5) * 0.85, view === 4 ? 0.5 : 1.0 + (view === 2 || view === 3 ? 0.7 : 0.4), new THREE.Vector3());
    // slight look-ahead into the curve
    cam.up.set(0, 1, 0); cam.lookAt(tg);
    cam.rotateZ(-p.latVel * 0.0035 - p.steer * 0.012);
    if (Math.abs(cam.fov - this.fov) > 0.05) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
    this.carVis.group.visible = view !== 2 && view !== 3;
  }

  updateLights() {
    const L = this.lightPts, t = this.world.t; if (!t) return;
    const on = t.head ? 1 : 0; L.pts.visible = !!on; if (!on) return;
    let n = 0; const v = new THREE.Vector3();
    const add = (s, lat, up, flipZ, color, side, half, len) => {
      for (const sx of [-1, 1]) {
        if (n >= L.N) return;
        // front lights if flipZ (oncoming), else tail lights
        this.road.pos(s + (flipZ ? -1 : 1) * 0, lat + sx * half, up, v);
        const p = this.road.sample(s, this.tmpP); const fwd = flipZ ? -len / 2 : len / 2;
        L.pos[n * 3] = v.x + Math.sin(p.th) * fwd * (flipZ ? 1 : -1) * -1; L.pos[n * 3 + 1] = v.y; L.pos[n * 3 + 2] = v.z + Math.cos(p.th) * fwd * (flipZ ? 1 : -1) * -1;
        L.col[n * 3] = color[0]; L.col[n * 3 + 1] = color[1]; L.col[n * 3 + 2] = color[2]; n++;
      }
    };
    void add;
    for (const tr of this.traffic) {
      if (n >= L.N - 2) break; if (tr.vis.group.visible === false) continue;
      const oncoming = tr.dir < 0; const p = this.road.sample(tr.s, this.tmpP);
      const hs = tr.wid * 0.36, fwd = (oncoming ? -1 : 1) * tr.len / 2 * (oncoming ? 1 : -1) * -1;
      const fx = Math.sin(p.th) * (oncoming ? 1 : -1) * tr.len / 2, fz = Math.cos(p.th) * (oncoming ? 1 : -1) * tr.len / 2; void fwd;
      for (const sx of [-1, 1]) {
        const w = this.road.pos(tr.s, tr.lat + sx * hs, 0.75, v);
        L.pos[n * 3] = w.x + fx; L.pos[n * 3 + 1] = w.y; L.pos[n * 3 + 2] = w.z + fz;
        if (tr.block) { const f = Math.floor(this.clock * 6) % 2; L.col[n * 3] = f ? 1 : 0.1; L.col[n * 3 + 1] = 0.1; L.col[n * 3 + 2] = f ? 0.1 : 1; }
        else if (oncoming) { L.col[n * 3] = 1; L.col[n * 3 + 1] = 0.95; L.col[n * 3 + 2] = 0.8; }
        else { L.col[n * 3] = 0.9; L.col[n * 3 + 1] = 0.05; L.col[n * 3 + 2] = 0.05; }
        n++;
      }
    }
    for (const c of this.cops) {
      if (n >= L.N - 2) break; const f = Math.floor(this.clock * 6) % 2;
      const w = this.road.pos(c.s, c.lat, 2.2, v);
      for (const sx of [-1, 1]) {
        L.pos[n * 3] = w.x; L.pos[n * 3 + 1] = w.y; L.pos[n * 3 + 2] = w.z;
        const red = (sx > 0) === (f === 1); L.col[n * 3] = red ? 1 : 0.1; L.col[n * 3 + 1] = 0.1; L.col[n * 3 + 2] = red ? 0.1 : 1; n++;
      }
    }
    L.g.setDrawRange(0, n); L.g.attributes.position.needsUpdate = true; L.g.attributes.color.needsUpdate = true;
  }
}
