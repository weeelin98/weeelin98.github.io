# Little City

A Three.js desktop miniature-city portfolio, running locally with Vite.

```sh
npm install
npm run dev -- --port 5173
npm run check
npm run build
```

Open http://127.0.0.1:5173/. Left-drag turns the complete city display; right-drag
pans and the wheel zooms. Click a building or ride to focus, a sign to open its
placeholder content, and empty background to return to the overview. Escape closes
an open panel first, otherwise returns home. Dragging interrupts a camera flight.
Closing a panel preserves the camera. A compact glass navigation dock stays visible
at the bottom; no minimap or game tasks are required.

## Current environment controls

Two small groups provide Light: Auto / Day / Night, and Weather: Auto / Clear /
Rain / Snow. Both Auto modes start enabled, with Snow as the winter welcome weather.
Computer local time selects Day from 06:00 inclusive to 18:00 exclusive, otherwise Night. Initial night
loads directly without a daytime flash. No location or weather API is used.

Automatic weather advances Clear → Rain → Snow → Clear every five active foreground
minutes. Manual selection overrides only its own dimension. Returning weather to
Auto preserves the current weather and restarts its timer. Returning Light to Auto
checks local time immediately; background-to-foreground recovery also checks it.
Thresholds, intervals and the configurable initial weather are centralized in
`src/environment-cycle.js`. The Snow welcome is an explicit presentation setting,
not an inference about the visitor's hemisphere or actual weather.

The persistent glass dock contains About Me, Experience, CV, Projects, Memo, Contact Me and
Notes. Pointer proximity drives spring magnification and lift; hover or keyboard focus reveals its name. Buttons
reuse the physical signs' content opener; Experience is an additional dock-only
placeholder. Navigation configuration lives in `src/content.js`. Arrow keys move between its icons; Escape keeps its existing camera/panel behavior.
Full content pages remain pending user acceptance of this local revision.

The glass dock keeps its original 80px desktop / 64px compact frame. User-supplied
PNG icons fill the unframed buttons. Spring magnification and a short entry hop
may extend above the frame; reduced-motion mode suppresses both effects.
`src/dock-audio.js` plays local samples in `public/sounds/`: the opening water drop
from `freesound_community-water-drop-89799.mp3` (0.18–0.66s, gain adjusted) for
hover, and the pop from `universfield-bubble-pop-02-293341.mp3` (0.08–0.46s) for
clicks. Clips have short fades; hover is throttled and voices are bounded. Browser
autoplay policy requires a first click or keypress before hover audio can play.

Automatic day/night and weather transitions take ten seconds. Manual Light changes
take 1.8 seconds and manual Weather changes 2.4 seconds, so a click produces prompt
visible feedback. Transitions can be redirected from their current values.
Accumulation and people have a short lag. Pause freezes citizens,
buses, rides, rain, snow, clouds, birds, sign sway and automatic weather time.
Camera, navigation, clothing transitions and manual environment changes stay usable.
Resume never replays paused time. Automatic weather is a scene display cycle.

## Architecture and winter

Original building positions, heights, floor uses and composition are retained.
Individual blue/coral/yellow/mint palettes, cream frames and matte paint have been
refined. Selected structural edges are rounded; stairs and rails retain their
proportions. Static architecture is batched by material, with reusable primitives.

The perimeter park has continuous low terrain, six unequal planting clusters,
mixed broadleaf and tiered evergreen trees, shrubs, stones, sparse flowers/tufts,
and a curved path connecting to the original base. A short, tapering creek, timber
footbridge and small path-end bench form a secondary destination. Three natural
green tones vary across the meadow, with restrained grain and no repeated ellipse
meshes. A finite planted boundary fades to a neutral floor and simple sky. All
rotated base corners stay above the terrain. Surroundings are created after city
framing and never shrink the city. Clouds, distant birds and the amber moon remain.
Park geometry belongs to the same turntable group as the city, keeping the path,
bridge and base connected during rotation. Only the sky, moon and environment
light sources stay outside that rotation. Terrain colors and edge masks use local
coordinates; snow no longer leaves a fixed rectangular bare patch under a rotated base.

Winter uses 132 reusable exposed-surface snow caps, separate plant snow, irregular
park coverage, curb banks and 1,000 small drifting flakes. Upward surface records
are captured before batching; a one-time height grid rejects covered interior
surfaces and stops snow at roofs. Roads, entrances, stairs and connecting walkways
remain clear. Thirteen outdoor people have staged coats/scarves/hats, with some
umbrellas. Two existing bus-stop citizens move a short safe distance to fixed
shovel stations, then return when snow clears. Clumps and banks use bounded loops;
no people or snow meshes are repeatedly spawned.

50 citizens, three same-direction buses, both bus stops, upright Ferris gondolas,
carousel motion, rain shelters and furniture-relative activities remain. Interior
citizens keep their original anchors. Cross-floor pathfinding is not implemented.

## Navigation and lighting

Six entrances remain About Me, CV, Projects, Memo, Contact Me and Notes. Notes has
a Coming Soon panel; others have generic placeholders. Edit labels, building IDs,
colors, status, interaction type and href in `src/content.js`; geometry need not
change. No real personal information is invented. Configured HTTP(S)/mailto links
open from their signs.

Distinct physical contours, frames, mounts, fonts and reversible hover feedback
remain. Self-hosted fonts in `public/fonts/` are Lilita One, Bungee and Fredoka,
loaded through FontFace before canvas textures are generated. Binaries and OFL
notices originate from the Google Fonts family repositories. The sign picker
respects occlusion, padded hit areas, click priority and drag suppression.

The city, people, vehicles, rides and interior lights share one display group.
Sun/moon directional sources stay outside it: dragging changes actual surface
normals and shadows relative to fixed illumination. Release stops immediately.
The amber moon remains a shaded, emissive 3D sphere with a restrained spherical
halo, stable sky position and apparent size through pan/zoom/focus. Its real light
is pale warm, using the direction from (0,4,0) toward (28,34,9). Day has no visible
sun model. Persistent 2048px shadow maps cover the rotated city and park. Indoor
lamps, cool night fill and restrained window emission also work in night rain/snow.

## Source map

- `src/city.js`, `src/details.js`: architecture, furnishings and surface metadata.
- `src/signage.js`, `src/sign-fonts.js`, `src/content.js`: brands, fonts and content.
- `src/citizens.js`, `src/rain-response.js`, `src/traffic.js`: life and traffic.
- `src/park.js`, `src/surroundings.js`: terrain, planting, path, sky and clouds.
- `src/snow.js`, `src/winter-life.js`: coverage, particles, winter gear and shovels.
- `src/environment.js`, `src/environment-cycle.js`: persistent effects and policies.
- `src/display.js`, `src/interactions.js`: turntable, picking, panels and focus.
- `src/simulation.js`, `src/main.js`: separate wall/simulation time and integration.

## Validation and remaining visual acceptance

`npm run check` and `npm run build` pass. Regression checks cover ten simulated
minutes of life, bus spacing/stops, pedestrian separation, upright gondolas,
carousel direction, picking/occlusion, focus/interruption, hover, pause and resource
reuse. Winter checks cover the local 06:00/18:00 boundaries, snowy initialization,
proportional coat geometry, five-minute cycling,
independent overrides, background/pause time, roof exposure, six light/weather
combinations, 18 rapid switches, winter recovery and unchanged building/sign
positions. Maximum actor displacement was below 0.04 world units per 1/30s step.
CPU state/geometry checks do not measure GPU frame time or prove visual quality.

The fresh local browser preview now loads successfully. Manual Night and Snow
were tested with actual pointer clicks and produced the selected state and visible
night snow, without forcing daytime. The environment control handler is delegated
inside its own navigation container, and button queries no longer include canvas
diagnostic data attributes. The control container has an explicit stacking order
and consumes its pointer/click events. Screenshots and further browser checks are
recorded in `outputs/park-controls-*` for this revision.
The current 1280×720 preview measured about 16.7 ms per frame during the inspected
night-snow rotation, with no browser console warnings/errors. This observation is
specific to the test environment. Browser checks also covered paused manual
Night/Rain → Day/Snow switching with simulation time frozen, and rotated About Me
selection, panel dismissal and overview return.

`base: './'` keeps generated asset paths suitable for a future GitHub Pages project
path. Serve through Vite; file:// loading is unsupported. F5 restores Snow weather,
a running overview, local-time light and both Auto modes. Pushes to `main` run
the GitHub Pages deployment workflow. Screenshots in `outputs/` remain local.
