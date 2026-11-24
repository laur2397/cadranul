// Starea drumurilor din comunicate text: IGPR (Centrul Infotrafic) si CNAIR (drumuri inchise / restrictii / lucrari).
// Exemple reale de formulare (vezi tests/fixtures/surse/):
//   IGPR:  „DN 1 Ploiești - Brașov: coloane de autovehicule între Nistorești - Comarnic;”
//   CNAIR: „DN23, Mândrești Munteni (Jud Vrancea) – Olăneasca (Jud. Brăila);”   „DN 1 - km 65+913 - km 66+500, Bărcăneşti;”
import { cheie, judetDinNume, localitate } from '../geo'
import { kmDin, normDrum, potrivesteTronson } from '../tronsoane'
import { amprenta, dataPunct, dataRomaneasca, PRIMA_MAJUSCULA, textDinHtml } from '../text'
import { DOMParser } from 'linkedom'
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

/**
 * CNAIR, fluxul RSS oficial al comunicatelor: https://www.cnadnr.ro/ro/comunicare/comunicate-de-presa/rss (verificat 24.11.2026).
 * <item><title>Circulație închisă pe DN67C – Transalpina, între Obârșia Lotrului și Curpăt</title><description>(HTML Drupal escapat;
 * textul e in field-item property="content:encoded")</description><pubDate>…</pubDate><guid>16135 at https://www.cnadnr.ro</guid>
 * Pastram doar comunicatele despre inchideri / restrictii / lucrari care afecteaza circulatia; un comunicat ramane valabil
 * 7 zile de la inceput (CNAIR nu publica sfarsitul), iar un „redeschide” mai nou pe acelasi drum il anuleaza.
 */
const RELEVANT_CNAIR = /[îi]nchi(de|s|să|să)|[îi]nchid|restric[tț]i|restric[tț]ionat|lucr[aă]ri[^.]{0,80}circula/i
const IRELEVANT_CNAIR = /agabaritic|\bDALI\b|\bSF\b|elaborare|achizi[tț]i|licita|aplica[tț]iile informatice|mentenan[tț][aă] la aplica/i
export function parseazaCnairRss(xml: string, acum = new Date(), valabilZile = 7): Element[] {
  const doc = new DOMParser().parseFromString(String(xml || '').replace(/^\uFEFF/, ''), 'text/xml')
  if (doc.documentElement?.tagName !== 'rss') throw new Error(`CNAIR: fluxul RSS lipsește (rădăcina „${doc.documentElement?.tagName || 'lipsă'}”); adresa sau formatul s-au schimbat.`)
  type It = { getElementsByTagName(n: string): ArrayLike<{ textContent: string | null }> }
  const iteme = (Array.from(doc.getElementsByTagName('item')) as unknown as It[]).map((it) => {
    const t = (n: string) => it.getElementsByTagName(n)[0]?.textContent || ''
    const desc = t('description')
    // corpul comunicatului (campul content:encoded); fara categoria „Interes general”
    const corp = desc.match(/property="content:encoded"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? desc
    const pub = Date.parse(t('pubDate'))
    return { titlu: textDinHtml(t('title')).trim(), text: textDinHtml(corp).replace(/\s+/g, ' ').trim(), pub: Number.isFinite(pub) ? new Date(pub) : acum, id: t('guid').match(/\d+/)?.[0] || amprenta(t('link')) }
  }).sort((a, b) => +b.pub - +a.pub)
  const redeschise = new Map<string, Date>()
  const out: Element[] = []
  for (const it of iteme) {
    const tot = `${it.titlu}. ${it.text}`
    const dm = tot.match(/\b(A|DN|DX)\s?(\d{1,3}[A-Z]?)\b/)
    if (!dm) continue
    const road = `${dm[1]}${dm[2]}`
    if (/redeschi/i.test(tot)) { if (!redeschise.has(road)) redeschise.set(road, it.pub); continue }
    if (!RELEVANT_CNAIR.test(tot) || IRELEVANT_CNAIR.test(tot)) continue
    if ((redeschise.get(road)?.getTime() ?? 0) > it.pub.getTime()) continue
    const an = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric' }).format(it.pub))
    const dPunct = it.text.match(/(\d{1,2}\.\d{1,2}\.\d{4}),?\s*(?:ora|orele)\s*(\d{1,2}[:.]\d{2})/i)
    const dLit = it.text.match(/\d{1,2}\s+(?:ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s*(?:\d{4})?,?\s*(?:ora|orele)\s*\d{1,2}[:.]\d{2}/i)
    const start = (dPunct && dataPunct(dPunct[1], dPunct[2].replace('.', ':'), an)) || (dLit && dataRomaneasca(dLit[0].replace(/ora (\d{1,2})\.(\d{2})/, 'ora $1:$2'), an)) || it.pub
    const until = new Date(Math.max(start.getTime(), it.pub.getTime()) + valabilZile * 864e5)
    if (until.getTime() <= acum.getTime()) continue
    const intre = tot.match(/[îi]ntre\s+(?!km)([A-ZĂÂÎȘŞȚŢ][^,;()]*?)(?:\s*\([^)]*\))?\s+(?:și|si|–|-)\s+([A-ZĂÂÎȘŞȚŢ][^,;()]*?)(?=\s*[,(.;]|\s+pe\s|\s+[îi]ntre\s|$)/)
    const capete = intre ? [intre[1].trim(), intre[2].trim()] : []
    const km = [...tot.matchAll(/km\.?\s*(\d+\s*\+\s*\d{3}|\d+)/gi)].map((x) => kmDin(x[1]))
    const st = /[îi]nchi/i.test(tot) ? 'closed' as const : 'works' as const
    const motiv = it.text.match(/din cauza ([^.(,]+?)(?=\s*[.(,]|\s+se\s|$)/i)?.[1]
    const kmTxt = km.length ? ` (km ${[Math.min(...km), Math.max(...km)].map((k) => String(Math.round(k * 1000) / 1000).replace('.', ',')).join('–')})` : ''
    const what = `${st === 'closed' ? 'Circulație închisă' : 'Circulație restricționată pentru lucrări'}${motiv ? `, din cauza ${motiv}` : ''}${kmTxt}`
    const pot = potrivesteTronson(road, { km, localitati: capete })
    const judet = judetDinText(tot) || pot.loc?.judet || null
    if (!judet) continue
    out.push({
      externalId: `cnair:${it.id}`,
      data: {
        road, segment: (capete.length ? capete.join('–') : it.titlu).slice(0, 120), what: what.slice(0, 300), status: st, label: null,
        county: judet, mapSegment: pot.tronsoane, lat: pot.loc?.lat ?? null, lon: pot.loc?.lon ?? null,
        from: start.toISOString(), until: until.toISOString(),
      },
    })
  }
  return out
}
