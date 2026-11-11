# UMUHANDA — Highway Pursuit (PWA game)

3D highway racing + police pursuit, playable in the browser and installable on phone/PC.

## Play
- Host the folder over HTTPS (Netlify / Firebase Hosting) or locally: `npx serve .` then open the link. Chrome/Edge show **Install app**; iPhone: Share → Add to Home Screen. Works offline after the first load.
- Or just open `index.html` through any web server (a double-click from the file system also works, only install/offline need a server).

## Content (from your list)
- **105 cars** – the 100 from your list plus the 5 at the top (F40, 911 GT3 RS, Valkyrie, McLaren F1, Chiron SS). Each car gets a 3D body template (hatch / coupe / muscle / GT / supercar / hypercar), a 1–5★ performance tier and a price from its name. Cars are searchable in the Garage.
- **100 circuits** – every circuit in your list, each with its own generated layout (curves, hills) and an environment style: *Neon city* (street circuits – Baku, Marina Bay, Las Vegas, Macau, Miami, Jeddah… glowing windows, neon barrier strips, LED gantries and billboards, night by default), *City*, *Forest* (Nordschleife, Spa, Le Mans…), *Open country* (Kyalami, Mugello, Laguna Seca…), *Speedway* (Daytona, Bristol, Talladega… grandstands and constant left-hand banking).
- **Web images** – each car and circuit card shows the link from your list (hot-linked from images.unsplash.com). If a link fails to load, a generated card is shown instead. Edit `src/catalog.js` to change any link, then rebuild.

## Real assets (optional, 200 MB – 1 GB)
The built-in cars/tracks are generated shapes. To get the *exact* cars and real places, add `.glb` car models, panoramic skies and
scenery to `assets/` and run `node tools/build-manifest.mjs` — see **assets/README.md** (file names for all 105 cars and 100 tracks are in
`assets/car-ids.txt` and `assets/track-ids.txt`). Build as an ES module: `npx esbuild src/main.js --bundle --minify --format=esm --outfile=js/game.js`.

## Deploy: GitHub + Render (recommended)
1. Push this folder to a GitHub repository (assets are NOT stored in git — Render downloads them while building).
2. Render → **New → Blueprint** (uses `render.yaml`) or **New → Static Site** with Build command `npm ci && npm run render` and Publish directory `dist`.
3. In the Render dashboard add the environment variable **SKETCHFAB_TOKEN** (free: sketchfab.com → Settings → Password & API). Optional: `BUDGET_MB` (default 800), `HDRI_RES` (1k/2k/4k), `MAX_CAR_MB`, `CAR_LIMIT`, `LICENSES` (default `cc0,by`).
4. On each deploy the build downloads CC0 sky panoramas from Poly Haven (one per track style) and, for every car, searches Sketchfab for a downloadable CC0/CC-BY model with the same name, keeps only name-matching results, and writes `assets/CREDITS.md`.
Notes: matching is by name, so some cars may get no model (generic body is used) or a lower-quality one; check `CREDITS.md` after the first deploy. Without a token only the skies are downloaded. To use your own hand-picked models instead, put them in `assets/` and commit them (see assets/README.md).

## Modes
- **Open World** (default) – endless free-roam map: hills, lakes, forests, a town with buildings at every crossroads, roaming traffic, day/night cycle (T), minimap, checkpoint races (E), respawn (R). Speedway stock cars (#45, #11, #24, #5, #9) are in the Garage; the Speedway circuits have teal walls.
- **Highway Rush** – two-way traffic on a curving hilly road. Pass cars closely for **near-miss combos**; drive in the oncoming lane for double points.
- **Hot Pursuit** – police chase you. Cops ram, flank and set **roadblocks**. Take them down by ramming, shake them off to fill the ESCAPE bar and raise the **HEAT**. Stay close to cops too long and the BUSTED bar fills.
- Time of day: Day, Sunset, Night, Rain. Traffic: Light / Normal / Heavy.

## Unlimited money
Cash is **$ ∞**. All 12 cars start locked with prices but every purchase is free, and engine / turbo / tyres / brakes upgrades and paint + neon underglow are free too. Progress is saved in the browser.

## Controls (follow the device in use)
The game detects touch, keyboard or gamepad automatically (Settings → Controls to force one). Phones can also steer by **tilting** (Settings → Steering).

| Action | Keys | Phone |
|---|---|---|
| Steer | ← → or A D | on-screen ◀ ▶ |
| Gas | ↑ / W (auto-accelerate is on by default) | automatic |
| Brake | ↓ / S / Space | BRAKE |
| Nitro | Shift / N | N₂O |
| Camera (6 views: chase, close, hood, bumper, drone, low cinematic) | C / gamepad Y | 📷 |
| Pause | P / Esc | ❚❚ |
Gamepads work too. Settings has *Driving assist* (off = pro handling: you must steer through every bend).

## Files
`index.html` · `css/game.css` · `js/game.js` (bundled, three.js included) · `src/` (readable source; `catalog.js` = your car/track/image list) · `sw.js` · `manifest.webmanifest` · `icons/`

Rebuild after editing `src/`: `npm i && npx esbuild src/main.js --bundle --minify --format=esm --outfile=js/game.js`

All cars, textures and sounds are generated in code (no external assets). Car names are original.
