import * as THREE from 'three';
import { clamp, smooth } from './util.js';

/*
 * Road model.  The road is an endless curving, hilly centre line.
 * Everything in the game lives in "road coordinates":
 *   s   = distance along the road (m)
 *   lat = sideways offset from the double-yellow centre line (m)
 *         +lat = right-hand side (our direction), -lat = oncoming side
 * Heading theta: forward vector = (sin t, cos t) in (x,z); right = (-cos t, sin t).
 * Positive curvature = left turn.
 */
export const LANE_W = 3.7;
export const OUR_LANES = [2.45, 6.15, 9.85];
export const ONC_LANES = [-2.45, -6.15];
export const ROAD_L = -9.2;
export const ROAD_R = 13.2;
export const WALL_L = -8.9;
export const WALL_R = 12.9;
const DS = 2;

export const PARAMS = { ph: [0.7, 2.1, 4.0, 1.0, 0.3], k: 1, h: 1, wl: 1, oval: false };
function kappaAt(s) {
  const P = PARAMS, ramp = smooth((s - 250) / 500);
  if (P.oval) return (0.0027 + 0.0005 * Math.sin(s / 420 + P.ph[0])) * ramp;
  const a = Math.sin(s / (310 * P.wl) + P.ph[0]) * 0.0036;
  const b = Math.sin(s / (131 * P.wl) + P.ph[1]) * 0.0023;
  const c = Math.sin(s / (760 * P.wl) + P.ph[2]) * 0.0044;
  const env = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(s / 1900 + P.ph[3]));
  return (a + b + c) * (0.6 + env) * P.k * ramp;
}
function heightAt(s) {
  const P = PARAMS, k = smooth((s - 150) / 600) * P.h;
  return k * (9 * Math.sin(s / 540 + P.ph[4]) + 4 * Math.sin(s / 231 + P.ph[1]) + 1.6 * Math.sin(s / 97));
}

export class Road {
  constructor() { this._tmp = {}; this.configure(null); }
  configure(params) {
    Object.assign(PARAMS, params || { ph: [0.7, 2.1, 4.0, 1.0, 0.3], k: 1, h: 1, wl: 1, oval: false });
    this.x = [0]; this.z = [0]; this.th = [0]; this.k = [kappaAt(0)]; this.y = [heightAt(0)];
    this.ensure(400);
  }
  ensure(i) {
    while (this.x.length <= i) {
      const n = this.x.length;
      const s = (n - 1) * DS;
      const k = kappaAt(s + DS / 2);
      const thMid = this.th[n - 1] + k * DS / 2;
      this.x.push(this.x[n - 1] + Math.sin(thMid) * DS);
      this.z.push(this.z[n - 1] + Math.cos(thMid) * DS);
      this.th.push(this.th[n - 1] + k * DS);
      this.k.push(kappaAt(n * DS));
      this.y.push(heightAt(n * DS));
    }
  }
  /** fills out = {x,y,z,th,k,slope} */
  sample(s, out) {
    out = out || {};
    s = Math.max(0, s);
    const f = s / DS, i = Math.floor(f), t = f - i;
    this.ensure(i + 3);
    out.x = this.x[i] + (this.x[i + 1] - this.x[i]) * t;
    out.z = this.z[i] + (this.z[i + 1] - this.z[i]) * t;
    out.y = this.y[i] + (this.y[i + 1] - this.y[i]) * t;
    out.th = this.th[i] + (this.th[i + 1] - this.th[i]) * t;
    out.k = this.k[i] + (this.k[i + 1] - this.k[i]) * t;
    out.slope = (this.y[i + 1] - this.y[i]) / DS;
    return out;
  }
  /** world position for road coords */
  pos(s, lat, up, out) {
    const p = this.sample(s, this._tmp);
    out = out || new THREE.Vector3();
    out.set(p.x - Math.cos(p.th) * lat, p.y + (up || 0), p.z + Math.sin(p.th) * lat);
    return out;
  }
}

/* A ribbon is a set of strips that follow the road; vertices are re-laid every frame. */
export class Ribbon {
  /**
   * strips: [{pts:[{lat, up, u, nu, nr}...]}], rows along s
   */
  constructor(road, strips, rows, step, material, vRepeat = 12) {
    this.road = road; this.strips = strips; this.rows = rows; this.step = step; this.vRepeat = vRepeat;
    let ptsTotal = 0; strips.forEach((s) => { ptsTotal += s.pts.length; });
    this.ptsTotal = ptsTotal;
    const vcount = rows * ptsTotal;
    this.pos = new Float32Array(vcount * 3);
    this.nor = new Float32Array(vcount * 3);
    this.uv = new Float32Array(vcount * 2);
    const idx = [];
    let base = 0;
    strips.forEach((st) => {
      const n = st.pts.length;
      for (let r = 0; r < rows - 1; r++) {
        for (let j = 0; j < n - 1; j++) {
          const a = r * ptsTotal + base + j, b = a + 1, c = a + ptsTotal, d = c + 1;
          idx.push(a, b, c, b, d, c);
        }
      }
      base += n;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(this.uv, 2).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.geo = g;
    this.mesh = new THREE.Mesh(g, material);
    this.mesh.frustumCulled = false;
    this._s = {};
  }
  update(sStart) {
    const step = this.step;
    const s0 = Math.floor(sStart / step) * step;
    const P = this.pos, N = this.nor, U = this.uv;
    for (let r = 0; r < this.rows; r++) {
      const s = Math.max(0, s0 + r * step);
      const p = this.road.sample(s, this._s);
      const rx = -Math.cos(p.th), rz = Math.sin(p.th);
      let col = 0;
      for (const st of this.strips) {
        for (const pt of st.pts) {
          const vi = r * this.ptsTotal + col;
          P[vi * 3] = p.x + rx * pt.lat;
          P[vi * 3 + 1] = p.y + pt.up;
          P[vi * 3 + 2] = p.z + rz * pt.lat;
          N[vi * 3] = rx * (pt.nr || 0);
          N[vi * 3 + 1] = pt.nu === undefined ? 1 : pt.nu;
          N[vi * 3 + 2] = rz * (pt.nr || 0);
          U[vi * 2] = pt.u;
          U[vi * 2 + 1] = (pt.vmul === undefined ? 1 : pt.vmul) * s / this.vRepeat;
          col++;
        }
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.normal.needsUpdate = true;
    this.geo.attributes.uv.needsUpdate = true;
  }
}

/* ---------- procedural textures ---------- */
export function makeRoadTexture(renderer) {
  const W = 1024, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#3b3e44'; g.fillRect(0, 0, W, H);
  // asphalt grain
  const id = g.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n;
  }
  g.putImageData(id, 0, 0);
  // darker worn tyre tracks per lane
  const total = ROAD_R - ROAD_L, px = (lat) => ((lat - ROAD_L) / total) * W;
  const lanes = [...OUR_LANES, ...ONC_LANES];
  g.globalAlpha = 0.16; g.fillStyle = '#111';
  lanes.forEach((l) => { g.fillRect(px(l - 1.0) - 14, 0, 28, H); g.fillRect(px(l + 1.0) - 14, 0, 28, H); });
  g.globalAlpha = 1;
  const line = (lat, w, col, dash) => {
    g.fillStyle = col;
    if (!dash) g.fillRect(px(lat) - (w / total) * W / 2, 0, (w / total) * W, H);
    else g.fillRect(px(lat) - (w / total) * W / 2, 0, (w / total) * W, H * dash);
  };
  line(ROAD_L + 1.2, 0.2, '#e9e9e9');          // left edge
  line(ROAD_R - 1.5, 0.2, '#e9e9e9');          // right edge
  line(-0.18, 0.12, '#f1b81a'); line(0.18, 0.12, '#f1b81a'); // double yellow
  const dl = LANE_W;
  line(2.45 + dl / 2, 0.14, '#e9e9e9', 0.33);
  line(6.15 + dl / 2, 0.14, '#e9e9e9', 0.33);
  line(-2.45 - dl / 2, 0.14, '#e9e9e9', 0.33);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
export function makeGroundTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#6f7a55'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const v = 90 + Math.random() * 70;
    g.fillStyle = `rgba(${v * 0.85},${v},${v * 0.55},0.5)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function makeBarrierTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#b9bcc0'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#8f9399'; g.fillRect(0, 22, 256, 6); g.fillRect(0, 44, 256, 6);
  g.fillStyle = '#777b80';
  for (let i = 0; i < 4; i++) g.fillRect(i * 64 + 30, 0, 5, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildRoadMeshes(road, renderer) {
  const group = new THREE.Group();
  const rows = 260, step = 4; // 1040 m of road, re-laid each frame
  const roadTex = makeRoadTexture(renderer);
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.82, metalness: 0.0 });
  const roadRib = new Ribbon(road, [{ pts: [{ lat: ROAD_L, up: 0, u: 0 }, { lat: ROAD_R, up: 0, u: 1 }] }], rows, step, roadMat, 12);
  group.add(roadRib.mesh);

  const gt = makeGroundTexture();
  const gMat = new THREE.MeshLambertMaterial({ map: gt });
  const gStrips = [
    { pts: [{ lat: -260, up: -40, u: -13 }, { lat: -130, up: -0.6, u: -6.5 }, { lat: -40, up: -0.4, u: -2 }, { lat: ROAD_L, up: -0.25, u: -0.46 }] },
    { pts: [{ lat: ROAD_R, up: -0.25, u: 0.66 }, { lat: 40, up: -0.4, u: 2 }, { lat: 130, up: -0.6, u: 6.5 }, { lat: 260, up: -40, u: 13 }] },
  ];
  gStrips.forEach((st) => st.pts.forEach((p) => { p.vmul = 0.6; }));
  const groundRib = new Ribbon(road, gStrips, rows / 2, step * 2, gMat, 12);
  const farMat = new THREE.MeshBasicMaterial({ color: 0x889988 });
  const far = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), farMat); far.position.y = -60; far.frustumCulled = false; group.add(far);
  group.add(groundRib.mesh);

  const bt = makeBarrierTexture();
  const bMat = new THREE.MeshLambertMaterial({ map: bt, side: THREE.DoubleSide });
  const barrier = (lat, dir) => ({
    pts: [
      { lat: lat, up: -0.2, u: 0, nu: 0, nr: dir },
      { lat: lat, up: 0.95, u: 1, nu: 0, nr: dir },
      { lat: lat - dir * 0.0, up: 0.95, u: 1, nu: 1, nr: 0 },
    ]
  });
  const rails = new Ribbon(road, [
    { pts: [{ lat: WALL_L - 0.3, up: -0.2, u: 0, nu: 0, nr: 1 }, { lat: WALL_L - 0.3, up: 0.95, u: 1, nu: 0, nr: 1 }] },
    { pts: [{ lat: WALL_R + 0.3, up: -0.2, u: 0, nu: 0, nr: -1 }, { lat: WALL_R + 0.3, up: 0.95, u: 1, nu: 0, nr: -1 }] },
  ], rows, step, bMat, 8);
  group.add(rails.mesh);
  void barrier;
  const nc = document.createElement('canvas'); nc.width = 256; nc.height = 8; const ng = nc.getContext('2d');
  const grd = ng.createLinearGradient(0, 0, 256, 0); grd.addColorStop(0, '#00e5ff'); grd.addColorStop(0.5, '#b56bff'); grd.addColorStop(1, '#ff3d9e');
  ng.fillStyle = grd; ng.fillRect(0, 0, 256, 8);
  const nt = new THREE.CanvasTexture(nc); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.colorSpace = THREE.SRGBColorSpace;
  const neon = new Ribbon(road, [
    { pts: [{ lat: WALL_L - 0.25, up: 0.62, u: 0 }, { lat: WALL_L - 0.25, up: 0.82, u: 1 }] },
    { pts: [{ lat: WALL_R + 0.25, up: 0.62, u: 0 }, { lat: WALL_R + 0.25, up: 0.82, u: 1 }] },
  ], rows, step, new THREE.MeshBasicMaterial({ map: nt, side: THREE.DoubleSide, fog: false }), 40);
  neon.mesh.visible = false; group.add(neon.mesh);
  return {
    group, roadMat, farMat, far, barMat: bMat, groundMat: gMat, neonMesh: neon.mesh, update(s, cx, cz) {
      far.position.x = cx; far.position.z = cz;
      const s0 = s - 60;
      roadRib.update(s0); rails.update(s0); groundRib.update(s - 100); if (neon.mesh.visible) neon.update(s0);
    }
  };
}
export { clamp };
