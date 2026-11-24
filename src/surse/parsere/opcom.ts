// OPCOM, Piata pentru Ziua Urmatoare: raportul PIP, export CSV
//   https://www.opcom.ro/rapoarte-pzu-raportPIP-export-csv/<zi>/<luna>/<an>/ro   (verificat 24.11.2026)
// Din 2025 piata are produse de 15 minute: tabelul „Romania” are 96 de randuri (92 / 100 in zilele de trecere la ora de vara / iarna):
//   "Zona de tranzactionare","Interval","Pret de Inchidere a Pietei [lei/MWh]","Volum Tranzactionat [MW]",...,"Rezolutie"
//   "Romania","1","1110.97","1382.7","450.1","1382.7","PT15M"
// Decizia (docs/fluxuri-date.md): pastram toate valorile brute in `quarterValues` si afisam media pe ora (ora Romaniei) in `values`,
// pentru ca widgetul si cadranul lucreaza pe 24 de ore. O ora lipsa (ziua cu 23 de ore) se completeaza cu media vecinilor;
// ora dubla (ziua cu 25 de ore) este media tuturor sferturilor ei.
import { laOraRO } from '../../site/timp'

export type PretZi = { day: string; values: number[]; quarter: number[]; rezolutieMin: number; medie: number }

function campuri(linie: string): string[] {
  const out: string[] = []
  let cur = '', q = false
  for (let i = 0; i < linie.length; i++) {
    const ch = linie[i]
    if (q) { if (ch === '"') { if (linie[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += ch }
    else if (ch === '"') q = true
    else if (ch === ',' || ch === ';') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map((x) => x.trim())
}
const num = (s: string) => Number(String(s).replace(/\s/g, '').replace(/,(\d{1,2})$/, '.$1'))

const oraLocala = (t: number) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', hour: '2-digit', hourCycle: 'h23' }).format(new Date(t)))

export function parseazaPZU(csv: string, ziAsteptata: string): PretZi | null {
  const linii = String(csv || '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (!linii.length) return null
  const titlu = linii[0].match(/livrare:\s*(\d{2})\/(\d{2})\/(\d{4})/)
  if (!titlu) {
    // OPCOM raspunde cu o pagina HTML sau un fisier gol cand ziua nu e inca publicata
    if (/<html/i.test(csv)) return null
    throw new Error('OPCOM: formatul raportului PIP s-a schimbat (lipsește „ziua de livrare”).')
  }
  const day = `${titlu[3]}-${titlu[2]}-${titlu[1]}`
  if (day !== ziAsteptata) throw new Error(`OPCOM: am cerut ${ziAsteptata}, raportul este pentru ${day}.`)
  const ri = linii.findIndex((l) => /Zona de tranzactionare|Trading Zone/i.test(l))
  if (ri < 0) throw new Error('OPCOM: lipsește tabelul pe intervale (antetul „Zona de tranzactionare”).')
  const ant = campuri(linii[ri]).map((x) => x.toLowerCase())
  const iInt = ant.findIndex((x) => x.startsWith('interval'))
  const iPret = ant.findIndex((x) => /pret de inchidere|clearing price|closing price/.test(x))
  const iRez = ant.findIndex((x) => /rezolutie|resolution/.test(x))
  if (iInt < 0 || iPret < 0) throw new Error('OPCOM: coloanele „Interval” / „Pret de Inchidere a Pietei” lipsesc.')
  const randuri: { i: number; p: number; r: string }[] = []
  for (const l of linii.slice(ri + 1)) {
    const c = campuri(l)
    if (!/^rom[aâ]nia$/i.test(c[0])) continue
    const i = Number(c[iInt]), p = num(c[iPret])
    if (!Number.isInteger(i) || !Number.isFinite(p)) throw new Error(`OPCOM: rând invalid „${l.slice(0, 80)}”`)
    randuri.push({ i, p, r: iRez >= 0 ? c[iRez] : '' })
  }
  if (!randuri.length) return null
  randuri.sort((a, b) => a.i - b.i)
  const rez = /PT15M/i.test(randuri[0].r) ? 15 : /PT30M/i.test(randuri[0].r) ? 30 : /PT60M|PT1H/i.test(randuri[0].r) ? 60 : Math.round(1440 / randuri.length / 15) * 15 || 15
  // durata reala a zilei (23, 24 sau 25 de ore)
  const t0 = laOraRO(day, '00:00').getTime()
  const [y, m, d] = day.split('-').map(Number)
  const urm = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  const durMin = (laOraRO(urm, '00:00').getTime() - t0) / 60000
  const asteptate = durMin / rez
  if (randuri.length !== asteptate || randuri[randuri.length - 1].i !== asteptate) {
    throw new Error(`OPCOM: ${randuri.length} intervale de ${rez} min pentru ${day}, aștept ${asteptate}.`)
  }
  const pe: number[][] = Array.from({ length: 24 }, () => [])
  for (const r of randuri) pe[oraLocala(t0 + (r.i - 1) * rez * 60000)].push(r.p)
  const values = pe.map((l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : NaN))
  for (let h = 0; h < 24; h++) if (!Number.isFinite(values[h])) values[h] = ((values[h - 1] ?? values[h + 1]) + (values[h + 1] ?? values[h - 1])) / 2
  const r2 = (x: number) => Math.round(x * 100) / 100
  const quarter = randuri.map((r) => r.p)
  return { day, values: values.map(r2), quarter, rezolutieMin: rez, medie: r2(quarter.reduce((a, b) => a + b, 0) / quarter.length) }
}
