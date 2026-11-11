import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hash, clamp } from './util.js';
import { WALL_L, WALL_R } from './road.js';

export const THEMES = {
  day: { name: 'Day', top: 0x2f7fd8, hor: 0xcfe6f7, fog: 0xbcd8ee, near: 140, far: 950, hemi: 1.0, sun: 2.4, sunCol: 0xfff1d6, win: 0.0, lamp: 0, rain: false, rough: 0.82, env: 1.0, head: false, stars: 0 },
  sunset: { name: 'Sunset', top: 0x27346e, hor: 0xff9a5a, fog: 0xd98a68, near: 90, far: 800, hemi: 0.7, sun: 2.0, sunCol: 0xff9a55, win: 0.25, lamp: 0.35, rain: false, rough: 0.7, env: 0.8, head: true, stars: 0.2 },
  night: { name: 'Night', top: 0x02040f, hor: 0x1a2748, fog: 0x0a1226, near: 50, far: 650, hemi: 0.28, sun: 0.35, sunCol: 0x8fa6ff, win: 1.0, lamp: 1.0, rain: false, rough: 0.55, env: 0.25, head: true, stars: 1 },
  rain: { name: 'Rain', top: 0x4b5660, hor: 0x8d98a2, fog: 0x8a959f, near: 40, far: 520, hemi: 0.75, sun: 0.7, sunCol: 0xcfd8e0, win: 0.15, lamp: 0.2, rain: true, rough: 0.28, env: 0.7, head: true, stars: 0 },
};

export const STY = {
  city: { bProb: 0.8, treeN: 2, tree: 0x2f6b3a, ground: 0xffffff, bs: [1, 1, 1], near: [24, 70], neon: false, gantry: 0x8a8f98, signs: false },
  neon: { bProb: 0.97, treeN: 1, tree: 0x1d7b7b, ground: 0x4a5878, bs: [1, 1.6, 1], near: [16, 36], neon: true, gantry: 0x00e5ff, signs: true },
  forest: { bProb: 0.0, treeN: 4, tree: 0x1f5a2e, ground: 0x9fb088, bs: [1, 1, 1], near: [10, 60], neon: false, gantry: null, signs: false },
  open: { bProb: 0.22, treeN: 1, tree: 0x7c8a3a, ground: 0xe3c98f, bs: [1.6, 0.2, 1.3], near: [26, 90], neon: false, gantry: 0xd0d4da, signs: false },
  oval: { bProb: 0.96, treeN: 0, tree: 0x2f6b3a, ground: 0xb8bcc2, bs: [3.0, 0.22, 1.9], near: [10, 6], neon: false, gantry: 0xffd75e, signs: false, crowd: true },
};
function crowdTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#2a2d36'; g.fillRect(0, 0, 128, 256);
  const cols = ['#e63946', '#f1c40f', '#3a86ff', '#ffffff', '#2ecc71', '#ff7a00'];
  for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x * 8 + 1, y * 8 + 1, 5, 5); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function signTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 192; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 512, 192); gr.addColorStop(0, '#12002e'); gr.addColorStop(1, '#00203a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 192);
  g.strokeStyle = '#00e5ff'; g.lineWidth = 6; g.strokeRect(6, 6, 500, 180);
  g.fillStyle = '#ff3d9e'; g.font = 'italic 900 78px Arial'; g.textAlign = 'center'; g.fillText('UMUHANDA', 256, 100);
  g.fillStyle = '#00e5ff'; for (let i = 0; i < 24; i++) g.fillRect(24 + i * 20, 130 + (i % 3) * 6, 12, 28 - (i % 5) * 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function windowTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#20252d'; g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) {
    const lit = Math.random() < 0.55;
    g.fillStyle = lit ? (Math.random() < 0.3 ? '#ffe9a8' : '#bcd8ff') : '#10151c';
    g.fillRect(x * 16 + 3, y * 16 + 3, 10, 11);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
export const GLOW = glowTexture();

function bld(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv; const M = 2.8; // metres per window
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i; const [fw, fh] = faces[f];
    if (f === 2 || f === 3) uv.setXY(k, 0.02, 0.02);
    else uv.setXY(k, uv.getX(k) * fw / (M * 8), uv.getY(k) * fh / (M * 16));
  }
  return g;
}

export class World {
  constructor(scene, road) {
    this.scene = scene; this.road = road; this.theme = 'day';
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x556644, 1);
    this.sun = new THREE.DirectionalLight(0xffffff, 2);
    this.sun.position.set(-120, 200, 80);
    scene.add(this.hemi, this.sun, this.sun.target);
    scene.fog = new THREE.Fog(0xaaccee, 100, 900);

    // sky dome
    this.skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0.4, 0.3, 0.8).normalize() }, sunCol: { value: new THREE.Color() } };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 14), new THREE.ShaderMaterial({
      uniforms: this.skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top,hor,sunCol,sunDir; varying vec3 vP; void main(){ float h=clamp(vP.y,0.0,1.0); vec3 c=mix(hor,top,pow(h,0.55)); float s=max(dot(normalize(vP),sunDir),0.0); c+=sunCol*(pow(s,40.0)*0.9+pow(s,6.0)*0.25); gl_FragColor=vec4(c,1.0);} ',
    }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false; scene.add(this.sky);

    // stars
    const sp = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 + 0.1, r = 1400;
      sp[i * 3] = Math.cos(a) * Math.cos(e) * r; sp[i * 3 + 1] = Math.sin(e) * r; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    scene.add(this.stars);

    // buildings
    this.winTex = windowTexture();
    this.bMat = new THREE.MeshLambertMaterial({ map: this.winTex, emissiveMap: this.winTex, emissive: 0xffffff });
    this.bTypes = [[18, 40, 18], [24, 70, 22], [16, 100, 16], [30, 30, 26], [22, 55, 30], [14, 85, 14], [28, 120, 20]].map(([w, h, d]) => {
      const m = new THREE.InstancedMesh(bld(w, h, d), this.bMat, 70); m.frustumCulled = false; m.count = 0; scene.add(m);
      return { mesh: m, h, w };
    });
    // trees
    const tr = new THREE.Group();
    this.trees = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 7, 7).translate(0, 4.5, 0), this.treeMat = new THREE.MeshLambertMaterial({ color: 0x2f6b3a }), 360);
    this.trees.frustumCulled = false; scene.add(this.trees, tr);
    // neon billboards + gantries
    this.signs = new THREE.InstancedMesh(new THREE.PlaneGeometry(16, 6).translate(0, 10, 0), new THREE.MeshBasicMaterial({ map: signTexture(), side: THREE.DoubleSide }), 40);
    this.signs.frustumCulled = false; this.signs.count = 0; scene.add(this.signs);
    const gb = new THREE.BoxGeometry(27, 0.7, 0.7).translate(0, 7.2, 0), gp1 = new THREE.BoxGeometry(0.6, 7.2, 0.6).translate(-13.2, 3.6, 0), gp2 = new THREE.BoxGeometry(0.6, 7.2, 0.6).translate(13.2, 3.6, 0);
    this.gantry = new THREE.InstancedMesh(mergeGeometries([gb, gp1, gp2]), new THREE.MeshBasicMaterial({ color: 0x00e5ff }), 12);
    this.gantry.frustumCulled = false; this.gantry.count = 0; scene.add(this.gantry);
    this.crowdTex = crowdTexture(); this.style = STY.city;
    // lamps
    this.lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 9, 6).translate(0, 4.5, 0), new THREE.MeshLambertMaterial({ color: 0x6d7178 }), 60);
    this.lampPole.frustumCulled = false; scene.add(this.lampPole);
    const lp = new Float32Array(60 * 3);
    this.lampGeo = new THREE.BufferGeometry(); this.lampGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    this.lampPts = new THREE.Points(this.lampGeo, new THREE.PointsMaterial({ map: GLOW, color: 0xffd9a0, size: 11, sizeAttenuation: false, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lampPts.frustumCulled = false; scene.add(this.lampPts);

    // rain
    const RN = 700; this.rainN = RN;
    this.rainPos = new Float32Array(RN * 6);
    this.rainSeed = new Float32Array(RN * 3);
    for (let i = 0; i < RN; i++) { this.rainSeed[i * 3] = (Math.random() - 0.5) * 50; this.rainSeed[i * 3 + 1] = Math.random() * 30; this.rainSeed[i * 3 + 2] = -Math.random() * 40 + 5; }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xb8c8d8, transparent: true, opacity: 0.45 }));
    this.rain.frustumCulled = false; this.rain.visible = false;

    // speed streaks (children of camera)
    const SN = 90; this.speedN = SN;
    this.sPos = new Float32Array(SN * 6); this.sSeed = new Float32Array(SN * 3);
    const rnd = () => {
      const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 9;
      return [Math.cos(a) * r, Math.sin(a) * r * 0.6 - 0.5, -Math.random() * 90];
    };
    for (let i = 0; i < SN; i++) { const q = rnd(); this.sSeed.set(q, i * 3); }
    this._rnd = rnd;
    const sgm = new THREE.BufferGeometry(); sgm.setAttribute('position', new THREE.BufferAttribute(this.sPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.streaks = new THREE.LineSegments(sgm, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.streaks.frustumCulled = false;

    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._sc = new THREE.Vector3(1, 1, 1);
    this._s = {}; this.envBase = 1;
  }
  attachCamera(cam) { cam.add(this.streaks); this.scene.add(this.rain, cam); this.cam = cam; }
  setStyle(key, rm) {
    const st = this.style = STY[key] || STY.city; this.styleKey = key;
    this.treeMat.color.set(st.tree); rm.groundMat.color.set(st.ground); rm.neonMesh.visible = st.neon;
    this.bMat.map = this.bMat.emissiveMap = st.crowd ? this.crowdTex : this.winTex; this.bMat.needsUpdate = true;
    if (st.gantry != null) this.gantry.material.color.set(st.gantry);
  }
  setTheme(key, roadMat, scene) {
    const t = THEMES[key]; this.theme = key; this.t = t;
    this.skyU.top.value.set(t.top); this.skyU.hor.value.set(t.hor); this.skyU.sunCol.value.set(t.sunCol);
    this.skyU.sunDir.value.set(key === 'sunset' ? 0.3 : -0.4, key === 'sunset' ? 0.08 : 0.45, 0.8).normalize();
    scene.fog.color.set(t.fog); if (this.farMat) this.farMat.color.set(t.fog); scene.fog.near = t.near; scene.fog.far = t.far;
    this.hemi.intensity = t.hemi; this.hemi.color.set(key === 'night' ? 0x7788bb : 0xffffff); this.hemi.groundColor.set(key === 'night' ? 0x101820 : 0x556644);
    this.sun.intensity = t.sun; this.sun.color.set(t.sunCol);
    this.bMat.emissiveIntensity = t.win * (this.style && this.style.neon ? 1.6 : 1) + (this.style && this.style.crowd ? 0.35 : 0); this.bMat.color.set(t.win > 0.5 ? 0x6f7a8a : 0xffffff);
    this.lampPts.material.opacity = t.lamp;
    this.stars.material.opacity = t.stars;
    this.rain.visible = t.rain; roadMat.roughness = t.rough;
    roadMat.metalness = key === 'rain' ? 0.35 : 0.0;
    scene.environmentIntensity = t.env;
    this.rain.material.opacity = 0.4;
  }
  update(s, camPos, speed, dt, time) {
    const road = this.road, m = this._m, q = this._q, v = this._v, sc = this._sc;
    this.sky.position.copy(camPos); this.stars.position.copy(camPos);
    // buildings
    const st = this.style, SP = st.crowd ? 60 : 38, j0 = Math.floor((s - 120) / SP), j1 = Math.ceil((s + 880) / SP);
    this.bTypes.forEach((b) => { b.n = 0; });
    let tn = 0; const eul = new THREE.Euler();
    for (let j = j0; j <= j1; j++) {
      for (const side of [-1, 1]) {
        const hh = hash(j * 3.17 + side * 91.3), h2 = hash(j * 7.7 + side * 13.1), h3 = hash(j * 1.9 + side * 5.5);
        const ss = j * SP + h2 * 14, off = st.near[0] + h3 * st.near[1]; let lat = side > 0 ? WALL_R + off : WALL_L - off;
        const p = road.sample(ss, this._s);
        const rx = -Math.cos(p.th), rz = Math.sin(p.th);
        if (hh > st.bProb) { // trees instead of a building
          for (let k = 0; k < st.treeN && tn < 358; k++) {
            const l2 = (side > 0 ? WALL_R + 6 : WALL_L - 6) + side * (h3 * 26 + k * 6 + hash(j + k * 3) * 6);
            const sk = ss + (k - 1.5) * 9;
            const pp = road.sample(sk, this._s);
            v.set(pp.x - Math.cos(pp.th) * l2, pp.y - 0.4, pp.z + Math.sin(pp.th) * l2);
            const sca = 0.8 + hash(j + k) * 0.9; sc.set(sca, sca * (st.treeN > 3 ? 1.4 : 1), sca);
            q.identity(); m.compose(v, q, sc); this.trees.setMatrixAt(tn++, m);
          }
          continue;
        }
        const ti = Math.floor(hh / Math.max(0.01, st.bProb) * this.bTypes.length) % this.bTypes.length, bt = this.bTypes[ti];
        if (bt.n >= 70) continue;
        eul.set(0, p.th, 0); q.setFromEuler(eul); sc.set(st.bs[0], st.bs[1] * (0.7 + h3 * 0.6), st.bs[2]);
        lat += side * (bt.w / 2) * sc.x;
        v.set(p.x + rx * lat, p.y - 0.3 + bt.h * sc.y / 2, p.z + rz * lat);
        m.compose(v, q, sc); bt.mesh.setMatrixAt(bt.n++, m);
      }
    }
    this.bTypes.forEach((b) => { b.mesh.count = b.n; b.mesh.instanceMatrix.needsUpdate = true; });
    this.trees.count = tn; this.trees.instanceMatrix.needsUpdate = true;
    // lamps
    const LS = 42, l0 = Math.floor((s - 80) / LS), l1 = Math.ceil((s + 700) / LS); let ln = 0;
    const lp = this.lampGeo.attributes.position.array;
    for (let l = l0; l <= l1 && ln < 30; l++) {
      for (const lat of [WALL_L - 1.2, WALL_R + 1.2]) {
        const p = road.sample(l * LS, this._s); const rx = -Math.cos(p.th), rz = Math.sin(p.th);
        v.set(p.x + rx * lat, p.y - 0.2, p.z + rz * lat);
        eul.set(0, p.th, 0); q.setFromEuler(eul); sc.set(1, 1, 1); m.compose(v, q, sc); this.lampPole.setMatrixAt(ln, m);
        lp[ln * 3] = v.x - rx * (lat < 0 ? -1.2 : 1.2) * 0; lp[ln * 3 + 1] = v.y + 9.1; lp[ln * 3 + 2] = v.z; ln++;
      }
    }
    this.lampPole.count = ln; this.lampPole.instanceMatrix.needsUpdate = true;
    this.lampGeo.setDrawRange(0, ln); this.lampGeo.attributes.position.needsUpdate = true;

    // neon signs / gantries
    let sn = 0, gn = 0;
    if (st.signs) {
      const sk0 = Math.floor((s - 80) / 90);
      for (let k = sk0; k < sk0 + 11 && sn < 40; k++) {
        if (hash(k * 5.3) < 0.35) continue; const side = hash(k * 2.2) < 0.5 ? -1 : 1; const lat = side > 0 ? WALL_R + 14 : WALL_L - 14;
        const p = road.sample(k * 90, this._s);
        v.set(p.x - Math.cos(p.th) * lat, p.y + 1.5, p.z + Math.sin(p.th) * lat);
        eul.set(0, p.th + (side > 0 ? Math.PI / 2 : -Math.PI / 2), 0); q.setFromEuler(eul); sc.set(1, 1, 1); m.compose(v, q, sc); this.signs.setMatrixAt(sn++, m);
      }
    }
    if (st.gantry != null) {
      const g0 = Math.floor((s - 60) / 170);
      for (let k = g0; k < g0 + 7 && gn < 12; k++) {
        const p = road.sample(k * 170, this._s); v.set(p.x - Math.cos(p.th) * 2, p.y, p.z + Math.sin(p.th) * 2);
        eul.set(0, p.th, 0); q.setFromEuler(eul); sc.set(1, 1, 1); m.compose(v, q, sc); this.gantry.setMatrixAt(gn++, m);
      }
    }
    this.signs.count = sn; this.signs.instanceMatrix.needsUpdate = true; this.gantry.count = gn; this.gantry.instanceMatrix.needsUpdate = true;
    // speed streaks (camera space)
    const sp = this.sPos, ss = this.sSeed; const k = clamp((speed - 28) / 55, 0, 1);
    this.streaks.material.opacity = k * 0.5;
    if (k > 0.01) {
      const len = 0.5 + speed * 0.09;
      for (let i = 0; i < this.speedN; i++) {
        ss[i * 3 + 2] += speed * dt;
        if (ss[i * 3 + 2] > 6) { const r = this._rnd(); ss[i * 3] = r[0]; ss[i * 3 + 1] = r[1]; ss[i * 3 + 2] = -60 - Math.random() * 40; }
        sp[i * 6] = ss[i * 3]; sp[i * 6 + 1] = ss[i * 3 + 1]; sp[i * 6 + 2] = ss[i * 3 + 2];
        sp[i * 6 + 3] = ss[i * 3]; sp[i * 6 + 4] = ss[i * 3 + 1]; sp[i * 6 + 5] = ss[i * 3 + 2] - len;
      }
      this.streaks.geometry.attributes.position.needsUpdate = true;
    }
    // rain
    if (this.rain.visible) {
      const rp = this.rainPos, rs = this.rainSeed;
      for (let i = 0; i < this.rainN; i++) {
        rs[i * 3 + 1] -= (28 + (i % 7)) * dt;
        if (rs[i * 3 + 1] < -2) rs[i * 3 + 1] = 26;
        const x = rs[i * 3], y = rs[i * 3 + 1], z = rs[i * 3 + 2];
        rp[i * 6] = x; rp[i * 6 + 1] = y; rp[i * 6 + 2] = z;
        rp[i * 6 + 3] = x; rp[i * 6 + 4] = y + 1.1; rp[i * 6 + 5] = z - 0.15;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
      this.rain.position.copy(camPos); this.rain.quaternion.copy(this.cam.quaternion);
    }
    void time;
  }
}
