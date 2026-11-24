import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import hartaDate from '../shared/harta-date.json'
import { P, ORASE_EXTRA, eAutostrada, fara, type CheieRegiune, type Punct, type StareDrum } from '../shared/harta'
import { parseazaValori } from '../collections/EnergyPrices'
import { ziRO, ziPlus } from './timp'

// Instantaneul datelor publice ale site-ului, tinut in memoria procesului:
// se reincarca la cel mult 60 de secunde sau imediat dupa o salvare in /admin (hooks/invalideaza.ts).

export type Jud = { id: number; slug: string; name: string; mapKey: string; seat: string; regKey: CheieRegiune; regId: number; jobsActive: number | null }
export type Reg = {
  id: number; slug: string; key: CheieRegiune; name: string; short: string; city: string; cityKey: string
  refCounty: Jud | null; sponsor: { name: string; line?: string; url?: string } | null; counties: Jud[]
}
export type Sec = { id: number; slug: string; name: string; desc?: string }
export type Aut = { id: number; slug: string; name: string; role?: string; base?: string; bio?: string; initials?: string; beat?: string }
export type Img = { src: string; alt: string; caption?: string; credit?: string; chart?: string }
export type Art = {
  id: number; slug: string; title: string; seoTitle?: string; dek: string; sec: Sec; label: string
  regKey: CheieRegiune | ''; counties: Jud[]; place: { name: string; x: number; y: number } | null
  img: Img; pub: Date; upd: Date; prio: number; type: string; authors: Aut[]; min: number
}
export type Ev = { id: number; road: string; a: boolean; where: string; what: string; st: StareDrum; lab: string; regKey: CheieRegiune; cty: Jud; x: number; y: number; seg: string[] }
export type Out = { id: number; k: 'apa' | 'curent' | 'gaz'; t: string; d: string; city: string; regKey: CheieRegiune; cty: Jud; x: number; y: number }
export type Wx = { city: string; key: string; temp: number; w: string; cond: string; level: string; hours: { h: number; t: number }[]; regKey: CheieRegiune | ''; x: number; y: number }
export type Alerta = { id: number; code: 'yellow' | 'orange' | 'red'; phen: string; text: string; roads: string; counties: Jud[]; from: Date | null }
export type Fuel = { day: string; petrol: number; diesel: number; lpg: number; note?: string }
export type Job = {
  id: number; slug: string; title: string; employer: string; city: string; cty: Jud; regKey: CheieRegiune; pay: string; where: string
  description?: string; requirements?: string; applyEmail?: string; applyUrl?: string; deadline: Date | null; promo: boolean; source: string; sourceUrl?: string; created: Date
}
export type Farm = { name: string; city: string; address: string; hours: string; phone?: string; sponsor: boolean; cty: Jud }
export type Timp = { route: string; regKey: CheieRegiune | ''; duration: string; delta: string; st: StareDrum }
export type Prima = { top?: string; catchUp: string[]; seven: string[]; most: string[]; callouts: { slug: string; dx: number; dy: number }[] }
export type Fraza = { edition: string; greeting?: string; phrase?: string }
export type Live = { slug: string; title: string; dek: string; active: boolean; regKey: CheieRegiune | ''; pub: Date; img: Img; last: Date | null }

export type Snap = {
  t: number
  regs: Reg[]; regByKey: Map<string, Reg>; regBySlug: Map<string, Reg>
  juds: Jud[]; judBySlug: Map<string, Jud>
  secs: Sec[]; secBySlug: Map<string, Sec>
  auts: Aut[]; autBySlug: Map<string, Aut>
  arts: Art[]; artBySlug: Map<string, Art>
  ev: Ev[]; out: Out[]; wx: Wx[]; alerte: Alerta[]
  pret: { day: string; values: number[]; source: string } | null
  pretMaine: { day: string; values: number[]; source: string } | null
  fuel: Map<string, { azi: Fuel; ieri: Fuel | null }>; fuelNat: { azi: [number, number, number]; ieri: [number, number, number] | null }
  jobs: Job[]; farm: Farm[]; timpi: Timp[]
  prima: Map<string, Prima>; fraze: Fraza[]; nextUpdate: string; pensie: { pct: number; from: string }
  live: Live[]
  site: { name: string; tagline: string; publisher: Record<string, string> }
  pagini: { slug: string; title: string }[]
}

type Doc = Record<string, any>
const idDe = (r: unknown): number | null => (r && typeof r === 'object' ? ((r as Doc).id as number) : typeof r === 'number' ? r : null)
const STARE: Record<string, StareDrum> = { closed: 'closed', works: 'works', queue: 'slow', ok: 'ok' }
const AVARIE: Record<string, Out['k']> = { water: 'apa', power: 'curent', gas: 'gaz' }
export const ORASE: Record<string, Punct> = { ...(hartaDate.cities as unknown as Record<string, Punct>), ...ORASE_EXTRA }

export function imagine(im: Doc | undefined, media: Map<number, Doc>): Img {
  const f = im?.file ? media.get(idDe(im.file) as number) : null
  const src = (f && (f.sizes?.card?.url || f.url)) || im?.src || '/img/35-date-700.jpg'
  return { src, alt: im?.alt || f?.alt || '', caption: im?.caption || undefined, credit: im?.credit || f?.credit || undefined, chart: im?.chart || undefined }
}

const activ = (d: Doc, acum: number, inainte = 36 * 3600e3) => (!d.until || Date.parse(d.until) > acum) && (!d.from || Date.parse(d.from) < acum + inainte)

let cache: Snap | null = null
let murdar = true
let inCurs: Promise<Snap> | null = null
const VALABIL = 60_000

export function invalideazaDate() { murdar = true }

export async function payloadul(): Promise<Payload> {
  return getPayload({ config })
}

export async function date(): Promise<Snap> {
  if (cache && !murdar && Date.now() - cache.t < VALABIL) return cache
  if (!inCurs) {
    inCurs = incarca().then((s) => { cache = s; murdar = false; return s }).finally(() => { inCurs = null })
  }
  // daca avem un instantaneu vechi, il servim cat timp se reincarca (nu blocam pagina)
  if (cache && Date.now() - cache.t < 10 * VALABIL && !murdar) return cache
  return inCurs
}

async function incarca(): Promise<Snap> {
  const payload = await payloadul()
  const acum = Date.now()
  const azi = ziRO(new Date(acum))
  const toate = { pagination: false as const, depth: 0 }
  const [rg, ct, sc, au, ar, re, tt, ou, wa, wc, ep, fp, ph, jb, fpg, mo, si, lv, pg] = await Promise.all([
    payload.find({ collection: 'regions', ...toate, sort: 'order' }),
    payload.find({ collection: 'counties', ...toate, sort: 'name' }),
    payload.find({ collection: 'sections', ...toate, sort: 'order' }),
    payload.find({ collection: 'authors', ...toate }),
    payload.find({
      collection: 'articles', depth: 0, limit: 500, sort: '-publishedAt', overrideAccess: false,
      where: { and: [{ _status: { equals: 'published' } }, { publishedAt: { greater_than: new Date(acum - 45 * 864e5).toISOString() } }] },
      select: { body: false, sources: false, corrections: false, updates: false } as never,
    }),
    payload.find({ collection: 'road-events', ...toate }),
    payload.find({ collection: 'travel-times', ...toate, sort: 'order' }),
    payload.find({ collection: 'outages', ...toate }),
    payload.find({ collection: 'weather-alerts', ...toate }),
    payload.find({ collection: 'weather', ...toate }),
    payload.find({ collection: 'energy-prices', depth: 0, limit: 10, sort: '-day', where: { day: { less_than_equal: ziPlus(azi, 1) } } }),
    payload.find({ collection: 'fuel-prices', depth: 0, limit: 2000, sort: '-day', where: { day: { greater_than_equal: ziPlus(azi, -10), less_than_equal: azi } } }),
    payload.find({ collection: 'pharmacies', depth: 0, limit: 2000, where: { day: { equals: azi } } }),
    payload.find({ collection: 'jobs', depth: 0, limit: 2000, sort: '-createdAt', where: { active: { equals: true } } }),
    payload.find({ collection: 'frontpages', ...toate }),
    payload.findGlobal({ slug: 'momentul', depth: 0 }),
    payload.findGlobal({ slug: 'site', depth: 0 }),
    payload.find({ collection: 'liveblogs', depth: 0, limit: 20, sort: '-publishedAt', overrideAccess: false, where: { _status: { equals: 'published' } } }),
    payload.find({ collection: 'pages', ...toate, select: { slug: true, title: true } as never }),
  ])

  // ——— structura
  const regKeyById = new Map<number, CheieRegiune>()
  for (const r of rg.docs as Doc[]) regKeyById.set(r.id, r.mapKey)
  const juds: Jud[] = (ct.docs as Doc[]).map((c) => ({
    id: c.id, slug: c.slug, name: c.name, mapKey: c.mapKey, seat: c.seat, regId: idDe(c.region) as number,
    regKey: regKeyById.get(idDe(c.region) as number) as CheieRegiune, jobsActive: typeof c.jobsActive === 'number' ? c.jobsActive : null,
  }))
  const judById = new Map(juds.map((j) => [j.id, j]))
  const regs: Reg[] = (rg.docs as Doc[]).filter((r) => r.launched).map((r) => ({
    id: r.id, slug: r.slug, key: r.mapKey, name: r.name, short: r.short, city: r.city, cityKey: r.cityKey,
    refCounty: judById.get(idDe(r.refCounty) as number) || null,
    sponsor: r.sponsor?.name && (!r.sponsor.until || Date.parse(r.sponsor.until) > acum) ? { name: r.sponsor.name, line: r.sponsor.line || undefined, url: r.sponsor.url || undefined } : null,
    counties: juds.filter((j) => j.regId === r.id),
  }))
  const secs: Sec[] = (sc.docs as Doc[]).map((s) => ({ id: s.id, slug: s.slug, name: s.name, desc: s.desc || undefined }))
  const secById = new Map(secs.map((s) => [s.id, s]))
  const auts: Aut[] = (au.docs as Doc[]).map((a) => ({ id: a.id, slug: a.slug, name: a.name, role: a.role || undefined, base: a.base || undefined, bio: a.bio || undefined, initials: a.initials || undefined, beat: a.beat || undefined }))
  const autById = new Map(auts.map((a) => [a.id, a]))

  // ——— imaginile incarcate (doar cele folosite)
  const mediaIds = [...new Set((ar.docs as Doc[]).map((a) => idDe(a.image?.file)).filter(Boolean))] as number[]
  const media = new Map<number, Doc>()
  if (mediaIds.length) for (const m of (await payload.find({ collection: 'media', depth: 0, pagination: false, where: { id: { in: mediaIds } } })).docs as Doc[]) media.set(m.id, m)

  const arts: Art[] = (ar.docs as Doc[]).map((a) => {
    const sec = secById.get(idDe(a.section) as number) || { id: 0, slug: 'stiri', name: 'Știri' }
    const counties = ((a.counties || []) as unknown[]).map((c) => judById.get(idDe(c) as number)).filter(Boolean) as Jud[]
    const pl = a.place
    return {
      id: a.id, slug: a.slug, title: a.title, seoTitle: a.seoTitle || undefined, dek: a.dek || '', sec, label: a.label || sec.name,
      regKey: (regKeyById.get(idDe(a.region) as number) || '') as Art['regKey'], counties,
      place: pl && typeof pl.lat === 'number' && typeof pl.lon === 'number' ? { name: pl.name || '', x: P(pl.lon, pl.lat)[0], y: P(pl.lon, pl.lat)[1] } : null,
      img: imagine(a.image, media), pub: new Date(a.publishedAt || a.createdAt), upd: new Date(a.updatedAt), prio: a.priority ?? 3, type: a.type || 'stire',
      authors: ((a.authors || []) as unknown[]).map((x) => autById.get(idDe(x) as number)).filter(Boolean) as Aut[],
      min: a.readingTime || 2,
    }
  })

  // ——— pozitia pe harta: coordonate sau resedinta judetului
  const poz = (d: Doc, cty: Jud | undefined): Punct => {
    if (typeof d.lat === 'number' && typeof d.lon === 'number') return P(d.lon, d.lat)
    const k = cty ? fara(cty.seat) : ''
    return ORASE[k] || (cty ? ((hartaDate.counties as Doc)[cty.mapKey]?.c as Punct) : [500, 350]) || [500, 350]
  }

  const ev: Ev[] = (re.docs as Doc[]).filter((d) => activ(d, acum)).map((d) => {
    const cty = judById.get(idDe(d.county) as number) as Jud
    const [x, y] = poz(d, cty)
    const st = STARE[d.status] || 'ok'
    const lab = d.label || (st === 'ok' ? 'normal' : d.delayMinutes ? `+${d.delayMinutes} min` : st === 'closed' ? 'închis' : st === 'works' ? 'lucrări' : 'aglomerat')
    return { id: d.id, road: d.road, a: eAutostrada(d.road), where: d.segment, what: d.what, st, lab, regKey: cty?.regKey, cty, x, y, seg: (d.mapSegment || []) as string[] }
  }).filter((e) => e.cty)

  const out: Out[] = (ou.docs as Doc[]).filter((d) => activ(d, acum, 72 * 3600e3)).map((d) => {
    const cty = judById.get(idDe(d.county) as number) as Jud
    const [x, y] = poz(d, cty)
    return { id: d.id, k: AVARIE[d.kind] || 'apa', t: d.title, d: d.area, city: d.city, regKey: cty?.regKey, cty, x, y }
  }).filter((o) => o.cty)

  const wx: Wx[] = (wc.docs as Doc[]).map((d) => {
    const cty = judById.get(idDe(d.county) as number)
    const [x, y] = ORASE[d.mapKey] || poz(d, cty)
    return { city: d.city, key: d.mapKey, temp: d.temp, w: d.cond, cond: d.condText || '', level: d.level, hours: (d.hours || []).map((o: Doc) => ({ h: o.h, t: o.t })), regKey: cty?.regKey || '', x, y }
  })

  const alerte: Alerta[] = (wa.docs as Doc[]).filter((d) => activ(d, acum, 24 * 3600e3)).map((d) => ({
    id: d.id, code: d.code, phen: d.phenomenon, text: d.text, roads: d.roads || '',
    counties: ((d.counties || []) as unknown[]).map((c) => judById.get(idDe(c) as number)).filter(Boolean) as Jud[],
    from: d.from ? new Date(d.from) : null,
  }))

  const ens = (ep.docs as Doc[]).map((d) => ({ day: d.day as string, values: parseazaValori(d.values), source: d.source || 'OPCOM' })).filter((d) => d.values.length === 24)
  const pret = ens.find((d) => d.day <= azi) || null
  const pretMaine = ens.find((d) => d.day === ziPlus(azi, 1)) || null

  const fuel = new Map<string, { azi: Fuel; ieri: Fuel | null }>()
  const peJudet = new Map<number, Doc[]>()
  for (const d of fp.docs as Doc[]) { const k = idDe(d.county) as number; if (!peJudet.has(k)) peJudet.set(k, []); peJudet.get(k)!.push(d) }
  const f2 = (d: Doc): Fuel => ({ day: d.day, petrol: d.petrol, diesel: d.diesel, lpg: d.lpg ?? 0, note: d.cheapestNote || undefined })
  for (const [k, l] of peJudet) { const j = judById.get(k); if (j) fuel.set(j.slug, { azi: f2(l[0]), ieri: l[1] ? f2(l[1]) : null }) }
  const medie = (sel: (f: { azi: Fuel; ieri: Fuel | null }) => Fuel | null): [number, number, number] | null => {
    const l = [...fuel.values()].map(sel).filter(Boolean) as Fuel[]
    if (!l.length) return null
    const m = (f: (x: Fuel) => number) => Math.round((l.reduce((a, x) => a + f(x), 0) / l.length) * 100) / 100
    return [m((x) => x.petrol), m((x) => x.diesel), m((x) => x.lpg)]
  }
  const fuelNat = { azi: medie((f) => f.azi) || [0, 0, 0] as [number, number, number], ieri: medie((f) => f.ieri) }

  const jobs: Job[] = (jb.docs as Doc[]).filter((d) => !d.deadline || Date.parse(d.deadline) > acum - 864e5).map((d) => {
    const cty = judById.get(idDe(d.county) as number) as Jud
    const lei = (n: number) => n.toLocaleString('ro-RO')
    const pay = d.salaryMin && d.salaryMax && d.salaryMax !== d.salaryMin ? `${lei(d.salaryMin)}–${lei(d.salaryMax)} lei net` : d.salaryMin || d.salaryMax ? `${lei(d.salaryMin || d.salaryMax)} lei net` : 'Salariu negociabil'
    return {
      id: d.id, slug: d.slug, title: d.title, employer: d.employer, city: d.city, cty, regKey: cty?.regKey,
      pay: d.salaryNote ? `${pay} ${d.salaryNote}` : pay, where: d.where || '',
      description: d.description || undefined, requirements: d.requirements || undefined, applyEmail: d.applyEmail || undefined, applyUrl: d.applyUrl || undefined,
      deadline: d.deadline ? new Date(d.deadline) : null, promo: !!d.promoted && !!d.promotedUntil && Date.parse(d.promotedUntil) > acum,
      source: d.source || 'direct', sourceUrl: d.sourceUrl || undefined, created: new Date(d.createdAt),
    }
  }).filter((j) => j.cty)

  const farm: Farm[] = (ph.docs as Doc[]).map((d) => ({ name: d.name, city: d.city, address: d.address, hours: d.hours, phone: d.phone || undefined, sponsor: !!d.sponsor, cty: judById.get(idDe(d.county) as number) as Jud })).filter((f) => f.cty)

  const timpi: Timp[] = (tt.docs as Doc[]).map((d) => ({ route: d.route, regKey: (regKeyById.get(idDe(d.region) as number) || '') as Timp['regKey'], duration: d.duration, delta: d.delta, st: STARE[d.status] || 'ok' }))

  const artById = new Map(arts.map((a) => [a.id, a]))
  const slugs = (l: unknown[] | undefined) => ((l || []) as unknown[]).map((x) => artById.get(idDe(x) as number)?.slug).filter(Boolean) as string[]
  const prima = new Map<string, Prima>()
  for (const d of fpg.docs as Doc[]) {
    prima.set(d.edition, {
      top: artById.get(idDe(d.top) as number)?.slug, catchUp: slugs(d.catchUp), seven: slugs(d.seven), most: slugs(d.most),
      callouts: ((d.callouts || []) as Doc[]).map((c) => ({ slug: artById.get(idDe(c.article) as number)?.slug as string, dx: c.dx ?? 20, dy: c.dy ?? -60 })).filter((c) => c.slug),
    })
  }
  const m = mo as Doc
  const fraze: Fraza[] = ((m.items || []) as Doc[]).filter((i) => !i.until || Date.parse(i.until) > acum).map((i) => ({ edition: i.edition, greeting: i.greeting || undefined, phrase: i.phrase || undefined }))

  const live: Live[] = (lv.docs as Doc[]).map((l) => {
    const ultim = ((l.entries || []) as Doc[]).map((e) => Date.parse(e.at)).sort((a, b) => b - a)[0]
    return { slug: l.slug, title: l.title, dek: l.dek || '', active: l.liveState === 'activ', regKey: (regKeyById.get(idDe(l.region) as number) || '') as Live['regKey'], pub: new Date(l.publishedAt || l.createdAt), img: imagine(l.image, media), last: ultim ? new Date(ultim) : null }
  })

  const s = si as Doc
  return {
    t: Date.now(),
    regs, regByKey: new Map(regs.map((r) => [r.key, r])), regBySlug: new Map(regs.map((r) => [r.slug, r])),
    juds, judBySlug: new Map(juds.map((j) => [j.slug, j])),
    secs, secBySlug: new Map(secs.map((x) => [x.slug, x])),
    auts, autBySlug: new Map(auts.map((x) => [x.slug, x])),
    arts, artBySlug: new Map(arts.map((a) => [a.slug, a])),
    ev, out, wx, alerte, pret, pretMaine, fuel, fuelNat, jobs, farm, timpi, prima, fraze,
    nextUpdate: m.nextUpdate || 'Următoarea actualizare mare: ediția de seară, la 18:00.',
    pensie: { pct: typeof m.pensionPct === 'number' ? m.pensionPct : 6.1, from: m.pensionFrom || '1 ianuarie 2027' },
    live,
    site: { name: s.name || 'Cadranul', tagline: s.tagline || 'România, oră de oră.', publisher: s.publisher || {} },
    pagini: (pg.docs as Doc[]).map((p) => ({ slug: p.slug, title: p.title })),
  }
}
