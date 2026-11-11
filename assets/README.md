# Real assets (this is what makes the game 200 MB – 1 GB)

The game runs without anything in this folder (it uses built-in generated art). Every file you add replaces
the generated art for that car / track automatically — no code changes.

## 1. Exact cars  → `assets/cars/<car-id>.glb`
* `car-ids.txt` lists the exact file name for all 105 cars (e.g. `bugatti-chiron-super-sport.glb`).
* Format: **glTF binary (.glb)**, Draco / Meshopt compression supported. Any orientation or size: the game turns the car so its
  long side points forward, scales it to the car's length and sits it on the road.
* Paint: materials whose name contains `paint`, `body`, `carpaint`, `exterior` or `shell` take the colour chosen in the Garage.
* Use the same car shown in your web image (or the closest licensed model). Typical size: 5–30 MB per car → 105 cars ≈ 0.5–2 GB.
  Resize/compress with `npx gltf-transform optimize in.glb out.glb --compress draco` to shrink.

## 2. Real tracks / places
* **Sky + lighting panorama** (360° photo or HDRI): `assets/sky/<track-id>.hdr|jpg|png`, or per style
  `assets/sky/neon.hdr`, `city`, `forest`, `open`, `oval`, or one for everything: `assets/sky/default.hdr`.
  `track-ids.txt` lists all 100 track ids. It becomes the sky and the reflections on the cars.
* **Roadside scenery models** (grandstands, pit buildings, signs, trees, towers…): put `.glb` files in
  `assets/props/<track-id or style>/` — they are repeated along both sides of the road (spacing / offset can be edited
  in `assets/manifest.json`).

## 3. Register the files
```
node tools/build-manifest.mjs
```
This writes `assets/manifest.json`. Commit the assets and the manifest. The Garage shows **REAL 3D MODEL** for cars that have one.

## Hosting big files
* GitHub rejects single files > 100 MB and the repo gets slow past ~1 GB. `.gitattributes` already marks the asset types for
  **Git LFS** (`git lfs install` first). Render static sites serve LFS files after `git lfs pull` in the build command
  (`git lfs pull`), or host the assets on a CDN / bucket and set `"base": "https://your-cdn/assets/"` in `manifest.json`.
* Downloaded models are cached by the app (service worker) so players download each car once.

## Licences
Only use models/HDRIs you are allowed to use (CC0 / CC-BY with credit / purchased / your own). Real car brands are trademarks.
Free sources to look at: Poly Haven (CC0 HDRIs, textures, some models), Sketchfab (filter *Downloadable* + licence), Quaternius / Kenney (CC0 props).
