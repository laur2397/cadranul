// Construieste scriptul site-ului (src/client) in public/js/cadranul.js: un singur fisier mic, fara biblioteci.
import { build } from 'esbuild'
const r = await build({
  entryPoints: ['src/client/main.ts'], outfile: 'public/js/cadranul.js', bundle: true, minify: true, format: 'iife',
  target: ['es2020'], legalComments: 'none', metafile: true, logLevel: 'warning',
})
const b = Object.values(r.metafile.outputs)[0].bytes
console.log(`public/js/cadranul.js: ${(b / 1024).toFixed(1)} KB`)
