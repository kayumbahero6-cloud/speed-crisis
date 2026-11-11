import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

/*
 * Optional real assets.  Drop files into /assets and run `node tools/build-manifest.mjs`
 * (see assets/README.md).  Anything not present falls back to the built-in procedural art.
 */
export const assets = { manifest: { base: '', cars: {}, sky: {}, props: {} }, ready: null, status: { cars: 0, sky: 0, props: 0 } };

let gltf = null;
function loader() {
  if (gltf) return gltf;
  const d = new DRACOLoader(); d.setDecoderPath('js/draco/');
  gltf = new GLTFLoader(); gltf.setDRACOLoader(d); gltf.setMeshoptDecoder(MeshoptDecoder);
  return gltf;
}
const url = (p) => (/^https?:/.test(p) ? p : (assets.manifest.base || 'assets/') + p);

export function initAssets() {
  assets.ready = fetch('assets/manifest.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((m) => {
    if (m) { assets.manifest = Object.assign({ base: '', cars: {}, sky: {}, props: {} }, m); }
    const mm = assets.manifest; assets.status = { cars: Object.keys(mm.cars || {}).length, sky: Object.keys(mm.sky || {}).length, props: Object.keys(mm.props || {}).length };
  }).catch(() => {});
  return assets.ready;
}
export const hasModel = (id) => !!(assets.manifest.cars && assets.manifest.cars[id]);

const glbCache = {};
function loadGLB(path) {
  if (!glbCache[path]) glbCache[path] = new Promise((res, rej) => loader().load(url(path), res, undefined, rej));
  return glbCache[path];
}

/** Replace a CarVisual's procedural body with the real model (if one was supplied for this car). */
export async function attachCarModel(vis, def) {
  await assets.ready; const path = assets.manifest.cars && assets.manifest.cars[def.id];
  if (!path || vis.modelTried) return false; vis.modelTried = true;
  let g; try { g = await loadGLB(path); } catch (e) { console.warn('model failed', def.id, e); return false; }
  if (vis.disposed) return false;
  const m = g.scene.clone(true);
  const pivot = new THREE.Group(); pivot.add(m);
  m.updateMatrixWorld(true); let box = new THREE.Box3().setFromObject(m); let size = box.getSize(new THREE.Vector3());
  if (size.x > size.z * 1.15) { m.rotation.y = Math.PI / 2; m.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(m); size = box.getSize(new THREE.Vector3()); }
  const k = def.sh.L / size.z; m.scale.multiplyScalar(k); m.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(m); const c = box.getCenter(new THREE.Vector3());
  m.position.set(-c.x, -box.min.y, -c.z);
  const own = new Set(vis.flames || []); if (vis.barR) { own.add(vis.barR); own.add(vis.barB); }
  vis.root.children.forEach((ch) => { if (!own.has(ch)) ch.visible = false; });
  vis.modelMats = [];
  m.traverse((o) => {
    if (!o.isMesh) return; o.frustumCulled = true;
    const fix = (mt) => {
      const mat = mt.clone(); if (/paint|body|carpaint|exterior|shell/i.test(mt.name)) { vis.modelMats.push(mat); if (!vis.cop) mat.color.set(vis.paintMat.color); }
      if (mat.envMapIntensity !== undefined) mat.envMapIntensity = 1.1; return mat;
    };
    o.material = Array.isArray(o.material) ? o.material.map(fix) : fix(o.material);
  });
  vis.root.add(pivot); vis.model = pivot; vis.spin = null;
  return true;
}

/** Equirectangular sky / HDRI for a track (by track id, then style, then "default"). */
export async function loadSky(trackId, style) {
  await assets.ready; const S = assets.manifest.sky || {};
  const p = S[trackId] || S[style] || S.default; if (!p) return null;
  try {
    const u = url(p);
    const tex = await new Promise((res, rej) => {
      if (/\.hdr$/i.test(p)) new RGBELoader().load(u, res, undefined, rej);
      else new THREE.TextureLoader().load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, rej);
    });
    tex.mapping = THREE.EquirectangularReflectionMapping; return tex;
  } catch (e) { console.warn('sky failed', p, e); return null; }
}

/** Roadside props: a pool of cloned models re-placed along the road as you drive. */
export class PropField {
  constructor(scene, road) { this.scene = scene; this.road = road; this.pool = []; this.group = new THREE.Group(); scene.add(this.group); this.spacing = 70; this._s = {}; }
  async setup(trackId, style) {
    this.clear(); await assets.ready; const P = assets.manifest.props || {};
    const list = P[trackId] || P[style]; const files = list && (Array.isArray(list) ? list : list.files); if (!files || !files.length) return 0; this.spacing = (list && list.spacing) || 70; this.offset = (list && list.offset) || 18;
    const gs = (await Promise.all(files.map((f) => loadGLB(f).catch(() => null)))).filter(Boolean);
    if (!gs.length) return 0;
    for (let i = 0; i < 36; i++) { const o = gs[i % gs.length].scene.clone(true); o.visible = false; this.group.add(o); this.pool.push(o); }
    return this.pool.length;
  }
  clear() { this.pool.forEach((o) => this.group.remove(o)); this.pool = []; }
  update(s) {
    if (!this.pool.length) return;
    const sp = this.spacing, j0 = Math.floor((s - 80) / sp); let n = 0;
    for (let j = j0; n < this.pool.length; j++) for (const side of [-1, 1]) {
      if (n >= this.pool.length) break; const o = this.pool[n++];
      const p = this.road.sample(j * sp, this._s), lat = side > 0 ? 13.2 + this.offset : -9.2 - this.offset;
      o.position.set(p.x - Math.cos(p.th) * lat, p.y - 0.3, p.z + Math.sin(p.th) * lat);
      o.rotation.y = p.th + (side > 0 ? Math.PI / 2 : -Math.PI / 2); o.visible = true;
    }
  }
}
