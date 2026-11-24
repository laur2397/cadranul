// Carburanti: preturile pe statie -> media pe judet (benzina standard, motorina standard, GPL) + cea mai ieftina statie.
// Formatul de intrare este cel cerut Consiliului Concurentei in docs/cereri-acces/consiliul-concurentei-carburanti.md
// (CSV sau JSON, cate un rand pe statie si produs):
//   judet;localitate;statie;retea;adresa;produs;pret;actualizat
//   Dolj;Craiova;Petrom Calea Severinului;OMV Petrom;Calea Severinului 40;benzina_standard;7,49;2026-11-24T08:10:00+02:00
// Monitorul preturilor (monitorulpreturilor.info) nu publica o licenta de reutilizare si nu raspunde din afara Romaniei:
// conectorul ramane oprit pana la acordul scris.
import { judetDinNume, cheie } from '../geo'
import { ziRO } from '../../site/timp'
import { camp, randuri } from './tabel'
import type { Element } from '../tipuri'

const PRODUS = (s: string): 'petrol' | 'diesel' | 'lpg' | null => {
  const k = cheie(s)
  if (/premium|plus|extra|98|100|ultimate|maxx|evo|excellium|efix|power/.test(k)) return null // doar standard
  if (/gpl|lpg|autogaz/.test(k)) return 'lpg'
  if (/motorina|diesel/.test(k)) return 'diesel'
  if (/benzina|petrol|95/.test(k)) return 'petrol'
  return null
}
const pret = (s: string) => { const n = Number(String(s).replace(/\s|lei/gi, '').replace(',', '.')); return n > 2 && n < 30 ? n : NaN }

export function parseazaCarburanti(text: string | Record<string, string>[], acum = new Date(), maxVechimeOre = 48): Element[] {
  const r = typeof text === 'string' ? randuri(text) : text
  if (!r.length) return []
  if (!('judet' in r[0]) && !('county' in r[0])) throw new Error('Carburanți: lipsește coloana „judet”.')
  type Statie = { loc: string; adr: string; retea: string; statie: string; p: number }
  const pe = new Map<string, { petrol: Statie[]; diesel: Statie[]; lpg: Statie[] }>()
  for (const x of r) {
    const j = judetDinNume(camp(x, 'judet', 'county'))
    const prod = PRODUS(camp(x, 'produs', 'product', 'carburant'))
    const p = pret(camp(x, 'pret', 'price'))
    const t = Date.parse(camp(x, 'actualizat', 'updated', 'data'))
    if (!j || !prod || !Number.isFinite(p)) continue
    if (Number.isFinite(t) && acum.getTime() - t > maxVechimeOre * 3600e3) continue
    if (!pe.has(j)) pe.set(j, { petrol: [], diesel: [], lpg: [] })
    pe.get(j)![prod].push({ loc: camp(x, 'localitate', 'city'), adr: camp(x, 'adresa', 'address'), retea: camp(x, 'retea', 'network'), statie: camp(x, 'statie', 'station'), p })
  }
  const day = ziRO(acum)
  const medie = (l: Statie[]) => (l.length ? Math.round((l.reduce((a, s) => a + s.p, 0) / l.length) * 100) / 100 : null)
  const out: Element[] = []
  for (const [j, v] of [...pe].sort()) {
    const petrol = medie(v.petrol), diesel = medie(v.diesel)
    if (petrol == null || diesel == null) continue
    const ief = [...v.petrol].sort((a, b) => a.p - b.p)[0]
    out.push({
      externalId: `carburanti:${j}:${day}`,
      data: {
        county: j, day, petrol, diesel, lpg: medie(v.lpg),
        cheapestNote: ief ? `${[ief.statie || ief.loc, ief.adr].filter(Boolean).join(', ')}: ${ief.p.toFixed(2).replace('.', ',')} lei` : null,
      },
    })
  }
  return out
}
