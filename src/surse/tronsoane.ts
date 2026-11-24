// Potrivirea unui eveniment rutier (drum + km + localitati) cu tronsoanele desenate pe harta (src/shared/harta.ts).
// Ordinea: 1) localitatile numite, care stau pe traseul unui tronson al aceluiasi drum; 2) kilometrajul, din tabelul de mai jos;
// 3) un singur tronson pentru acel drum; altfel niciun tronson (pe harta apare doar semnul de la coordonate / resedinta judetului).
import { P, RETEA, type Punct } from '../shared/harta'
import hartaDate from '../shared/harta-date.json'
import { ORASE_EXTRA } from '../shared/harta'
import { localitate, type Loc } from './geo'

/** „DN 1” -> „DN1”, „A 1” -> „A1”, „Dn 7C” -> „DN7C”, „DE 581” -> „DE581” */
export const normDrum = (s: string) => String(s || '').toUpperCase().replace(/\s+/g, '').replace(/^D\.?N\.?/, 'DN')

/**
 * Kilometrajul aproximativ al tronsoanelor de pe harta (km de la originea drumului). De verificat cu CNAIR/DRDP
 * cand vine fluxul oficial; potrivirea dupa localitati are prioritate, deci o eroare aici doar coloreaza alt tronson vecin.
 */
export const TABEL_KM: { drum: string; de: number; pana: number; tronson: string }[] = [
  { drum: 'A1', de: 0, pana: 112, tronson: 'a1-buc-pit' },
  { drum: 'A2', de: 0, pana: 203, tronson: 'a2' },
  { drum: 'A3', de: 0, pana: 62, tronson: 'a3-buc-plo' },
  { drum: 'DN1', de: 58, pana: 170, tronson: 'dn1-plo-bv' },
  { drum: 'DN1', de: 170, pana: 285, tronson: 'dn1-bv-sb' },
  { drum: 'DN1', de: 455, pana: 645, tronson: 'dn1-cj-or' },
  { drum: 'DN1C', de: 0, pana: 215, tronson: 'dn1c' },
  { drum: 'DN2', de: 0, pana: 450, tronson: 'dn2' },
  { drum: 'DN6', de: 0, pana: 172, tronson: 'dn6-buc-car' },
  { drum: 'DN6', de: 172, pana: 228, tronson: 'dn6-car-cv' },
  { drum: 'DN6', de: 228, pana: 520, tronson: 'dn6-cv-lug' },
  { drum: 'DN7', de: 172, pana: 272, tronson: 'dn7-olt' },
  { drum: 'DN7C', de: 37, pana: 151, tronson: 'dn7c' },
  { drum: 'DN13', de: 0, pana: 170, tronson: 'dn13' },
  { drum: 'DN56', de: 0, pana: 85, tronson: 'dn56' },
  { drum: 'DN66', de: 0, pana: 55, tronson: 'dn66-fil-tj' },
  { drum: 'DN66', de: 55, pana: 110, tronson: 'dn66-tj-pet' },
  { drum: 'DN66', de: 110, pana: 190, tronson: 'dn66-pet-dev' },
  { drum: 'DN67', de: 0, pana: 230, tronson: 'dn67' },
  { drum: 'DN67C', de: 0, pana: 148, tronson: 'dn67c' },
  { drum: 'DN79', de: 0, pana: 117, tronson: 'dn79' },
]

const ORASE = { ...(hartaDate.cities as unknown as Record<string, Punct>), ...ORASE_EXTRA }
const TRASEU = new Map(RETEA.map((r) => [r.id, r.p.map((x) => (typeof x === 'string' ? ORASE[x] : P(x[0], x[1]))).filter(Boolean) as Punct[]]))

function distSegment(p: Punct, a: Punct, b: Punct) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}
/** distanta (unitati de harta; 1 unitate ~ 0,7 km) de la un punct la traseul unui tronson */
export function distantaLaTronson(id: string, p: Punct) {
  const t = TRASEU.get(id) || []
  let m = Infinity
  for (let i = 0; i < t.length - 1; i++) m = Math.min(m, distSegment(p, t[i], t[i + 1]))
  return m
}
const PRAG = 14

export type Potrivire = { tronsoane: string[]; loc: Loc | null; cum: 'localitate' | 'km' | 'unic' | 'niciunul' }

/** km „65+913” sau „65,9” -> 65.913 */
export const kmDin = (s: string) => { const m = String(s).match(/(\d+)\s*(?:\+\s*(\d{1,3}))?/); return m ? Number(m[1]) + (m[2] ? Number(m[2].padEnd(3, '0')) / 1000 : 0) : NaN }

export function potrivesteTronson(drum: string, opt: { km?: number[]; localitati?: string[] }): Potrivire {
  const d = normDrum(drum)
  const aceluiasi = RETEA.filter((r) => normDrum(r.n) === d)
  const locs = (opt.localitati || []).map(localitate).filter(Boolean) as Loc[]
  const loc = locs[0] || null
  if (!aceluiasi.length) return { tronsoane: [], loc, cum: 'niciunul' }
  // 1) localitati
  if (locs.length) {
    // fiecare tronson primeste cate un punct pentru fiecare localitate numita aflata pe traseul lui; castiga cele cu cele mai multe
    const scor = new Map<string, number>()
    for (const l of locs) {
      const p = P(l.lon, l.lat)
      for (const r of aceluiasi) if (distantaLaTronson(r.id, p) <= PRAG) scor.set(r.id, (scor.get(r.id) || 0) + 1)
    }
    const max = Math.max(0, ...scor.values())
    if (max) return { tronsoane: [...scor].filter(([, n]) => n === max).map(([id]) => id), loc, cum: 'localitate' }
  }
  // 2) kilometraj
  const km = (opt.km || []).filter((x) => Number.isFinite(x))
  if (km.length) {
    const lo = Math.min(...km), hi = Math.max(...km)
    const t = TABEL_KM.filter((r) => r.drum === d && r.de <= hi && r.pana >= lo).map((r) => r.tronson)
    if (t.length) return { tronsoane: [...new Set(t)], loc, cum: 'km' }
  }
  // 3) drum cu un singur tronson desenat si fara alte indicii care sa-l contrazica
  if (aceluiasi.length === 1 && !locs.length && !km.length) return { tronsoane: [aceluiasi[0].id], loc, cum: 'unic' }
  return { tronsoane: [], loc, cum: 'niciunul' }
}
