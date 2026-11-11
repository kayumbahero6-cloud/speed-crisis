// Usage: node tools/build-manifest.mjs   (run from the project root after adding files to /assets)
import fs from 'fs'; import path from 'path';
const A = 'assets', out = { base: '', cars: {}, sky: {}, props: {} };
const ls = (d) => (fs.existsSync(d) ? fs.readdirSync(d) : []);
for (const f of ls(`${A}/cars`)) if (/\.(glb|gltf)$/i.test(f)) out.cars[f.replace(/\.[^.]+$/, '')] = `cars/${f}`;
for (const d of ls(`${A}/cars`)) { const dir = path.join(A, 'cars', d); if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue; const f = ls(dir).find((x) => /\.(glb|gltf)$/i.test(x)); if (f) out.cars[d] = `cars/${d}/${f}`; }
for (const f of ls(`${A}/sky`)) if (/\.(hdr|jpg|jpeg|png)$/i.test(f)) out.sky[f.replace(/\.[^.]+$/, '')] = `sky/${f}`;
for (const d of ls(`${A}/props`)) { const dir = path.join(A, 'props', d); if (!fs.statSync(dir).isDirectory()) continue; const files = ls(dir).filter((f) => /\.(glb|gltf)$/i.test(f)).map((f) => `props/${d}/${f}`); if (files.length) out.props[d] = { files, spacing: 70, offset: 18 }; }
if (fs.existsSync(`${A}/manifest.json`)) { try { const old = JSON.parse(fs.readFileSync(`${A}/manifest.json`, 'utf8')); if (old.base) out.base = old.base; for (const k of Object.keys(out.props)) if (old.props && old.props[k]) Object.assign(out.props[k], { spacing: old.props[k].spacing || 70, offset: old.props[k].offset || 18 }); } catch (e) {} }
fs.writeFileSync(`${A}/manifest.json`, JSON.stringify(out, null, 1));
const size = (d) => ls(d).reduce((a, f) => a + (fs.statSync(path.join(d, f)).isFile() ? fs.statSync(path.join(d, f)).size : 0), 0);
console.log(`cars: ${Object.keys(out.cars).length}  sky: ${Object.keys(out.sky).length}  prop sets: ${Object.keys(out.props).length}  (${((size(`${A}/cars`) + size(`${A}/sky`)) / 1048576).toFixed(1)} MB cars+sky)`);
