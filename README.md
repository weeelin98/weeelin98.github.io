# Little City

Three.js desktop miniature-city portfolio, running locally with Vite.

```sh
npm install
npm run dev -- --port 5173
npm run build
npm run check
```

Open http://127.0.0.1:5173/. Left-drag turns the complete city display, right-drag pans, and the wheel zooms.
Click a building or ride to focus. Click a sign to open its placeholder content
panel. Escape closes an open panel first; otherwise it returns to the overview.
Click the empty background to return, or start dragging to interrupt a camera
flight. Closing a panel preserves the camera view. No navigation bar or minimap.
The small Pause / Play button freezes citizens, buses, rides, drops and ripples.
Camera controls, content entrances and weather transitions remain available.
Resume continues from the same simulation time without replaying paused time.

Current stage: furnished architecture, temporary English signs and 50 articulated
citizens, including office workers, diners, shop staff, sidewalk walkers and ride
passengers. Three buses follow a rounded road loop, brake and dwell at both bus
stops, and maintain a leader gap. The Ferris wheel and carousel run continuously.
Sunny is the default blue-sky environment. Rain fades in, darkens and
smooths ground materials, adds localized low-opacity planar puddle reflections,
and stops drops at authored roof footprints. Seven exposed citizens raise umbrellas;
five sidewalk citizens travel to covered bakery / bus-stop locations and gradually
return after rain. Night combines a deep-blue background with warm window tints,
interior fill, street lamps and restrained Ferris/carousel bulbs. The three small
environment buttons are on the right. Model layout and default camera are retained.

Step 7 adds a quiet grass-and-sky surround, low hills, four peripheral trees,
soft clouds, a low-frequency three-bird flock and a warm moon at night. The terrain
fades into the sky rather than exposing an edge. Surroundings are created after
city framing and do not shrink the city. Environment transitions reuse the same
objects. Cloud drift, birds and sign bobbing follow paused simulation time.

The six entrances are About Me (tower), CV (bookshop), Projects (blue studio),
Memo (café), Contact Me (restaurant) and Notes (bakery). Notes is `coming-soon`;
the rest are `placeholder`. All content is deliberately generic. Edit display
names, `buildingId`, accent `color`, `status`, and `href` in `src/content.js`.
To publish Notes, change its status and provide its link. No geometry edit needed.
Physical signs have fixed mounting angles and high-resolution real-font text.
Each entrance now has its own silhouette, frame, palette and structural mounting:
rounded café fascia, chamfered CV blade, braced rooftop billboard, double-sided oval
Memo pendant, rounded Contact entrance board, and a bookmark-shaped Notes blade.
Fixed bodies stay attached during hover; their typography subtly lifts and scales.
The pendant alone has a very small sway. Each fill transitions within its own
palette; text color stays constant. Mounts and padded hit areas remain fixed.

Three families are self-hosted in `public/fonts/`: Lilita One (About/Memo), Bungee
(Projects/CV/Notes) and Fredoka at weight 700 (Contact). `src/sign-fonts.js` waits
for FontFace loading before generating canvas textures; no office-font fallback
is used. Original font binaries and OFL notices come from the Google Fonts
[Lilita One](https://github.com/google/fonts/tree/main/ofl/lilitaone),
[Bungee](https://github.com/google/fonts/tree/main/ofl/bungee) and
[Fredoka](https://github.com/google/fonts/tree/main/ofl/fredoka) directories.
Design parameters, default/hover/text colors, dimensions, fonts and mounts live
beside each entrance in `src/content.js`.

- `src/content.js`: content IDs, labels, URLs, region relationships, interaction
  types, sign mounts, building bounds and camera observation profiles. All URLs
  are empty placeholders. A configured HTTP(S) or mailto URL opens from its sign.
- `src/city.js`: architecture, furniture primitives and static material batching.
- `src/details.js`: room-specific interiors, street furniture, stair landings and
  route segment records for later pedestrian integration.
- `src/main.js`: renderer, daylight and bounded orthographic pan/zoom controls.
- `src/display.js`: direct, inertia-free city rotation independent of environment lights.
- `src/citizens.js`: furniture-relative placements, articulated poses and sidewalk loops.
- `src/traffic.js`: shared bus path, stop timing and collision spacing.
- `src/interactions.js`: occlusion-aware sign picking, padded hit areas, drag
  suppression, modal content panels and turntable-aware camera transitions.
- `src/environment.js`: persistent lighting, rain, roof masks, wet materials and
  localized reflection target. It updates existing resources during transitions.
- `src/rain-response.js`: delayed umbrellas, sidewalk-to-shelter routes and returns.
- `src/simulation.js`: separate simulation and wall time for pause/resume and
  hidden-tab recovery. No debug overlays or visible performance counters.
- `src/signage.js`: readable physical plates and bounded, reversible hover response.
- `src/sign-fonts.js`: verified local font loading before texture generation.
- `src/surroundings.js`: continuous terrain/sky, clouds, moon and distant birds.
- `src/moon.js`: distant amber emissive sphere, procedural surface, soft
  spherical halo and a matching directional moonlight with a persistent shadow map.
- `src/life.js`: obsolete early draft; not imported by the active scene.

`base: './'` prepares generated asset paths for GitHub Pages hosting. The workflow
in `.github/workflows/pages.yml` publishes `main` to https://weeelin98.github.io/.
See `DEPLOYMENT.md` for deployment status and the next development session.

Validation: production build, browser overview / zoom inspection and a ten-minute
simulated life cycle. The check covers finite geometry, fixed interior anchors,
pedestrian separation, repeated bus stops, close-queue spacing, upright gondolas
and carousel direction. Interior citizens stay at designated furniture anchors;
cross-floor pedestrian pathfinding is not implemented in this stage.
Stage-four checks cover sign occlusion/backface rejection, padded hit targets,
nine camera destinations, return and interruption. Browser checks cover sign-only
content opening, focused views, Escape precedence, preservation on panel close,
drag suppression and blank-background return. Screenshots are in `outputs/`.
Stage-five checks simulate shelter arrival, recovery, six rapid weather cycles,
stable resources, unchanged interior anchors and bounded per-frame movement.
Browser checks cover daytime/night/rain rendering, absence of shader errors and
content-panel interaction during rain. Reflection is intentionally low-resolution
and restricted to a few road puddles, rather than a mirror across the whole base.

Final checks include pause across multiple environment changes, frozen actor and
particle transforms, uninterrupted environment fades, and resume without jumps.
Static architecture is batched by material; primitives, person accessories and
umbrella panels reuse geometries. Day and moon lights have persistent 2048px
shadow maps, refreshed at up to 30 Hz while actors move. Only the active light's
map updates in settled day/night states; the brief crossfade can update both.
The 384px puddle target updates at up to 24 Hz
for stationary views and immediately when the camera changes. No postprocessing
chain is created, and weather switches reuse existing lights, materials and targets.

`npm run build` writes `dist/` with relative asset URLs and local dependencies;
it can later be served under a GitHub Pages project path. Opening `index.html`
directly via file:// is not supported; use the local Vite server. F5 uses normal
browser refresh and restores the sunny, running overview.

Step-seven verification covers all six visible/pickable default-view signs,
text contrast throughout hover, repeated hover reversal, paused cloud/bird motion,
traveling shelter-seekers' umbrellas and 24 pan/zoom views. Rendering has also been
checked in-browser in Sunny, Rain and Night, including the Notes placeholder.
Brand-sign checks cover six distinct contours, local font-file signatures, physical
depth, fixed-body hover, pendant swing limits, and back-face clicks with occlusion.

Moon lighting: the body is a shaded, amber-orange, self-emissive 3D sphere with a
seamless procedural texture and restrained spherical halo. Its screen position
and apparent size stay stable while panning, zooming and focusing. The body is
framed as a distant celestial object, with far-depth handling behind opaque city
geometry; its real directional light remains fixed in the environment, using the
direction from `(0, 4, 0)` toward `(28, 34, 9)`. Body framing never moves that light.
Transparent terrain renders before the moon and clouds so it cannot tint them.

Moonlight is pale warm cream, balanced with cool blue fill and warmer interior
lamps. Sun intensity falls quadratically as moonlight rises, keeping strong double
shadows out of the transition. PCF filtering softens the fixed lunar shadow
projection, which covers the base, buildings and peripheral trees. Trees now cast
and receive shadows. The city, people, vehicles, rides and interior lights share
one display group. Left-drag rotates that group around Y, so actual world-space
surface normals, occluders and ground shadows change relative to stable day/night
sources. Releasing the pointer stops immediately. Daylight has no visible sun
model. Both shadow frusta cover all city rotations and peripheral trees; dragging
refreshes cached shadows even while life animations are paused. Picking transforms
hit points back into authored city coordinates, and focus targets into world space.
Focus preserves view direction; overview return also restores the initial city angle.

The background uses a clearer blue gradient, cream-white volumetric clouds and
matte grass with low-frequency color variation. No grass-blade field or noisy
high-frequency texture is used. A soft upper terrain fade keeps the sky visible
in close views. Rain and night smoothly deepen those same materials.
`check-moon.mjs` checks stable celestial projection, pale real light, rotating
shadow coverage and resource reuse. `check-display.mjs` checks direct drag/stop,
independent light sources, rotated facade normals, transformed picking, focus,
return and interruption.
