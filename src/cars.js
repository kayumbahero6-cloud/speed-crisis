import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CAR_LIST } from './catalog.js';
import { hash } from './util.js';

/* ---------------------------------------------------------------
 * Garage catalogue.  All names are original (Rwandan place names).
 * top = km/h, acc = m/s^2 launch, hnd = grip multiplier, nit = nitro strength
 * Shape params are in metres, profile x runs along the car (+ = front).
 * --------------------------------------------------------------- */
export const TPL = [
  { id: 'huye', name: 'Huye Hatch', cls: 'Compact', price: 0, top: 175, acc: 6.2, hnd: 0.95, brk: 24, nit: 0.8, paint: '#e8b923',
    sh: { L: 3.95, W: 1.72, r: 0.2, noseH: 0.55, hoodY: 0.8, beltY: 0.93, trunkY: 1.2, tailH: 1.05, cf: 0.85, rfx: 0.25, rrx: -1.5, cr: -1.75, roofY: 1.5, wr: 0.31, wb: 2.4, sp: 'none' } },
  { id: 'kigali', name: 'Kigali Sedan', cls: 'Sedan', price: 18000, top: 195, acc: 6.8, hnd: 0.98, brk: 25, nit: 0.85, paint: '#2e6ec9',
    sh: { L: 4.7, W: 1.82, r: 0.22, noseH: 0.55, hoodY: 0.78, beltY: 0.93, trunkY: 0.95, tailH: 0.88, cf: 0.9, rfx: 0.15, rrx: -1.05, cr: -1.6, roofY: 1.42, wr: 0.33, wb: 2.75, sp: 'none' } },
  { id: 'nyungwe', name: 'Nyungwe SUV', cls: 'SUV', price: 32000, top: 190, acc: 6.6, hnd: 0.9, brk: 24, nit: 0.85, paint: '#2f7d4f',
    sh: { L: 4.75, W: 1.95, r: 0.38, noseH: 0.85, hoodY: 1.05, beltY: 1.18, trunkY: 1.2, tailH: 1.15, cf: 0.95, rfx: 0.35, rrx: -1.9, cr: -2.1, roofY: 1.82, wr: 0.4, wb: 2.85, sp: 'none' } },
  { id: 'rubavu', name: 'Rubavu Coupe', cls: 'Coupe', price: 45000, top: 235, acc: 8.0, hnd: 1.08, brk: 27, nit: 0.95, paint: '#d6342b',
    sh: { L: 4.5, W: 1.85, r: 0.2, noseH: 0.5, hoodY: 0.72, beltY: 0.88, trunkY: 0.92, tailH: 0.82, cf: 0.6, rfx: -0.2, rrx: -1.0, cr: -1.7, roofY: 1.3, wr: 0.33, wb: 2.65, sp: 'lip' } },
  { id: 'akagera', name: 'Akagera Pickup', cls: 'Truck', price: 55000, top: 200, acc: 6.9, hnd: 0.88, brk: 24, nit: 0.9, paint: '#c97d2e',
    sh: { L: 5.3, W: 1.95, r: 0.35, noseH: 0.85, hoodY: 1.05, beltY: 1.15, trunkY: 1.1, tailH: 1.08, cf: 1.25, rfx: 0.8, rrx: -0.15, cr: -0.35, roofY: 1.75, wr: 0.42, wb: 3.2, sp: 'bed' } },
  { id: 'musanze', name: 'Musanze Muscle', cls: 'Muscle', price: 60000, top: 250, acc: 9.2, hnd: 0.95, brk: 26, nit: 1.0, paint: '#17171a',
    sh: { L: 4.95, W: 1.95, r: 0.22, noseH: 0.62, hoodY: 0.85, beltY: 0.97, trunkY: 1.0, tailH: 0.92, cf: 0.55, rfx: -0.1, rrx: -0.95, cr: -1.55, roofY: 1.38, wr: 0.35, wb: 2.9, sp: 'lip' } },
  { id: 'nyamirambo', name: 'Nyamirambo Turbo', cls: 'Hot Hatch', price: 38000, top: 220, acc: 8.4, hnd: 1.15, brk: 27, nit: 1.0, paint: '#7a3fd0',
    sh: { L: 4.05, W: 1.78, r: 0.18, noseH: 0.54, hoodY: 0.78, beltY: 0.92, trunkY: 1.18, tailH: 1.05, cf: 0.85, rfx: 0.2, rrx: -1.55, cr: -1.8, roofY: 1.42, wr: 0.33, wb: 2.45, sp: 'wing' } },
  { id: 'virunga', name: 'Virunga RS', cls: 'Sport Sedan', price: 95000, top: 275, acc: 9.8, hnd: 1.12, brk: 29, nit: 1.05, paint: '#3fb6a8',
    sh: { L: 4.75, W: 1.9, r: 0.2, noseH: 0.55, hoodY: 0.78, beltY: 0.93, trunkY: 0.98, tailH: 0.9, cf: 0.95, rfx: 0.2, rrx: -1.0, cr: -1.65, roofY: 1.4, wr: 0.34, wb: 2.85, sp: 'lip' } },
  { id: 'kivu', name: 'Kivu GT', cls: 'Grand Tourer', price: 140000, top: 285, acc: 10.0, hnd: 1.12, brk: 29, nit: 1.05, paint: '#e5e5ea',
    sh: { L: 4.85, W: 1.94, r: 0.17, noseH: 0.5, hoodY: 0.72, beltY: 0.88, trunkY: 0.92, tailH: 0.84, cf: 0.85, rfx: 0.1, rrx: -1.0, cr: -1.85, roofY: 1.27, wr: 0.34, wb: 2.85, sp: 'lip' } },
  { id: 'ikaze', name: 'Ikaze EV', cls: 'Electric', price: 120000, top: 270, acc: 12.0, hnd: 1.14, brk: 30, nit: 1.0, paint: '#9bd2ff',
    sh: { L: 4.8, W: 1.9, r: 0.2, noseH: 0.5, hoodY: 0.7, beltY: 0.9, trunkY: 0.95, tailH: 0.86, cf: 0.85, rfx: 0.0, rrx: -1.2, cr: -1.95, roofY: 1.38, wr: 0.35, wb: 2.9, sp: 'none', ev: true } },
  { id: 'karisimbi', name: 'Karisimbi Supercar', cls: 'Supercar', price: 480000, top: 330, acc: 12.5, hnd: 1.22, brk: 32, nit: 1.15, paint: '#ff7a00',
    sh: { L: 4.5, W: 2.0, r: 0.14, noseH: 0.38, hoodY: 0.6, beltY: 0.8, trunkY: 0.88, tailH: 0.75, cf: 0.95, rfx: 0.0, rrx: -0.9, cr: -1.6, roofY: 1.12, wr: 0.35, wb: 2.7, sp: 'wing' } },
  { id: 'nyiragongo', name: 'Nyiragongo Hypercar', cls: 'Hypercar', price: 1200000, top: 390, acc: 14.5, hnd: 1.3, brk: 35, nit: 1.3, paint: '#c8ff2e',
    sh: { L: 4.7, W: 2.05, r: 0.12, noseH: 0.34, hoodY: 0.55, beltY: 0.75, trunkY: 0.85, tailH: 0.7, cf: 1.0, rfx: 0.1, rrx: -0.8, cr: -1.7, roofY: 1.06, wr: 0.36, wb: 2.8, sp: 'bigwing' } },
];



/* ---------------- catalogue built from the user's list ---------------- */
const has = (n, arr) => arr.some((k) => n.includes(k));
const HYPER5 = ['bugatti', 'koenigsegg', 'rimac', 'valkyrie', 'veneno', 'sian', 'speedtail', 'sf90', 'naran', 'devel', 'fenyr', 'tushek', 'one-77', 'mclaren f1', 'sabre'];
const HYPER = ['pagani', 'zonda', 'centenario', 'essenza', 'sesto', 'j50', 'monza', 'victor', 'mc12', 'covini', 'ascari', 'isdera', 'joss', 'lister', 'elva', 'f40', 'xjr-15', 'gt1', 'panoz', 'gt90', 'arrera', 'spyker', 'elfin', 'f12tdf', 'chiron'];
const SUPER = ['348', '430', '599', '512', 'gt2 rs', 'gt3 rs', 'evora', 'mc stradale', 'gt8', 'gt430', 'exige', 'elise'];
const MUSCLE = ['camaro', 'mustang', 'falcon', 'corvette', 'viper', 'callaway'];
const HOTH = ['abarth', 'clio', 'gr yaris', 'i30', 'astra', 'corrado', 'pulsar', 'integra', 'fulvia', 'mega track'];
const SEDAN = ['m3', 'm5', 'c63', 'wrx', 'is f', 's60', 'saab', 'clk', 'ccs-r'];
const GT = ['sl 65', 'granturismo', 'xkr', 'mangusta', 'bristol', 'islero'];
const WING = ['gt3', 'gt2', 'type r', 'sti', 'black series', 'cup', 'gts', 'scuderia', 'tdf', 'cinque', 'gt1', 'xx', 'one:1', 'divo', 'veneno', 'valkyrie', 'sian'];
const CLS = ['Compact', 'Sedan', 'SUV', 'Coupe', 'Truck', 'Muscle', 'Hot Hatch', 'Sport Sedan', 'Grand Tourer', 'Electric', 'Supercar', 'Hypercar'];
const BRAND_COL = [['ferrari', '#d6001c'], ['lamborghini', '#f5c400'], ['mclaren', '#ff7a00'], ['bugatti', '#1d3b8f'], ['aston', '#0f5a3c'], ['koenigsegg', '#e9eef2'], ['lotus', '#e0c000'], ['pagani', '#9aa3ad'], ['subaru', '#1f56c4'], ['mazda', '#b3162b'], ['porsche', '#c9ced6'], ['mercedes', '#2b2d31'], ['bmw', '#3b6ed0'], ['nissan', '#c9ced6'], ['ford', '#1f56c4'], ['chevrolet', '#d6a300'], ['dodge', '#7a0f0f'], ['toyota', '#d6342b'], ['honda', '#b3162b'], ['jaguar', '#14513b'], ['maserati', '#18305e'], ['lexus', '#6d28d9'], ['audi', '#8a8f98'], ['alfa', '#a31621']];
const PAL = ['#d6342b', '#2e6ec9', '#e8b923', '#2f7d4f', '#7a3fd0', '#3fb6a8', '#ff7a00', '#e5e5ea', '#17171a', '#ff4fa3', '#c8ff2e'];
function build(name, img, desc, i) {
  const n = name.toLowerCase(); let tpl = 3, tier = 2;
  if (has(n, HYPER5)) { tpl = 11; tier = 5; } else if (has(n, HYPER)) { tpl = 11; tier = 4; }
  else if (has(n, SUPER)) { tpl = 10; tier = 3; if (has(n, ['599', 'gt2 rs', 'gt3 rs', 'gt8'])) tier = 4; }
  else if (has(n, MUSCLE)) { tpl = 5; tier = 3; if (has(n, ['zr1', 'viper', 'sledgehammer'])) tier = 4; }
  else if (has(n, HOTH)) { tpl = 6; tier = 2; }
  else if (has(n, SEDAN)) { tpl = 7; tier = 3; if (has(n, ['black series', 'm5'])) tier = 4; }
  else if (has(n, GT)) { tpl = 8; tier = 3; }
  else if (has(n, ['caterham', 'autozam', 'aixam'])) { tpl = 0; tier = 1; }
  else if (has(n, ['rx-3', 'prelude', 'fiat', 'saab'])) tier = 1;
  if (name === 'Aixam Mega Track') tier = 1;
  const t = TPL[tpl]; const sh = { ...t.sh };
  if (has(n, WING) && sh.sp !== 'bigwing') sh.sp = 'wing';
  if (tpl === 3 && has(n, ['911', '968', 'gt2', 'gt3'])) { sh.cr = -1.45; sh.roofY = 1.3; }
  const h = hash(i * 3.3);
  const top = Math.round(150 + tier * 52 + (h - 0.5) * 24 + (tpl === 0 ? -20 : 0));
  const brand = BRAND_COL.find(([k]) => n.includes(k));
  const paint = brand ? brand[1] : PAL[i % PAL.length];
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id, name, cls: CLS[tpl], tier, price: Math.round((6000 * Math.pow(tier, 2.3) * (0.85 + h * 0.5)) / 1000) * 1000,
    top, acc: +(5.2 + tier * 1.9 + h).toFixed(1), hnd: +(0.9 + tier * 0.07 + h * 0.08).toFixed(2), brk: Math.round(23 + tier * 2.4), nit: +(0.8 + tier * 0.1).toFixed(2),
    paint, sh, geoId: 'tpl' + tpl, img, desc,
  };
}
/* Speedway stock cars: low, wide, flat-sided racing sedans (generic, unbranded) */
const STOCK_SH = { L: 5.0, W: 1.96, r: 0.2, noseH: 0.5, hoodY: 0.72, beltY: 0.86, trunkY: 0.9, tailH: 0.82, cf: 0.95, rfx: 0.35, rrx: -1.05, cr: -1.65, roofY: 1.27, wr: 0.36, wb: 2.95, sp: 'lip' };
const STOCK = [['Speedway Stock #45', '#14161a', 300], ['Speedway Stock #11', '#e8b923', 296], ['Speedway Stock #24', '#2e6ec9', 298], ['Speedway Stock #5', '#d6342b', 294], ['Speedway Stock #9', '#3fb6a8', 292]]
  .map(([name, paint, top], i) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''), name, cls: 'Stock Car', tier: 4, price: 0, top, acc: 10.5 + i * 0.1, hnd: 1.18, brk: 31, nit: 1.1, paint, sh: { ...STOCK_SH }, geoId: 'stock', img: null, desc: 'Speedway stock car' }));
export const CARS = CAR_LIST.map(([name, img, desc], i) => build(name, img, desc, i)).concat(STOCK).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
export const carById = (id) => CARS.find((c) => c.id === id) || CARS[0];
export const STARTER = 'honda-integra-type-r-dc2';

/* shapes for traffic only */
const TRAFFIC_TYPES = [
  { id: 't_sedan', sh: TPL[1].sh, w: 5 }, { id: 't_hatch', sh: TPL[0].sh, w: 4 }, { id: 't_suv', sh: TPL[2].sh, w: 3 },
  { id: 't_coupe', sh: TPL[3].sh, w: 1 }, { id: 't_pick', sh: TPL[4].sh, w: 2 },
  { id: 't_van', sh: { L: 5.0, W: 1.95, r: 0.34, noseH: 0.8, hoodY: 1.0, beltY: 1.2, trunkY: 1.3, tailH: 1.25, cf: 1.75, rfx: 1.45, rrx: -2.1, cr: -2.3, roofY: 2.0, wr: 0.38, wb: 3.1, sp: 'none' }, w: 2 },
];
const TRAFFIC_COLORS = ['#d9d9dc', '#f2f2f2', '#1b1b1d', '#6a6e75', '#9c2a2a', '#244a8a', '#3b6b4a', '#c4b28a', '#7b4a2a', '#e8e0c8'];

/* shared materials */
const M = {
  glass: new THREE.MeshStandardMaterial({ color: 0x1b2d42, metalness: 0.7, roughness: 0.12, envMapIntensity: 1.2 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.2, roughness: 0.7 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xcfd3d8, metalness: 1, roughness: 0.2 }),
  head: new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xfff2c4, emissiveIntensity: 0.6 }),
  tail: new THREE.MeshStandardMaterial({ color: 0x7a0000, emissive: 0xff1010, emissiveIntensity: 0.7 }),
  plate: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.5 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.9 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 1, roughness: 0.25 }),
  flame: new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
  red: new THREE.MeshBasicMaterial({ color: 0xff2020 }),
  blue: new THREE.MeshBasicMaterial({ color: 0x2060ff }),
};
export const SHARED = M;

function prism(pts, depth, bevel = 0.045) {
  const sh = new THREE.Shape();
  pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
  const bt = Math.min(0.05, depth * 0.1);
  const d = Math.max(0.01, depth - 2 * bt);
  const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: bt, bevelSize: bevel, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, -d / 2);
  g.rotateY(-Math.PI / 2);
  return g;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const at = (g, x, y, z) => { g.translate(x, y, z); return g.index ? g.toNonIndexed() : g; };
const soft = (g) => (g.index ? g.toNonIndexed() : g);

let _labelTex = null;
function policeTexture() {
  if (_labelTex) return _labelTex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('POLICE', 128, 34);
  _labelTex = new THREE.CanvasTexture(c); _labelTex.colorSpace = THREE.SRGBColorSpace;
  return _labelTex;
}

const geoCache = {};
/* builds {parts: {key: BufferGeometry}, dims, wheels: [positions]} */
function buildGeos(sh, id, cop) {
  const ck = id + '_' + sh.sp + (cop ? '_cop' : '');
  if (geoCache[ck]) return geoCache[ck];
  const hl = sh.L / 2, Wb = sh.W - 0.16;
  const parts = { paint: [], glass: [], trim: [], head: [], tail: [], chrome: [], plate: [], cop: [] };
  // lower body
  const body = [
    [-hl, sh.r], [hl, sh.r], [hl, sh.noseH], [hl - 0.38, sh.hoodY], [sh.cf, sh.beltY],
    [sh.cr, sh.trunkY], [-hl + 0.22, sh.trunkY], [-hl, sh.tailH],
  ];
  parts.paint.push(soft(prism(body, Wb)));
  // glass greenhouse
  const Wc = Wb * 0.84;
  const cab = [[sh.cf, sh.beltY - 0.02], [sh.rfx, sh.roofY - 0.04], [sh.rrx, sh.roofY - 0.04], [sh.cr, sh.trunkY - 0.02]];
  parts.glass.push(soft(prism(cab, Wc, 0.03)));
  // roof cap in paint colour
  const roof = [[sh.rfx + 0.02, sh.roofY - 0.06], [sh.rrx - 0.02, sh.roofY - 0.06], [sh.rrx - 0.02, sh.roofY + 0.0], [sh.rfx + 0.02, sh.roofY + 0.0]];
  parts.paint.push(soft(prism(roof, Wc + 0.02, 0.03)));
  // pillars (rear C-pillar chunk for style)
  const cp = [[sh.rrx + 0.05, sh.roofY - 0.05], [sh.rrx - 0.28, sh.roofY - 0.2], [sh.cr + 0.1, sh.trunkY]];
  void cp;
  // lower trim skirts + bumpers
  parts.trim.push(at(box(Wb + 0.02, 0.1, 0.16), 0, sh.r + 0.06, hl - 0.03));
  parts.trim.push(at(box(Wb + 0.02, 0.12, 0.16), 0, sh.r + 0.07, -hl + 0.03));
  parts.trim.push(at(box(Wb + 0.03, 0.06, sh.wb), 0, sh.r + 0.02, 0));
  // grille
  parts.trim.push(at(box(Wb * 0.5, 0.12, 0.05), 0, (sh.noseH + sh.hoodY) / 2 - 0.05, hl + 0.01));
  // headlights
  const hy = (sh.noseH + sh.hoodY) / 2 + 0.03;
  [-1, 1].forEach((sx) => {
    parts.head.push(at(box(0.42, 0.13, 0.08), sx * (Wb / 2 - 0.34), hy, hl - 0.06));
    parts.tail.push(at(box(Wb * 0.37, 0.11, 0.07), sx * (Wb / 2 - Wb * 0.2), sh.tailH - 0.12, -hl - 0.005));
    // mirrors
    parts.paint.push(at(box(0.18, 0.1, 0.12), sx * (Wc / 2 + 0.12), sh.beltY + 0.12, sh.cf - 0.15));
    // exhaust
    if (!sh.ev) parts.chrome.push(at(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 8).rotateX(Math.PI / 2).toNonIndexed(), sx * (Wb / 2 - 0.45), sh.r + 0.1, -hl - 0.02));
  });
  // number plate
  parts.plate.push(at(box(0.5, 0.12, 0.02), 0, sh.tailH - 0.3, -hl - 0.01));
  parts.plate.push(at(box(0.5, 0.12, 0.02), 0, sh.noseH + 0.02, hl + 0.015));
  // spoilers
  const sp = sh.sp;
  if (sp === 'lip') parts.paint.push(at(box(Wb * 0.82, 0.04, 0.2), 0, sh.trunkY + 0.07, -hl + 0.22));
  if (sp === 'wing' || sp === 'bigwing') {
    const big = sp === 'bigwing', wy = sh.trunkY + (big ? 0.42 : 0.3), ww = Wb * (big ? 1.0 : 0.92);
    parts.paint.push(at(box(ww, 0.05, big ? 0.42 : 0.3), 0, wy, -hl + 0.22));
    parts.paint.push(at(box(0.05, big ? 0.5 : 0.3, 0.16), -ww / 2 + 0.05, wy - (big ? 0.22 : 0.15), -hl + 0.22));
    parts.paint.push(at(box(0.05, big ? 0.5 : 0.3, 0.16), ww / 2 - 0.05, wy - (big ? 0.22 : 0.15), -hl + 0.22));
    parts.trim.push(at(box(ww, 0.02, big ? 0.3 : 0.2), 0, wy + 0.03, -hl + 0.22));
  }
  if (sp === 'bed') { // pickup cargo bed liner
    parts.trim.push(at(box(Wb - 0.2, 0.05, Math.abs(sh.cr + hl) - 0.1), 0, sh.trunkY + 0.04, (sh.cr - hl) / 2 - 0.05));
  }
  // diffuser and splitter for fast cars
  if (sh.r < 0.2) parts.trim.push(at(box(Wb + 0.06, 0.04, 0.3), 0, sh.r - 0.02, hl + 0.06));
  if (cop) {
    // black door panels with POLICE decal, light bar
    const mid = (sh.cf + sh.cr) / 2;
    [-1, 1].forEach((sx) => {
      const g = new THREE.PlaneGeometry(1.3, 0.34);
      g.rotateY(sx > 0 ? -Math.PI / 2 : Math.PI / 2);
      g.translate(sx * (Wb / 2 + 0.07), (sh.beltY + sh.r) / 2, mid - 0.2);
      parts.cop.push(g.toNonIndexed());
    });
    parts.trim.push(at(box(Wb * 0.6, 0.1, 0.5), 0, sh.roofY + 0.05, (sh.rfx + sh.rrx) / 2));
  }
  const out = { sh, parts: {}, wheelX: Wb / 2 + 0.02 };
  Object.keys(parts).forEach((k) => {
    if (parts[k].length) {
      parts[k].forEach((g) => { if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); });
      out.parts[k] = k === 'cop' ? parts[k][0] && mergeGeometries(parts[k]) : mergeGeometries(parts[k]);
    }
  });
  geoCache[ck] = out;
  return out;
}

const wheelGeos = {};
function wheelGeo(r) {
  const k = r.toFixed(2);
  if (wheelGeos[k]) return wheelGeos[k];
  const tire = new THREE.CylinderGeometry(r, r, 0.27, 20).rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(r * 0.66, r * 0.66, 0.28, 14).rotateZ(Math.PI / 2);
  const spokes = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.BoxGeometry(0.3, r * 0.1, r * 1.1);
    s.translate(0.0, 0, 0); s.rotateX((i / 5) * Math.PI * 2);
    spokes.push(s.toNonIndexed());
  }
  const sp = mergeGeometries(spokes.map((g) => { if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; }));
  const disc = new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.34, 10).rotateZ(Math.PI / 2);
  return (wheelGeos[k] = { tire, rim, sp, disc });
}
const archGeo = new THREE.CircleGeometry(1, 20);

export class CarVisual {
  /**
   * def: entry from CARS or traffic def {id, sh}. opts: paint, detail (spinning wheels), cop
   */
  constructor(def, opts = {}) {
    this.def = def; this.cop = !!opts.cop; this.detail = opts.detail !== false;
    const G = buildGeos(def.sh, def.geoId || def.id, this.cop);
    this.sh = def.sh; this.G = G;
    this.group = new THREE.Group(); this.group.rotation.order = 'YXZ';
    this.root = new THREE.Group(); this.group.add(this.root);
    this.paintMat = new THREE.MeshPhysicalMaterial({ color: opts.paint || def.paint || '#888', metalness: 0.55, roughness: 0.3, clearcoat: this.detail ? 1 : 0, clearcoatRoughness: 0.08, envMapIntensity: 1.1 });
    if (this.cop) this.paintMat.color.set('#f4f4f6');
    this.tailMat = this.detail ? M.tail.clone() : M.tail;
    this.headMat = M.head;
    const mats = { paint: this.paintMat, glass: M.glass, trim: M.trim, head: this.headMat, tail: this.tailMat, chrome: M.chrome, plate: M.plate };
    Object.keys(G.parts).forEach((k) => {
      if (k === 'cop') {
        const m = new THREE.Mesh(G.parts[k], new THREE.MeshBasicMaterial({ map: policeTexture() }));
        this.root.add(m); return;
      }
      const mesh = new THREE.Mesh(G.parts[k], mats[k]);
      this.root.add(mesh);
    });
    // wheels
    const sh = def.sh, wg = wheelGeos[sh.wr.toFixed(2)] || wheelGeo(sh.wr);
    this.wheels = []; this.pivots = [];
    const wx = G.wheelX;
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], i) => {
      const pivot = new THREE.Group(); pivot.position.set(sx * (wx + 0.04), sh.wr, sz * sh.wb / 2);
      const spin = new THREE.Group();
      spin.add(new THREE.Mesh(wg.tire, M.tire));
      spin.add(new THREE.Mesh(wg.rim, M.rim));
      if (this.detail) { spin.add(new THREE.Mesh(wg.sp, M.trim)); spin.add(new THREE.Mesh(wg.disc, M.chrome)); }
      pivot.add(spin); this.root.add(pivot);
      this.wheels.push(spin); if (i < 2) this.pivots.push(pivot);
      const arch = new THREE.Mesh(archGeo, M.trim);
      arch.scale.setScalar(sh.wr + 0.07); arch.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      arch.position.set(sx * (wx - 0.14 + 0.005), sh.wr, sz * sh.wb / 2);
      this.root.add(arch);
    });
    // blob shadow
    const sc = document.createElement('canvas'); sc.width = sc.height = 64;
    const g = sc.getContext('2d'); const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    if (!CarVisual._shTex) CarVisual._shTex = new THREE.CanvasTexture(sc);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(sh.W * 1.35, sh.L * 1.25), new THREE.MeshBasicMaterial({ map: CarVisual._shTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.06;
    this.group.add(shadow); this.shadow = shadow;

    if (this.detail) {
      // nitro flames
      this.flames = [];
      [-1, 1].forEach((sx) => {
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.4, 8).rotateX(-Math.PI / 2), M.flame);
        f.position.set(sx * (G.wheelX - 0.45 - 0.06), sh.r + 0.1, -sh.L / 2 - 0.7);
        f.visible = false; this.root.add(f); this.flames.push(f);
      });
      // neon underglow
      const ug = new THREE.Mesh(new THREE.PlaneGeometry(sh.W * 1.5, sh.L * 1.3), new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
      ug.rotation.x = -Math.PI / 2; ug.position.y = 0.08; this.group.add(ug); this.underglow = ug;
    }
    if (this.cop) {
      this.barR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.28), new THREE.MeshBasicMaterial({ color: 0xff1010 }));
      this.barB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.28), new THREE.MeshBasicMaterial({ color: 0x1a4cff }));
      const rz = (sh.rfx + sh.rrx) / 2;
      this.barR.position.set(-0.3, sh.roofY + 0.17, rz); this.barB.position.set(0.3, sh.roofY + 0.17, rz);
      this.root.add(this.barR, this.barB);
    }
    this.spinAng = 0; this.brakeAmt = 0; this._t = Math.random() * 10;
  }
  setPaint(hex) { if (!this.cop) { this.paintMat.color.set(hex); if (this.modelMats) this.modelMats.forEach((m) => m.color.set(hex)); } }
  setBrake(on) {
    const v = on ? 3.0 : 0.7;
    if (this.tailMat !== M.tail) this.tailMat.emissiveIntensity = v;
  }
  setNitro(a) { // 0..1
    if (!this.flames) return;
    this.flames.forEach((f) => { f.visible = a > 0.05; f.scale.set(1, 1, 0.5 + a * (0.8 + Math.random() * 0.5)); });
    M.flame.opacity = 0.7 + Math.random() * 0.3;
  }
  setUnderglow(hex, a) { if (this.underglow) { this.underglow.material.color.set(hex); this.underglow.material.opacity = a; } }
  update(dt, speed, steerAng) {
    this.spinAng += (speed / this.sh.wr) * dt;
    if (this.detail) this.wheels.forEach((w) => { w.rotation.x = this.spinAng; });
    this.pivots.forEach((p) => { p.rotation.y = steerAng || 0; });
    if (this.cop) {
      this._t += dt; const on = Math.floor(this._t * 6) % 2 === 0;
      this.barR.visible = on; this.barB.visible = !on;
    }
  }
}

export function randomTrafficDef() {
  const tot = TRAFFIC_TYPES.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * tot;
  for (const t of TRAFFIC_TYPES) { r -= t.w; if (r <= 0) return t; }
  return TRAFFIC_TYPES[0];
}
export const randomTrafficColor = () => TRAFFIC_COLORS[(Math.random() * TRAFFIC_COLORS.length) | 0];

/* big truck for traffic: cab + box trailer, built simply */
let truckGeo = null;
export function buildTruck(colour) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const root = new THREE.Group(); g.add(root);
  if (!truckGeo) {
    const cab = box(2.4, 2.3, 2.2); cab.translate(0, 1.55, 3.6);
    const cargo = box(2.55, 2.9, 7.4); cargo.translate(0, 2.15, -0.9);
    const chassis = box(2.2, 0.5, 11); chassis.translate(0, 0.6, 0.2);
    const glass = box(2.0, 0.75, 0.06); glass.translate(0, 2.0, 4.72);
    const lights = [box(0.4, 0.2, 0.05).translate(-0.9, 0.9, 4.72), box(0.4, 0.2, 0.05).translate(0.9, 0.9, 4.72)];
    const tails = [box(0.4, 0.2, 0.05).translate(-0.9, 0.9, -4.78), box(0.4, 0.2, 0.05).translate(0.9, 0.9, -4.78)];
    const wheels = [];
    [[-1.2, 3.6], [1.2, 3.6], [-1.2, -1.8], [1.2, -1.8], [-1.2, -3.2], [1.2, -3.2]].forEach(([x, z]) => {
      wheels.push(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14).rotateZ(Math.PI / 2).translate(x, 0.5, z).toNonIndexed());
    });
    const fix = (a) => a.map((q) => { q = q.index ? q.toNonIndexed() : q; if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); return q; });
    truckGeo = {
      cab: mergeGeometries(fix([cab])), cargo: mergeGeometries(fix([cargo])), dark: mergeGeometries(fix([chassis, ...wheels])),
      glass: mergeGeometries(fix([glass])), head: mergeGeometries(fix(lights)), tail: mergeGeometries(fix(tails)),
    };
  }
  const cabMat = new THREE.MeshStandardMaterial({ color: colour, metalness: 0.4, roughness: 0.45 });
  root.add(new THREE.Mesh(truckGeo.cab, cabMat));
  root.add(new THREE.Mesh(truckGeo.cargo, new THREE.MeshStandardMaterial({ color: '#e7e9ec', roughness: 0.7 })));
  root.add(new THREE.Mesh(truckGeo.dark, M.tire));
  root.add(new THREE.Mesh(truckGeo.glass, M.glass));
  root.add(new THREE.Mesh(truckGeo.head, M.head));
  root.add(new THREE.Mesh(truckGeo.tail, M.tail));
  return { group: g, root, sh: { L: 9.6, W: 2.6 } };
}
