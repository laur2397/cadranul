// TomTom Traffic, „Incident Details”: incidentele de trafic in timp real (accidente, cozi, drumuri inchise, lucrari).
// Raspunsul e GeoJSON: { incidents: [{ geometry: { type, coordinates }, properties: { id, iconCategory, magnitudeOfDelay,
// events: [{ description, code, iconCategory }], startTime, endTime, from, to, length(InMeters), delay(InSeconds), roadNumbers } }] }.
// Parserul accepta ambele variante de nume (API-ul clasic v5 si TomTom Orbis v2) si categoriile ca numar sau ca text.
import type { Element } from '../tipuri'
import { RESEDINTE, judetDinPunct } from '../geo'
import { P, RETEA } from '../../shared/harta'
import { distantaLaTronson, normDrum } from '../tronsoane'

type Incident = {
  geometry?: { type?: string; coordinates?: unknown }
  properties?: {
    id?: string; iconCategory?: number | string; magnitudeOfDelay?: number | string
    events?: { description?: string; code?: number; iconCategory?: number | string }[]
    startTime?: string | null; endTime?: string | null; from?: string | null; to?: string | null
    length?: number; lengthInMeters?: number; delay?: number | null; delayInSeconds?: number | null; roadNumbers?: string[]
  }
}

// categoriile TomTom (numerice in v5, text in Orbis)
const CAT: Record<string, string> = {
  0: 'unknown', 1: 'accident', 2: 'fog', 3: 'dangerousConditions', 4: 'rain', 5: 'ice', 6: 'jam', 7: 'laneClosed',
  8: 'roadClosed', 9: 'roadWorks', 10: 'wind', 11: 'flooding', 14: 'brokenDownVehicle',
}
const cat = (c: unknown) => (typeof c === 'number' ? CAT[c] || 'unknown' : String(c || 'unknown'))
const MAG: Record<string, number> = { unknown: 0, minor: 1, moderate: 2, major: 3, undefined: 4, 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }
const ETICHETA: Record<string, string> = {
  accident: 'accident', fog: 'ceață', dangerousConditions: 'pericol', rain: 'ploaie', ice: 'polei', jam: '', laneClosed: 'bandă închisă',
  roadClosed: 'închis', roadWorks: 'lucrări', wind: 'vânt', flooding: 'inundație', brokenDownVehicle: 'mașină defectă',
}
const DESCRIERE: Record<string, string> = {
  accident: 'Accident', fog: 'Ceață', dangerousConditions: 'Condiții periculoase', rain: 'Ploaie puternică', ice: 'Polei', jam: 'Trafic aglomerat',
  laneClosed: 'Bandă închisă', roadClosed: 'Drum închis', roadWorks: 'Lucrări', wind: 'Vânt puternic', flooding: 'Inundație', brokenDownVehicle: 'Vehicul defect pe carosabil',
}

/** punctele geometriei, [lon, lat] */
function puncte(g: Incident['geometry']): [number, number][] {
  const c = g?.coordinates
  if (!Array.isArray(c)) return []
  if (typeof c[0] === 'number') return [[Number(c[0]), Number(c[1])]]
  return (c as unknown[]).filter((p) => Array.isArray(p) && p.length >= 2).map((p) => [Number((p as number[])[0]), Number((p as number[])[1])])
}

/** Drumul principal: autostrada / DN / DJ inaintea numerelor europene (E81 etc.) */
function drumPrincipal(l: string[] = []): string {
  const n = l.map(normDrum).filter(Boolean)
  return n.find((x) => /^(A\d|DN\d|DX\d)/.test(x)) || n.find((x) => /^DJ\d/.test(x)) || n.find((x) => !/^E\d/.test(x)) || n[0] || ''
}

/**
 * Pastram doar ce conteaza pentru un cititor: drumuri inchise, accidente, conditii periculoase, cozi cu intarziere reala
 * (cel putin `minIntarziere` minute sau marime „moderate/major”), lucrari pe autostrazi si drumuri nationale.
 */
export function parseazaTomtom(json: string, acum = new Date(), opt: { minIntarziere?: number; valabilOre?: number } = {}): Element[] {
  const d = JSON.parse(json) as { incidents?: Incident[] }
  if (!d || !Array.isArray(d.incidents)) throw new Error('TomTom: răspunsul nu conține lista „incidents”; formatul s-a schimbat?')
  const minIntarziere = opt.minIntarziere ?? 5
  const out: Element[] = []
  for (const inc of d.incidents) {
    const p = inc.properties || {}
    const pts = puncte(inc.geometry)
    if (!p.id || !pts.length) continue
    const c = cat(p.iconCategory)
    const intarziere = Math.round(Number(p.delayInSeconds ?? p.delay ?? 0) / 60)
    const marime = MAG[String(p.magnitudeOfDelay ?? 0)] ?? 0
    const road = drumPrincipal(p.roadNumbers)
    const national = /^(A\d|DN\d|DX\d)/.test(road)
    const pastreaza = c === 'roadClosed' || c === 'accident' || c === 'ice' || c === 'flooding' || c === 'dangerousConditions'
      || (c === 'jam' && (intarziere >= minIntarziere || marime >= 2))
      || ((c === 'roadWorks' || c === 'laneClosed') && national)
      || (c === 'brokenDownVehicle' && national)
      || (c === 'fog' && national)
    if (!pastreaza) continue
    const mijloc = pts[Math.floor(pts.length / 2)]
    const judet = judetDinPunct(mijloc[0], mijloc[1])
    if (!judet) continue // in afara Romaniei
    // tronsoanele de pe harta ale aceluiasi drum pe langa care trece incidentul
    const tronsoane = road ? RETEA.filter((r) => normDrum(r.n) === road && pts.some((q, i) => (i % Math.max(1, Math.floor(pts.length / 8)) === 0 || i === pts.length - 1) && distantaLaTronson(r.id, P(q[0], q[1])) <= 10)).map((r) => r.id) : []
    const status = c === 'roadClosed' ? 'closed' : c === 'roadWorks' || c === 'laneClosed' ? 'works' : 'queue'
    const km = Number(p.lengthInMeters ?? p.length ?? 0) / 1000
    // textul il scriem noi, in romana, dupa categorie (descrierile TomTom vin de obicei in engleza)
    const descriere = DESCRIERE[c] || 'Incident de trafic'
    const detalii = [intarziere >= 1 ? `întârziere de ${intarziere} min` : '', km >= 0.5 ? `pe ${String(Math.round(km * 10) / 10).replace('.', ',')} km` : ''].filter(Boolean).join(', ')
    const what = `${descriere.charAt(0).toUpperCase() + descriere.slice(1)}${detalii ? ` (${detalii})` : ''}.`
    const segment = [p.from, p.to].filter((x): x is string => !!x && !!x.trim()).map((x) => x.trim())
    const start = p.startTime && Number.isFinite(Date.parse(p.startTime)) ? new Date(p.startTime) : acum
    const sfarsitSursa = p.endTime && Number.isFinite(Date.parse(p.endTime)) ? new Date(p.endTime) : null
    // fara ora de sfarsit: valabil `valabilOre`, prelungit la fiecare rulare cat timp TomTom il mai raporteaza
    const until = sfarsitSursa && sfarsitSursa.getTime() > acum.getTime() ? sfarsitSursa : new Date(acum.getTime() + (opt.valabilOre ?? 1) * 3600e3)
    out.push({
      externalId: `tomtom:${p.id}`,
      data: {
        // pe strazile din oras nu exista numar de drum: eticheta e orasul (resedinta judetului)
        road: road || RESEDINTE[judet] || 'Local',
        segment: (segment.length ? [...new Set(segment)].join(' – ') : DESCRIERE[c] || 'Incident').slice(0, 120),
        what: what.slice(0, 300), status, label: ETICHETA[c] || (intarziere >= 1 ? `+${intarziere} min` : null),
        delayMinutes: intarziere || null, county: judet, mapSegment: tronsoane,
        lat: +mijloc[1].toFixed(5), lon: +mijloc[0].toFixed(5),
        from: start.toISOString(), until: until.toISOString(),
      },
    })
  }
  return out
}
