# SPEED CRISIS
A Need for Speed: Hot Pursuit-style arcade racer with Speed Racer-style car weapons, upgrade-based stunt jumps and a high GTA V-style overhead camera.

## Run
Unzip, then double-click `index.html` (any modern browser, works offline). Progress and cash are saved in your browser.

## Modes
- Race: 3 laps against 5 rivals
- Hot Pursuit: same race, but cops chase you (spike strips, roadblocks, helicopter, ramming)
- Cop Pursuit: play as police and bust 4 fleeing racers before time runs out
- Series: Sports, Performance, Super, Exotic, Hyper (harder rivals, bigger payouts)

## Controls
W/S accelerate/brake, A/D steer, Enter nitro, Space handbrake, E headlights, V camera height,
I turbo (racer) / helicopter (cop), J EMP, L jammer (racer) / roadblock (cop), K spike strip,
Z saw blades, Shift jump jacks, R reset to road, Esc pause. Arrow keys also drive.

## Tech (all free)
Plain HTML5 Canvas + JavaScript + WebAudio. No libraries, no downloaded assets, nothing to install.
Files: index.html, style.css, data.js (map, events, 77 cars), game.js.

## Ideas to extend
Add free CC0 car sprites/music (kenney.nl, opengameart.org, freesound.org), more tracks, online leaderboards.

## Seacrest County content (from your notes)
- 12 districts with all listed racer events (Race, Duel, Time Trial, Preview, Hot Pursuit, Gauntlet) and cop events (Hot Pursuit, Interceptor, Rapid Response, Preview), with their mile lengths. Interstates and named roads are listed in the menu.
- All 77 Remastered cars with real top speed, 0-62, HP and drive type, restricted to Racer / Cop / Both. Five series with their cop units.
- Equipment: EMP lock-on (3-5s, escape with Jammer or handbrake), spike strips (level 3 drops two rows), jammer (kills cop gear and spikes), turbo (Perfect Turbo bonus), roadblocks with a gap, helicopter (EMP scares it off). Limited uses per event; levels rise with use.
- Busting by damage or stopping, Rapid Response penalties (wall +2s, vehicle +3s), cop nitro from speed vs racer nitro from drifting, shortcuts (brown/blue on minimap).

## Added in the second update
- Every district (and DLC pack) now builds its own road layout; the HUD shows which named road or interstate you are on (all 21 roads and 4 interstates).
- Oil slicks (O, racers): the mobile-version weapon. Spike strips flash blue (cop) or red (racer).
- Arms Race mode toggle: more equipment, instant cops, enemies lock EMPs on you. It is played against AI, not online.
- Autolog: your best result per event is saved, compared against 5 simulated friends (Nova, Dash, Viper, Ghost, Rook), with a "beat this record" recommendation. Bounty from earnings raises your career level.
- DLC packs: Super Sports Pack, Lamborghini Untamed and Porsche Unleashed events using those cars. Event names in these packs are placeholders because the real ones were not in the source notes.
- Retail-only cars added (Mercedes SLR McLaren Stirling Moss and 722 Edition, Carbon Motors E7 Concept): 80 cars total. They have no published stats, so class defaults are used.
- Cop helicopter pauses the Interceptor timer and drops spike strips ahead of the lead racer.

## Still not possible
Real online multiplayer (needs a server), and the original programming language is unpublished, so nothing was invented there.

## Chase-cam update
- New 3D behind-the-car camera (V cycles chase / high / bumper) with 3D car models, tail lights, shadows, body roll, nitro flames, speed lines, rain and night lighting.
- Every district has its own look: forest, desert, suspension bridges over water, night city, canyon, snow pass, coast, sunset city (15 themes).
- Unlimited money: cash is always $99,999,999, so every car and upgrade can be bought. All districts, events and series are open.
- Touch buttons appear automatically on phones/tablets.

## Realism update
- Detailed rear-view cars (glossy paint, L-shaped tail lights, quad exhaust, plate, brake lights, police livery). Paint colours can be changed in the Garage.
- Close chase camera is now the default (V cycles chase / high / bumper).
- Wet-sheen asphalt with tyre tracks and skid marks, jersey barriers with reflectors, suspension-bridge towers and cables, motion blur and speed lines (auto-disabled on slow machines).
- New HUD: position/time panel, round minimap, arc speedometer with gear and nitro ring.

## Round 2 update (mobile-racer look)
- Car body types: roadster with a visible driver, GT-wing coupe, sedan; police livery. Paint picker and car previews in the Garage.
- Countryside/track scenery: patchwork fields, mowed lawn stripes, wooden fences, roadside stakes, yellow chevron boards on corners, bushes, windmills, grandstands with crowd, checkered banners, puffy clouds, cyan racing line, red waypoint marker with distance.
- HUD like the reference: top pill (N2O, gear, speed, TCS/ABS, progress), timer + event title + mission card, rotating round minimap with route, turn arrow with distance, position/leaderboard with gaps, analog tach dial with nitro ring, coach tips ("Gloria: ..."), hazard banners ("Jump ramp ahead in 320m").
- On-screen controls drawn on the canvas and clickable/touchable: hex steering pad, BRAKE, DRIFT, N2O, GAS, weapon buttons, pause and camera buttons. Keyboard still works.
- Career map menu: tap a district pin, pick a mission card, difficulty, START. Garage shows car previews and upgrade pips. Money is unlimited.

## Round 3 - your cars/circuits list
- `world.js`: +100 cars (stats generated by tier from name) and 124 circuits as extra districts (Nurburgring, Le Mans, Spa, Suzuka, Laguna Seca...). Each has its own track seed, scenery theme (forest/desert/city/night/coast/snow/canyon) chosen by name/country, 4 race missions + 2 cop missions. Menu: "World circuits" searchable grid under the map.
- Images: your Unsplash links are hotlinked on garage cards and circuit cards (`WORLD.img`, `WORLD.timg`). If a link fails they fall back to the drawn car. The photos are only thumbnails; the in-race view is still the drawn 3D chase cam.
- Controls follow the device: touch -> hex pad/BRAKE/DRIFT/N2O/GAS; keyboard -> key hint strip; gamepad -> left stick, R2/L2, A nitro, X/B drift, Y camera, Start pause. Switches automatically on first input.

### Real photos (optional)
Run `python3 fetch_images.py` once on your machine (needs internet, no packages). It saves a Wikipedia photo per car/circuit into `images/` plus `manifest.json` and `CREDITS.md`; the game then uses those local files instead of the Unsplash links. Commit `images/` before deploying.
