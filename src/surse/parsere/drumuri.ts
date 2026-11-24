// Starea drumurilor din comunicate text: IGPR (Centrul Infotrafic) si CNAIR (drumuri inchise / restrictii / lucrari).
// Exemple reale de formulare (vezi tests/fixtures/surse/):
//   IGPR:  „DN 1 Ploiești - Brașov: coloane de autovehicule între Nistorești - Comarnic;”
//   CNAIR: „DN23, Mândrești Munteni (Jud Vrancea) – Olăneasca (Jud. Brăila);”   „DN 1 - km 65+913 - km 66+500, Bărcăneşti;”
import { cheie, judetDinNume, localitate } from '../geo'
import { kmDin, normDrum, potrivesteTronson } from '../tronsoane'
import { amprenta, PRIMA_MAJUSCULA, textDinHtml } from '../text'
import type { Element } from '../tipuri'

const DRUM_INCEPUT = /^\s*(?:[-•–·*]\s*)?(?:pe\s+)?((?:A|DN|DX|DJ|DE)\s?\d{1,3}[A-Z]?)\b\s*[,:.\-–]?\s*/i

export type StareDrum = 'closed' | 'works' | 'queue' | 'ok'
export function clasifica(t: string): { st: StareDrum; label: string } {
  const s = cheie(t)
  if (/inchis|blocat|intrerupt|nu se circula|restrictionat total|impracticabil/.test(s)) return { st: 'closed', label: '' }
  if (/lucrari|un (singur )?fir|alternativ|semafor|restrictii de circulatie|restrictionat|banda .* inchisa|ingustare/.test(s)) return { st: 'works', label: '' }
  if (/ceata|vizibilitate/.test(s)) return { st: 'queue', label: 'ceață' }
  if (/polei|gheata/.test(s)) return { st: 'queue', label: 'polei' }
  if (/zapada|ninsoare|viscol|deszapez/.test(s)) return { st: 'queue', label: 'zăpadă' }
  if (/coloan|aglomer|trafic intens|valori de trafic ridicate|ambuteiaj|bara la bara|trafic ingreunat|se circula (cu )?greu|accident/.test(s)) return { st: 'queue', label: '' }
  if (/trafic normal|se circula normal|fluent|fara probleme|conditii normale|redeschis/.test(s)) return { st: 'ok', label: '' }
  return { st: 'queue', label: '' }
}

/** cuvintele cu majuscula care par nume de localitati, in ordinea aparitiei */
export function numeProprii(t: string): string[] {
  const out: string[] = []
  const re = /\b([A-ZĂÂÎȘŞȚŢ][a-zăâîșşțţ]+(?:[- ](?:de |din |lui |pe )?[A-ZĂÂÎȘŞȚŢ][a-zăâîșşțţ]+)*)/g
  const STOP = new Set(['jud', 'judetul', 'judetului', 'sensul', 'directia', 'banda', 'centrul', 'politia', 'romana', 'infotrafic', 'atentie', 'trafic', 'circulatia', 'pe', 'in', 'la', 'intre', 'conform', 'situatia', 'drumuri', 'cnair', 'drdp', 'igpr'])
  for (const m of t.matchAll(re)) { const k = cheie(m[1]); if (!STOP.has(k) && !out.includes(m[1])) out.push(m[1]) }
  return out
}
/** localitatile in care se intampla ceva („între X - Y”, „în zona localităților …”, „în orașul X”), apoi restul;
 *  fara destinatii („pe sensul către Constanța”) */
export function localitatiPrioritare(t: string): string[] {
  const fara = t.replace(/(?:c[aă]tre|spre|direc[tț]ia(?: c[aă]tre)?)\s+[A-ZĂÂÎȘŞȚŢ][\wăâîșşțţ-]+(?:\s+[A-ZĂÂÎȘŞȚŢ][\wăâîșşțţ-]+)?/g, '')
  const pr: string[] = []
  for (const m of fara.matchAll(/(?:[îi]ntre|zona localit[aă][tț]ilor|localitatea|localit[aă][tț]ile|ora[sș]ul|municipiul|sta[tț]iunea|[îi]n zona|la)\s+([^;:]+)/gi)) pr.push(...numeProprii(m[1]))
  return [...new Set([...pr, ...numeProprii(fara)])]
}
const judetDinText = (t: string) => {
  const m = t.match(/(?:jud(?:e[tț]ul(?:ui)?)?\.?|Jud\.?)\s+([A-ZĂÂÎȘŞȚŢ][a-zăâîșşțţ]+(?:[- ][A-ZĂÂÎȘŞȚŢ][a-zăâîșşțţ]+)?)/i)
  return m ? judetDinNume(m[1]) : null
}

type Ev = { road: string; segment: string; what: string; st: StareDrum; label: string; localitati: string[]; km: number[]; judet: string | null }

function element(prefix: string, e: Ev, acum: Date, valabilOre: number): Element | null {
  const pot = potrivesteTronson(e.road, { km: e.km, localitati: e.localitati })
  const judet = e.judet || pot.loc?.judet || null
  if (!judet) return null
  const road = normDrum(e.road).replace(/^(A|DN|DX|DJ|DE)(\d)/, '$1$2')
  return {
    externalId: `${prefix}:${road}:${amprenta(cheie(e.segment))}`,
    data: {
      road, segment: e.segment.slice(0, 120), what: PRIMA_MAJUSCULA(e.what).slice(0, 300), status: e.st, label: e.label || null,
      county: judet, mapSegment: pot.tronsoane,
      lat: pot.loc ? pot.loc.lat : null, lon: pot.loc ? pot.loc.lon : null,
      from: acum.toISOString(), until: new Date(acum.getTime() + valabilOre * 3600e3).toISOString(),
    },
  }
}

/** Comunicatul Infotrafic (HTML sau text) -> evenimente. `ok` se pastreaza doar pentru autostrazi si drumuri expres. */
export function parseazaInfotrafic(html: string, acum = new Date()): Element[] {
  const text = textDinHtml(html)
  // propozitiile: pe randuri, dupa „;” sau inaintea unui drum care incepe o propozitie noua
  const prop = text.split(/;|\n|(?<=[.:])\s+(?=(?:A|DN|DX)\s?\d)/).map((x) => x.trim()).filter(Boolean)
  const evs: Ev[] = []
  for (const p of prop) {
    const m = p.match(DRUM_INCEPUT)
    if (!m) {
      // continuarea propozitiei de dinainte („între Fetești (județul Ialomița) și Cernavodă ...”)
      const u = evs[evs.length - 1]
      if (u && /^(intre|între|in zona|în zona|la |pe sensul|in directia|în direcția)/i.test(p)) {
        u.what += `; ${p}`; u.localitati.push(...numeProprii(p)); u.judet = u.judet || judetDinText(p)
        const c = clasifica(u.what); u.st = c.st; u.label = c.label
      }
      continue
    }
    const rest = p.slice(m[0].length)
    const [titlu, ...desc] = rest.includes(':') ? [rest.slice(0, rest.indexOf(':')), rest.slice(rest.indexOf(':') + 1)] : ['', rest]
    const what = desc.join(':').trim().replace(/[,.]$/, '')
    if (!what) continue
    const capete = titlu.split(/\s+[-–]\s+/).map((x) => x.trim()).filter(Boolean)
    const intre = what.match(/[îi]ntre\s+(?:localit[aă][tț]ile\s+)?([^,;]+?)\s+(?:[-–]|[șs]i)\s+([^,;(]+?)(?=\s+(?:[șs]i|[îi]n|pe|spre|c[aă]tre)\s|\s*[,;(]|\s*$)/i)
    const seg = intre ? `${intre[1].trim()}–${intre[2].trim()}` : capete.length >= 2 ? capete.join('–') : capete[0] || numeProprii(what)[0] || ''
    const c = clasifica(what)
    evs.push({ road: m[1], segment: seg.replace(/\s*\(jude[tț]ul [^)]+\)/gi, ''), what, st: c.st, label: c.label, localitati: [...localitatiPrioritare(what), ...capete], km: [...what.matchAll(/km\.?\s*(\d+(?:\s*\+\s*\d{1,3})?)/gi)].map((x) => kmDin(x[1])), judet: judetDinText(what) })
  }
  const out: Element[] = []
  for (const e of evs) {
    if (e.st === 'ok' && !/^(A|DX)/i.test(normDrum(e.road))) continue
    const el = element('igpr', e, acum, 6)
    if (el && !out.some((o) => o.externalId === el.externalId)) out.push(el)
  }
  return out
}

/** Comunicatul CNAIR (titluri „Drumuri închise circulației” / „Restricții” / „Lucrări” urmate de liste) -> evenimente */
export function parseazaCnair(html: string, acum = new Date()): Element[] {
  const linii = textDinHtml(html).split(/\n|;/).map((x) => x.trim()).filter(Boolean)
  let stare: { st: StareDrum; label: string } | null = null
  let motiv = ''
  const evs: Ev[] = []
  for (const l of linii) {
    const m = l.match(DRUM_INCEPUT)
    if (!m) {
      const k = cheie(l)
      if (/inchis/.test(k)) stare = { st: 'closed', label: '' }
      else if (/redeschis|deschis/.test(k)) stare = { st: 'ok', label: '' }
      else if (/restrictii|restrictionat|lucrari|semafor|alternativ/.test(k)) stare = { st: 'works', label: '' }
      if (/ninsor|viscol|zapad/.test(k)) motiv = 'din cauza ninsorii și a viscolului'
      else if (/inundat|viitur|ploi/.test(k)) motiv = 'din cauza inundațiilor'
      continue
    }
    const rest = l.slice(m[0].length).replace(/[.;]$/, '')
    const km = [...rest.matchAll(/km\.?\s*(\d+\s*(?:\+\s*\d{1,3})?)/gi)].map((x) => kmDin(x[1]))
    const faraKm = rest.replace(/[-–]?\s*km\.?\s*\d+\s*(?:\+\s*\d{1,3})?/gi, '').replace(/^[\s,–-]+/, '')
    const judet = judetDinText(rest)
    const locs = faraKm.replace(/\((?:Jud|jud)[^)]*\)/g, '').replace(/pe raza (?:jude[tț]ului|Jude[tț]ului) \S+/i, '').split(/\s+[-–]\s+|,/).map((x) => x.trim()).filter((x) => /^[A-ZĂÂÎȘŞȚŢ]/.test(x))
    const st = stare || clasifica(rest)
    if (st.st === 'ok') continue
    const seg = locs.length >= 2 ? `${locs[0]}–${locs[locs.length - 1]}` : locs[0] || (judet ? `pe raza județului ${faraKm.match(/jude[tț]ului\s+(\S+)/i)?.[1] || ''}`.trim() : faraKm)
    const kmTxt = km.length ? ` (km ${km.map((k) => String(k).replace('.', ',')).join('–')})` : ''
    const what = st.st === 'closed' ? `Drum închis circulației${motiv ? ` ${motiv}` : ''}${kmTxt}` : `Lucrări, circulație restricționată${kmTxt}`
    evs.push({ road: m[1], segment: seg.replace(/\s*\(.*?\)/g, ''), what, st: st.st, label: st.label, localitati: locs.map((x) => x.replace(/\s*\(.*?\)/g, '')), km, judet })
  }
  const out: Element[] = []
  for (const e of evs) { const el = element('cnair', e, acum, 12); if (el && !out.some((o) => o.externalId === el.externalId)) out.push(el) }
  return out
}
