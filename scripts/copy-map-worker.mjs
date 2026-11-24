// maplibre-gl 6 loads its map worker from a separate file that bundlers do not copy.
// Copy it into public/ so it is served at /maplibre-gl-worker.mjs (see components/Map.tsx).
import { copyFileSync } from 'node:fs'
copyFileSync(new URL('../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url), new URL('../public/maplibre-gl-worker.mjs', import.meta.url))
