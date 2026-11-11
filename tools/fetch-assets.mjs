// Runs at deploy time (Render build) where internet access is open.  Never fails the build.
//   SKETCHFAB_TOKEN   free token from sketchfab.com/settings/password  -> enables car model download
//   HDRI_RES          1k | 2k (default) | 4k
//   BUDGET_MB         total size cap for downloaded assets (default 800)
//   MAX_CAR_MB        skip a single car model bigger than this (default 45)
//   MAX_FACES         skip heavy meshes (default 400000)
//   LICENSES          comma list for Sketchfab search (default "cc0,by")  — non-commercial licences are NOT used by default
//   CAR_LIMIT         only fetch the first N cars (default all)
import fs from 'fs'; import path from 'path'; import AdmZip from 'adm-zip';
const PH = process.env.PH_API || 'https://api.polyhaven.com', SF = process.env.SF_API || 'https://api.sketchfab.com/v3';
const TOKEN = process.env.SKETCHFAB_TOKEN, RES = process.env.HDRI_RES || '2k';
const BUDGET = +(process.env.BUDGET_MB || 800) * 1048576, MAX_CAR = +(process.env.MAX_CAR_MB || 45) * 1048576, MAX_FACES = +(process.env.MAX_FACES || 400000);
const LICENSES = (process.env.LICENSES || 'cc0,by').split(','), CAR_LIMIT = +(process.env.CAR_LIMIT || 9999);
let used = 0; const credits = []; const log = (...a) => console.log('[assets]', ...a);
const mk = (d) => fs.mkdirSync(d, { recursive: true });
async function json(u, opt) { const r = await fetch(u, opt); if (!r.ok) throw new Error(r.status + ' ' + u); return r.json(); }
async function save(u, file, opt) { const r = await fetch(u, opt); if (!r.ok) throw new Error(r.status + ' ' + u); const b = Buffer.from(await r.arrayBuffer()); mk(path.dirname(file)); fs.writeFileSync(file, b); used += b.length; return b.length; }

/* ---------- 1. HDRI skies (Poly Haven, CC0) ---------- */
const STYLE_CATS = { neon: ['night', 'urban'], city: ['urban', 'outdoor'], forest: ['nature', 'outdoor'], open: ['skies', 'outdoor'], oval: ['outdoor', 'skies'] };
async function skies() {
  const used_ = new Set();
  for (const [style, cats] of Object.entries(STYLE_CATS)) {
    try {
      const list = await json(`${PH}/assets?t=hdris&c=${cats.join(',')}`);
      const slug = Object.keys(list).find((k) => !used_.has(k)); if (!slug) continue; used_.add(slug);
      const f = await json(`${PH}/files/${slug}`); const e = (f.hdri[RES] || f.hdri['2k'] || Object.values(f.hdri)[0]).hdr;
      const n = await save(e.url, `assets/sky/${style}.hdr`);
      credits.push(`Sky "${list[slug].name || slug}" (${style}) — Poly Haven, CC0 — https://polyhaven.com/a/${slug}`); log('sky', style, slug, (n / 1048576).toFixed(1) + ' MB');
    } catch (e) { log('sky skipped', style, e.message); }
  }
}

/* ---------- 2. Car models (Sketchfab, by name) ---------- */
const norm = (s) => s.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
function matches(carName, resName) {
  const a = norm(carName), b = new Set(norm(resName)); if (!a.length) return false;
  if (!b.has(a[0])) return false;                                   // brand must appear
  const rest = a.slice(1).filter((t) => t.length > 1); const hit = rest.filter((t) => b.has(t)).length;
  return rest.length === 0 || hit >= Math.max(1, Math.ceil(rest.length * 0.6));
}
async function cars() {
  if (!TOKEN) { log('no SKETCHFAB_TOKEN — car models skipped'); return; }
  const ids = fs.readFileSync('assets/car-ids.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t')).slice(0, CAR_LIMIT);
  const headers = { Authorization: 'Token ' + TOKEN };
  for (const [id, name] of ids) {
    if (used > BUDGET) { log('budget reached'); break; }
    if (fs.existsSync(`assets/cars/${id}`)) continue;
    try {
      let pick = null;
      for (const lic of LICENSES) {
        const q = encodeURIComponent(name.replace(/\([^)]*\)/g, ''));
        const res = await json(`${SF}/search?type=models&downloadable=true&license=${lic}&q=${q}&sort_by=-likeCount&count=12`, { headers });
        pick = (res.results || []).find((r) => matches(name, r.name) && (!r.faceCount || r.faceCount <= MAX_FACES)); if (pick) break;
      }
      if (!pick) { log('no match', name); continue; }
      const dl = await json(`${SF}/models/${pick.uid}/download`, { headers }); const g = dl.gltf; if (!g || (g.size && g.size > MAX_CAR)) { log('too big / no gltf', name); continue; }
      const tmp = `assets/_tmp_${id}.zip`; await save(g.url, tmp);
      const dir = `assets/cars/${id}`; mk(dir); new AdmZip(tmp).extractAllTo(dir, true); fs.unlinkSync(tmp);
      credits.push(`${name}: "${pick.name}" by ${pick.user && (pick.user.displayName || pick.user.username)} — ${(pick.license && (pick.license.label || pick.license.slug)) || 'license n/a'} — ${pick.viewerUrl || 'https://sketchfab.com/3d-models/' + pick.uid}`);
      log('car', id, '<-', pick.name);
    } catch (e) { log('car skipped', name, e.message); }
  }
}

try { mk('assets/cars'); mk('assets/sky'); await skies(); await cars(); } catch (e) { log('fetch error', e.message); }
if (credits.length) fs.writeFileSync('assets/CREDITS.md', '# Asset credits\n\nDownloaded at build time. CC-BY items must keep this credit.\n\n' + credits.map((c) => '- ' + c).join('\n') + '\n');
log('done,', (used / 1048576).toFixed(1), 'MB downloaded');
