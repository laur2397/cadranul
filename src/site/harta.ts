import 'server-only'
import hartaDate from '../shared/harta-date.json'
import { ORDINE, P, RETEA, ETICHETA_REGIUNE, D, fara, fitVB, smooth, type Punct, type StareDrum } from '../shared/harta'
import { fmt, scurt } from '../shared/format'
import { h, raw, type Safe } from './html'
import { ORASE, type Art, type Reg, type Snap } from './date'
import { cand } from './timp'
import { ic } from './shell'

type Doc = Record<string, any>
const M = hartaDate as unknown as { counties: Record<string, { d: string; r: string; c: Punct }>; regions: Record<string, string>; bbox: Record<string, [number, number, number, number]>; country: string; danube: Punct[] }

const RANG: Record<StareDrum, number> = { ok: 0, slow: 1, works: 2, closed: 3 }
export const STRAT = [['stiri', 'Știri', 'news'], ['drumuri', 'Drumuri', 'road'], ['vreme', 'Vremea', 'weather'], ['avarii', 'Avarii', 'outage'], ['joburi', 'Joburi', 'jobs']] as const
export type Strat = (typeof STRAT)[number][0]

export const inEditie = (ed: Reg | null) => (k: string) => !ed || k === ed.key

/** Starea fiecarui tronson de pe harta, din evenimentele active (cea mai grava castiga) */
function stariTronsoane(snap: Snap): Map<string, StareDrum> {
  const st = new Map<string, StareDrum>()
  for (const e of snap.ev) for (const g of e.seg) if (RANG[e.st] > RANG[st.get(g) || 'ok']) st.set(g, e.st)
  return st
}

const pozitie = (k: string | Punct): Punct => (Array.isArray(k) ? P(k[0], k[1]) : ORASE[k])

/** Harta SVG (relief, regiuni, judete, Dunarea, drumuri), ca buildMap() din prototip */
export function hartaSVG(snap: Snap, ed: Reg | null): Safe {
  const vb = fitVB(ed ? M.bbox[ed.key] : undefined, ed?.key)
  const coduri = new Map<string, string>()
  const RANG_COD: Record<string, number> = { yellow: 1, orange: 2, red: 3 }
  for (const a of snap.alerte) for (const c of a.counties) if ((RANG_COD[a.code] || 0) > (RANG_COD[coduri.get(c.mapKey) || ''] || 0)) coduri.set(c.mapKey, a.code)
  const fill = (n: string) => ({ yellow: 'url(#hatch)', orange: 'url(#hatchO)', red: 'url(#hatchR)' })[coduri.get(n) || ''] || 'none'
  const stari = stariTronsoane(snap)
  const mare = smooth([[28.66, 43.74], [28.55, 44.3], [28.85, 44.9], [29.6, 45.12], [29.9, 45.32], [34, 45.32], [34, 42.6], [28.75, 42.6]].map((c) => P(c[0], c[1])))
  const svg = `<defs>
    <clipPath id="ro"><path d="${M.country}"/></clipPath>
    <filter id="seablur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14"/></filter>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F2B705" fill-opacity=".16"/><line x1="0" y1="0" x2="0" y2="9" stroke="#E2A800" stroke-width="3.2" stroke-opacity=".55"/></pattern>
    <pattern id="hatchO" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#EE7A0C" fill-opacity=".18"/><line x1="0" y1="0" x2="0" y2="9" stroke="#D96500" stroke-width="3.2" stroke-opacity=".6"/></pattern>
    <pattern id="hatchR" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#D3242B" fill-opacity=".18"/><line x1="0" y1="0" x2="0" y2="9" stroke="#B81D23" stroke-width="3.2" stroke-opacity=".6"/></pattern>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0E1E2C" flood-opacity=".14"/></filter>
    <linearGradient id="seag" gradientUnits="userSpaceOnUse" x1="860" y1="0" x2="1000" y2="0"><stop offset="0" stop-color="var(--sea)"/><stop offset="1" stop-color="var(--sea)" stop-opacity="0"/></linearGradient>
  </defs>
  <path class="sea" fill="url(#seag)" d="${mare}Z"/>
  <path d="${M.country}" fill="var(--land)" filter="url(#shadow)"/>
  <g id="regs">${ORDINE.map((r, i) => { const R = snap.regByKey.get(r); return `<path class="reg${ed?.key === r ? ' sel' : ''}" data-r="${r}" data-href="/editie/${R?.slug || ''}" d="${M.regions[r]}" tabindex="0" role="link" aria-label="Ediția ${R?.name || r}" style="animation-delay:${i * 60}ms"/>` }).join('')}</g>
  <image class="relief-img" clip-path="url(#ro)" href="/map/relief.jpg" x="0" y="0" width="1000" height="704" preserveAspectRatio="none" style="pointer-events:none"/>
  <g clip-path="url(#ro)" style="pointer-events:none"><g>${Object.entries(M.counties).filter(([n]) => coduri.has(n)).map(([n, c]) => `<path class="hatch" d="${c.d}" fill="${fill(n)}"/>`).join('')}</g></g>
  <path id="dimmask" class="dimmask" fill-rule="evenodd" d="${ed ? 'M-2000,-2000H3000V3000H-2000Z' + M.regions[ed.key] : ''}"/>
  <g>${Object.entries(M.counties).map(([n, c]) => `<path class="cty${ed && c.r === ed.key ? ' in' : ''}" data-c="${n}" data-r="${c.r}" d="${c.d}"/>`).join('')}</g>
  <path class="danube" d="${smooth(M.danube)}"/>
  <path class="selo" id="selo" d="${ed ? M.regions[ed.key] : ''}"/>
  <g id="roads">${RETEA.map((r) => { const d = smooth(r.p.map(pozitie)); return `<path class="road base ${r.mw ? 'mw' : ''}" d="${d}"/><path class="road st ${stari.get(r.id) || 'ok'}" d="${d}"/>` }).join('')}</g>`
  return h`<svg id="map" viewBox="${vb.map((x) => x.toFixed(2)).join(' ')}" role="group" aria-label="Harta României cu cele 8 regiuni. Apasă o regiune ca să deschizi ediția ei.">${raw(svg)}</svg>`
}

export type ContextHarta = { stiri: Art[]; noi: Set<string>; callouts: { slug: string; dx: number; dy: number }[]; acum: Date; layer?: Strat }

/** Datele pentru straturile hartii (le deseneaza scriptul din browser, ca in prototip) */
export function dateHarta(snap: Snap, ed: Reg | null, ctx: ContextHarta) {
  const ok = inEditie(ed)
  const ctys: Record<string, [string, number, number, string]> = {}
  for (const [n, c] of Object.entries(M.counties)) ctys[n] = [c.r, c.c[0], c.c[1], snap.juds.find((j) => j.mapKey === n)?.name || D(n)]
  const jobsCty: Record<string, number> = {}
  for (const j of snap.juds) jobsCty[j.mapKey] = j.jobsActive ?? snap.jobs.filter((x) => x.cty.id === j.id).length
  const jobsReg: Record<string, number> = {}
  for (const r of snap.regs) jobsReg[r.key] = r.counties.reduce((a, j) => a + (jobsCty[j.mapKey] || 0), 0)
  const tips: Record<string, [number | null, number, number]> = {}
  for (const r of snap.regs) {
    const w = snap.wx.find((x) => x.key === r.cityKey)
    tips[r.key] = [w ? w.temp : null, snap.out.filter((o) => o.regKey === r.key).length, snap.arts.filter((a) => a.regKey === r.key && ctx.noi.has(a.slug)).length]
  }
  const joburi = snap.jobs.filter((j) => ok(j.regKey)).sort((a, b) => +b.promo - +a.promo || +b.created - +a.created).slice(0, 6)
  const coduri = snap.alerte.filter((a) => !ed || a.counties.some((c) => c.regKey === ed.key))
  return {
    layer: ctx.layer || 'stiri',
    vb: fitVB(ed ? M.bbox[ed.key] : undefined, ed?.key),
    bbox: M.bbox, rp: ETICHETA_REGIUNE, cities: ORASE, ctys,
    stiri: ctx.stiri.filter((a) => a.place).map((a) => ({ id: a.slug, t: a.title, img: a.img.src, x: Math.round(a.place!.x * 10) / 10, y: Math.round(a.place!.y * 10) / 10, at: a.place!.name, time: cand(a.pub, ctx.acum), nw: ctx.noi.has(a.slug) ? 1 : 0, r: a.regKey })),
    callouts: ctx.callouts.map((c) => [c.slug, c.dx, c.dy]),
    ev: snap.ev.map((e) => ({ road: e.road, a: e.a ? 1 : 0, where: e.where, what: e.what, st: e.st, lab: e.lab, r: e.regKey, x: e.x, y: e.y })),
    out: snap.out.map((o) => ({ k: o.k, t: o.t, d: o.d, city: o.city, r: o.regKey, x: o.x, y: o.y })),
    wx: snap.wx.map((w) => ({ c: w.key, city: w.city, t: w.temp, w: w.w, cond: w.cond, lvl: w.level === 'principal' ? 0 : w.level === 'secundar' ? 1 : 2, x: w.x, y: w.y })),
    legVreme: coduri.length ? coduri.map((a) => a.text).join('; ') : 'Niciun cod meteo activ',
    nVreme: coduri.length,
    jobsReg, jobsCty,
    jobs: joburi.map((j) => ({ t: j.title, co: j.employer, pay: j.pay, pr: j.promo ? 1 : 0, href: `/joburi/${j.slug}` })),
    tips,
    cityKeys: Object.fromEntries(snap.regs.map((r) => [r.key, r.cityKey])),
    seats: ed ? ed.counties.map((c) => fara(c.seat)).filter((k) => ORASE[k]) : [],
  }
}

const contoare = (snap: Snap, ed: Reg | null, dh: ReturnType<typeof dateHarta>) => {
  const ok = inEditie(ed)
  return {
    stiri: dh.stiri.filter((s) => s.nw).length,
    drumuri: snap.ev.filter((e) => ok(e.regKey) && e.st !== 'ok').length,
    vreme: dh.nVreme,
    avarii: snap.out.filter((o) => ok(o.regKey)).length,
    joburi: ed ? dh.jobsReg[ed.key] : Object.values(dh.jobsReg).reduce((a, b) => a + b, 0),
  } as Record<Strat, number>
}

/** Blocul „instrument”: straturile, harta, legenda si lista sincronizata */
export function instrument(snap: Snap, ed: Reg | null, dh: ReturnType<typeof dateHarta>, actualizat: string): Safe {
  const c = contoare(snap, ed, dh)
  const L = dh.layer as Strat
  return h`<div class="inst" aria-label="Harta țării, acum">
  <div class="layers" role="tablist" aria-label="Ce arată harta" id="layers">${STRAT.map(([k, n, i]) => h`<button class="layer" role="tab" aria-selected="${L === k ? 'true' : 'false'}" data-l="${k}">${ic(i)}${n}${c[k] ? h` <span class="n">${k === 'joburi' ? scurt(c[k]) : String(c[k])}</span>` : ''}</button>`)}</div>
  <div class="mapbox l-${L}${ed ? ' zoomed dimmed' : ''}" id="mapbox">
    ${hartaSVG(snap, ed)}
    <script>${raw(`(function(){try{var f=sessionStorage.getItem('cad_fly');if(f){var m=document.getElementById('map');m.dataset.to=m.getAttribute('viewBox');m.setAttribute('viewBox',JSON.parse(f).join(' '))}}catch(e){}})()`)}</script>
    <div class="ov" id="ov"></div>
  </div>
  <div class="maplegend" id="legend"><span class="mapnote demo">Actualizat la ${actualizat}.</span></div>
  <div class="llist" id="llist" aria-live="polite"></div>
</div>`
}

/** Sumele pentru fraza automata si pentru carduri */
export const fmtJoburi = (n: number) => fmt(n)
export type DateHarta = ReturnType<typeof dateHarta>
export type { Doc }
