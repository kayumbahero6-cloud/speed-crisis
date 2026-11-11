export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
export const KMH = 3.6;

export function store(key, val) {
  try {
    if (val === undefined) {
      const r = localStorage.getItem(key);
      return r ? JSON.parse(r) : null;
    }
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { /* storage unavailable */ }
  return null;
}
