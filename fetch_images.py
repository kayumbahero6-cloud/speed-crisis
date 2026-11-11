#!/usr/bin/env python3
"""Download one real photo per car and circuit from Wikipedia/Wikimedia Commons.
Run once on your own machine, then commit the images/ folder:
    python3 fetch_images.py            # fetch everything missing
    python3 fetch_images.py --limit 5  # quick test
Writes images/cars/*.jpg, images/circuits/*.jpg, images/manifest.json and images/CREDITS.md
(every photo is from a Wikipedia article; check each article's file page for its licence)."""
import json, re, sys, time, urllib.parse, urllib.request, pathlib
ROOT = pathlib.Path(__file__).parent
UA = {'User-Agent': 'SpeedCrisisImageFetcher/1.0 (personal game project; contact: you@example.com)'}
API = 'https://en.wikipedia.org/w/api.php'
src = (ROOT / 'world.js').read_text(encoding='utf8')
W = json.loads(re.search(r'window\.WORLD=(\{.*?\});\n', src, re.S).group(1))
cars = list(W['img'].keys())
circs = [c[0] for c in W['circ']]
limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else 10**9
def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r: return r.read()
        except Exception as e:
            time.sleep(1.5 * (i + 1)); err = e
    raise err
def find(name, kind):
    q = re.sub(r'\s*\([^)]*\)', '', name)
    q = q + (' circuit' if kind == 'circuits' and 'circuit' not in q.lower() and 'ring' not in q.lower() else '')
    params = dict(action='query', format='json', generator='search', gsrsearch=q, gsrlimit=3, prop='pageimages|info',
                  piprop='thumbnail', pithumbsize=900, inprop='url')
    d = json.loads(get(API + '?' + urllib.parse.urlencode(params)))
    pages = sorted(d.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 9))
    for p in pages:
        if p.get('thumbnail'): return p['thumbnail']['source'], p['fullurl'], p['title']
    return None
mf_path = ROOT / 'images' / 'manifest.json'
mf = json.loads(mf_path.read_text()) if mf_path.exists() else {'cars': {}, 'circuits': {}}
credits = []
for kind, names in (('cars', cars), ('circuits', circs)):
    (ROOT / 'images' / kind).mkdir(parents=True, exist_ok=True)
    for n in names[:limit]:
        if n in mf[kind] and (ROOT / mf[kind][n]).exists(): continue
        slug = re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')
        try:
            r = find(n, kind)
            if not r: print('no image:', n); continue
            url, page, title = r
            rel = f'images/{kind}/{slug}.jpg'
            (ROOT / rel).write_bytes(get(url)); mf[kind][n] = rel
            credits.append(f'- {n}: {title} - {page}')
            print('ok', n, '<-', title)
        except Exception as e: print('fail', n, e)
        time.sleep(0.3)
mf_path.write_text(json.dumps(mf, indent=1, ensure_ascii=False))
with open(ROOT / 'images' / 'CREDITS.md', 'a', encoding='utf8') as f: f.write('\n'.join(credits) + '\n')
print('done:', len(mf['cars']), 'cars,', len(mf['circuits']), 'circuits')
