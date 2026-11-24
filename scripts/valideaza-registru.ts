// Validatorul registrelor de audit si al regulilor din CLAUDE.md care se pot verifica automat.
// Iese cu cod 1 la orice EROARE; AVERTISMENTELE (locuri inca necompletate) nu opresc integrarea.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

const erori: string[] = []
const avert: string[] = []

// 1. Registrul de proprietate
const reg = parse(readFileSync('audit/registru-proprietate.yaml', 'utf8'))
const CHEI = ['meta', 'domenii', 'dns', 'infrastructura', 'google', 'publicitate', 'cod', 'terti', 'servicii', 'aplicatie', 'retele_sociale', 'riscuri_deschise']
for (const k of CHEI) if (!(k in reg)) erori.push(`registru-proprietate: lipseste sectiunea „${k}"`)
const editor = String(reg.meta?.editor_legal || '')
const gol = (v: unknown) => /^\[.*\]$/.test(String(v ?? '').trim()) || String(v ?? '').trim() === ''
if (gol(editor)) avert.push('registru-proprietate: editor_legal necompletat (decizia 0.1)')

// orice obiect care are `titular_legal` sau `cont_detinut_de` trebuie sa indice editorul
function parcurge(o: any, cale: string) {
  if (Array.isArray(o)) return o.forEach((x, i) => parcurge(x, `${cale}[${i}]`))
  if (!o || typeof o !== 'object') return
  for (const camp of ['titular_legal', 'cont_detinut_de']) {
    if (camp in o && !gol(o[camp]) && !gol(editor) && o[camp] !== editor) erori.push(`${cale}.${camp} = „${o[camp]}", nu editorul „${editor}"`)
  }
  if (Array.isArray(o.acces)) o.acces.forEach((a: any, i: number) => {
    if (a && a.doi_factori === false) erori.push(`${cale}.acces[${i}] (${a.cine}): fara autentificare in doi pasi`)
  })
  for (const [k, v] of Object.entries(o)) parcurge(v, cale ? `${cale}.${k}` : k)
}
parcurge(reg, '')

// 2. Registrul de constatari: identificatori unici, stare valida, severitate valida
const md = readFileSync('audit/registru.md', 'utf8')
const randuri = md.split('\n').filter((l) => /^\| [A-Z]{2,5}-\d{3} \|/.test(l))
const vazute = new Set<string>()
for (const r of randuri) {
  const c = r.split('|').map((x) => x.trim())
  const id = c[1]
  if (vazute.has(id)) erori.push(`registru.md: identificator duplicat ${id}`)
  vazute.add(id)
  if (c.length >= 11) {
    if (!/^S[0-4]$/.test(c[7])) erori.push(`registru.md ${id}: severitate „${c[7]}" invalida (S0-S4)`)
    if (!/^(deschisa|in lucru|inchisa|deschisa, risc asumat)$/.test(c[10])) erori.push(`registru.md ${id}: stare „${c[10]}" necunoscuta`)
  }
}

// 3. Regula incarcatorului unic: scripturile terte apar DOAR in src/client/consimtamant.ts
const TERTI = /googletagmanager\.com|googlesyndication\.com|connect\.facebook\.net|google-analytics\.com|gtag\/js|fbevents\.js|doubleclick\.net/
const PERMIS = new Set([path.normalize('src/client/consimtamant.ts'), path.normalize('public/js/cadranul.js')])
function fisiere(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    if (/node_modules|\.next|migrations|payload-types|referinta/.test(p)) return []
    return statSync(p).isDirectory() ? fisiere(p) : /\.(t|j)sx?$|\.mjs$|\.html$/.test(p) ? [p] : []
  })
}
for (const f of [...fisiere('src'), ...fisiere('public')]) {
  if (PERMIS.has(path.normalize(f))) continue
  const s = readFileSync(f, 'utf8').split('\n')
  s.forEach((l, i) => {
    if (TERTI.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l)) erori.push(`${f}:${i + 1}: script tert in afara incarcatorului unic (src/client/consimtamant.ts)`)
  })
}

for (const a of avert) console.log('AVERTISMENT', a)
for (const e of erori) console.log('EROARE', e)
console.log(`Registre verificate: ${randuri.length} constatari, ${erori.length} erori, ${avert.length} avertismente.`)
process.exit(erori.length ? 1 : 0)
