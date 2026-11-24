// Motorul importurilor: registrul surselor, rularea unui conector, scrierea idempotenta in colectii,
// jurnalul, alerta la esecuri repetate si reincarcarea instantaneului site-ului.
import type { Payload } from 'payload'
import { semnaturaReincarcare } from './semnatura'
import { CONECTORI, conector } from './conectori'
import { descarcator, type CacheHttp, type FetchFn } from './http'
import { laOraRO, ziRO } from '../site/timp'
import type { Conector, Element } from './tipuri'

type Doc = Record<string, any>
const CTX = { surse: true, importDemo: true }

export type OptiuniRulare = {
  dryRun?: boolean
  /** pentru teste: fetch inlocuit (fixture). Doar cu el poate rula, offline, un conector care inca nu are acordul sursei. */
  fetchImpl?: FetchFn
  acum?: Date
  /** pentru teste: ignora comutatorul de oprire */
  fortat?: boolean
  robots?: boolean
  invalideaza?: boolean
  log?: (m: string) => void
}
export type Raport = {
  key: string; status: 'ok' | 'neschimbat' | 'eroare' | 'oprit'
  created: number; updated: number; expired: number; skipped: number; deleted: number
  mesaj: string; schimbari: string[]; ms: number
}

// ——— comutatorul global din mediu: SURSE_OPRITE=all sau o lista de conectori
export function opritDinMediu(key: string) {
  const v = (process.env.SURSE_OPRITE || '').trim().toLowerCase()
  if (!v) return false
  if (['1', 'true', 'all', 'toate', 'da'].includes(v)) return true
  return v.split(/[,\s]+/).includes(key)
}

// ——— registrul
export async function asiguraRegistru(payload: Payload): Promise<Map<string, Doc>> {
  const ex = await payload.find({ collection: 'data-sources', pagination: false, depth: 0, overrideAccess: true })
  const peKey = new Map((ex.docs as Doc[]).map((d) => [d.key, d]))
  for (const c of CONECTORI) {
    const d = peKey.get(c.key)
    const statice = { name: c.name, schedule: c.frecventaText, requestLetter: c.cerere || '' }
    if (!d) {
      const nou = await payload.create({
        collection: 'data-sources', overrideAccess: true, context: CTX,
        data: { key: c.key, ...statice, enabled: c.pornitImplicit && c.legal !== 'needs_permission', legalStatus: c.legal, url: '', termsUrl: c.termsUrl, attribution: c.atribuire, notes: c.note || '', consecutiveFailures: 0 } as never,
      })
      peKey.set(c.key, nou as Doc)
    } else if (d.name !== statice.name || d.schedule !== statice.schedule || (d.requestLetter || '') !== statice.requestLetter || !d.notes || !d.termsUrl) {
      const extra = { ...(!d.notes ? { notes: c.note || '' } : {}), ...(!d.termsUrl ? { termsUrl: c.termsUrl } : {}), ...(!d.attribution ? { attribution: c.atribuire } : {}) }
      peKey.set(c.key, await payload.update({ collection: 'data-sources', id: d.id, data: { ...statice, ...extra } as never, overrideAccess: true, context: CTX }) as Doc)
    }
  }
  return peKey
}

// ——— scrierea
const iso = (v: unknown) => (v == null || v === '' ? null : new Date(v as string).toISOString())
const idDe = (r: unknown) => (r && typeof r === 'object' ? (r as Doc).id : r)
function egal(camp: string, a: unknown, b: unknown, rulant: boolean): boolean {
  if (camp === 'from' || camp === 'until') {
    const x = iso(a), y = iso(b)
    if (x === y) return true
    if (!x || !y) return false
    // intervalele „rulante” (drumuri) se prelungesc la fiecare rulare: nu rescriem documentul pentru mai putin de 2 ore
    return rulant && camp === 'until' && Math.abs(Date.parse(x) - Date.parse(y)) < 2 * 3600e3
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    const x = ((a as unknown[]) || []).map((v) => String(idDe(v))).sort(), y = ((b as unknown[]) || []).map((v) => String(idDe(v))).sort()
    return x.join('|') === y.join('|')
  }
  if (camp === 'county') return String(idDe(a) ?? '') === String(idDe(b) ?? '')
  if ((a == null || a === '') && (b == null || b === '')) return true
  if (typeof a === 'number' || typeof b === 'number') return Math.abs(Number(a) - Number(b)) < 1e-9
  return String(a) === String(b)
}

export async function scrie(payload: Payload, con: Conector, elemente: Element[], opt: { dryRun?: boolean; acum: Date; log: (m: string) => void }) {
  const r = { created: 0, updated: 0, expired: 0, skipped: 0, deleted: 0, schimbari: [] as string[] }
  const col = con.collection
  const jud = new Map(((await payload.find({ collection: 'counties', pagination: false, depth: 0, overrideAccess: true })).docs as Doc[]).map((d) => [d.slug, d.id]))
  const ale = (await payload.find({ collection: col, pagination: false, depth: 0, overrideAccess: true, where: { importer: { equals: con.key } } as never })).docs as Doc[]
  const peExt = new Map(ale.map((d) => [d.externalId, d]))
  const vazute = new Set<string>()
  const rulant = con.collection === 'road-events'
  const titlu = (d: Doc) => String(d.text || d.title || d.road && `${d.road} ${d.segment}` || d.day && `${d.day}${d.county ? ` ${[...jud].find(([, id]) => id === idDe(d.county))?.[0] || ''}` : ''}` || '')

  for (const el of elemente) {
    if (vazute.has(el.externalId)) continue
    vazute.add(el.externalId)
    const data: Doc = { ...el.data, source: con.atribuire, importer: con.key, externalId: el.externalId, editedByHuman: false }
    if ('county' in data) { const id = jud.get(String(data.county)); if (!id) { r.skipped++; continue } data.county = id }
    if ('counties' in data) { data.counties = (data.counties as string[]).map((s) => jud.get(s)).filter(Boolean); if (!(data.counties as unknown[]).length) { r.skipped++; continue } }
    const ex = peExt.get(el.externalId)
    if (ex) {
      if (ex.editedByHuman) { r.skipped++; continue }
      delete data.from // pastram momentul primei aparitii
      const dif = Object.keys(data).filter((k) => !egal(k, ex[k], data[k], rulant))
      if (!dif.length) continue
      r.updated++; r.schimbari.push(`~ ${titlu({ ...ex, ...data })} [${dif.join(', ')}]`)
      if (!opt.dryRun) await payload.update({ collection: col, id: ex.id, data: data as never, overrideAccess: true, context: CTX, depth: 0 })
    } else {
      // documentele redactiei au intaietate (energie: o zi; carburanti: judet + zi)
      if (col === 'energy-prices' || col === 'fuel-prices') {
        const w: Doc = { day: { equals: data.day } }
        if (col === 'fuel-prices') w.county = { equals: data.county }
        const al = (await payload.find({ collection: col, where: w as never, limit: 1, depth: 0, overrideAccess: true })).docs[0] as Doc | undefined
        // continutul DEMONSTRATIV (seed) nu e al redactiei: datele reale il inlocuiesc
        const demo = al && !al.importer && !al.editedByHuman && /demonstrativ/i.test(String(al.source || ''))
        if (al && demo) {
          r.updated++; r.schimbari.push(`~ ${titlu(data)}: înlocuiesc cifrele demonstrative cu cele reale`)
          if (!opt.dryRun) await payload.update({ collection: col, id: al.id, data: data as never, overrideAccess: true, context: CTX, depth: 0 })
          continue
        }
        if (al) { r.skipped++; r.schimbari.push(`= ${titlu(data)}: există deja, scris de ${al.importer || 'redacție'}; nu-l ating`); continue }
      }
      r.created++; r.schimbari.push(`+ ${titlu(data)}`)
      if (!opt.dryRun) await payload.create({ collection: col, data: data as never, overrideAccess: true, context: CTX, depth: 0 })
    }
  }
  if (con.expiraLipsa) {
    for (const d of ale) {
      if (vazute.has(d.externalId) || d.editedByHuman) continue
      if (d.until && Date.parse(d.until) <= opt.acum.getTime()) {
        // curatenie: ce a expirat de peste 7 zile se sterge
        if (Date.parse(d.until) < opt.acum.getTime() - 7 * 864e5) {
          r.deleted++
          if (!opt.dryRun) await payload.delete({ collection: col, id: d.id, overrideAccess: true, context: CTX })
        }
        continue
      }
      r.expired++; r.schimbari.push(`- ${titlu(d)} (nu mai apare la sursă: expiră acum)`)
      if (!opt.dryRun) await payload.update({ collection: col, id: d.id, data: { until: opt.acum.toISOString() } as never, overrideAccess: true, context: CTX, depth: 0 })
    }
  }
  return r
}

// ——— alerta si reincarcarea site-ului
export const PRAG_ALERTA = () => Math.max(1, Number(process.env.SURSE_ALERTA_DUPA) || 3)

export async function alerteaza(key: string, esecuri: number, eroare: string, f: FetchFn = fetch) {
  const text = `Cadranul: sursa „${key}” a eșuat de ${esecuri} ori la rând. Ultima eroare: ${eroare}`
  console.error(`[surse] ALERTĂ ${text}`)
  const url = process.env.SURSE_ALERT_WEBHOOK
  if (!url) return
  try {
    await f(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, conector: key, esecuri, eroare }), signal: AbortSignal.timeout(10000) })
  } catch (e) { console.error(`[surse] webhook-ul de alertă nu a răspuns: ${(e as Error).message}`) }
}

export { semnaturaReincarcare }

/** Cere serverului site-ului sa-si reincarce instantaneul (altfel se reincarca singur in cel mult 60 de secunde). */
export async function invalideazaSite(f: FetchFn = fetch, log: (m: string) => void = console.log) {
  const baza = process.env.SURSE_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  try {
    const r = await f(`${baza.replace(/\/$/, '')}/intern/reincarca-date`, { method: 'POST', headers: { 'x-cadranul-semnatura': semnaturaReincarcare() }, signal: AbortSignal.timeout(5000) })
    if (!r.ok) log(`site-ul a răspuns ${r.status} la reîncărcare (se reîncarcă singur în 60 s)`)
    return r.ok
  } catch {
    log('site-ul nu răspunde acum; harta se actualizează singură în cel mult 60 de secunde')
    return false
  }
}

// ——— o rulare
export async function ruleazaConector(payload: Payload, key: string, opt: OptiuniRulare = {}): Promise<Raport> {
  const con = conector(key)
  if (!con) throw new Error(`Conector necunoscut: ${key}. Disponibili: ${CONECTORI.map((c) => c.key).join(', ')}`)
  const log = opt.log || ((m: string) => console.log(`[surse:${key}] ${m}`))
  const acum = opt.acum || new Date()
  const t0 = Date.now()
  const reg = (await asiguraRegistru(payload)).get(key)!
  const raport: Raport = { key, status: 'ok', created: 0, updated: 0, expired: 0, skipped: 0, deleted: 0, mesaj: '', schimbari: [], ms: 0 }

  const motivOprit = opt.fortat ? '' : opritDinMediu(key) ? 'oprit din mediu (SURSE_OPRITE)' : !reg.enabled ? 'oprit din registru (/admin › Surse de date)' : ''
  const faraAcord = reg.legalStatus === 'needs_permission' && !opt.fetchImpl
  if (motivOprit || faraAcord) {
    raport.status = 'oprit'
    raport.mesaj = faraAcord ? `nu rulează: sursa necesită acord (${reg.requestLetter || 'docs/cereri-acces/'}); după răspuns, schimbă statutul legal în /admin` : motivOprit
    log(raport.mesaj)
    return raport
  }

  const cache: CacheHttp = { ...((reg.httpCache as CacheHttp) || {}) }
  const descarca = descarcator(opt.fetchImpl || fetch, cache, { robots: opt.robots ?? !opt.fetchImpl, pauzaMs: opt.fetchImpl ? 1 : 2000 })
  let esecuri = Number(reg.consecutiveFailures) || 0
  try {
    const memorie = { ...((cache as Record<string, unknown>).__memorie as Record<string, string> || {}) }
    const rez = await con.ruleaza({ url: reg.url || con.url, acum, descarca, log, pauzaMs: opt.fetchImpl ? 0 : undefined, memorie })
    ;(cache as Record<string, unknown>).__memorie = memorie
    if (rez.neschimbat) {
      raport.status = 'neschimbat'; raport.mesaj = 'sursa nu are nimic nou (304)'
    } else {
      const s = await scrie(payload, con, rez.elemente, { dryRun: opt.dryRun, acum, log })
      Object.assign(raport, s)
      const n = s.created + s.updated + s.expired
      raport.status = n ? 'ok' : 'neschimbat'
      raport.mesaj = `${rez.elemente.length} la sursă: ${s.created} noi, ${s.updated} actualizate, ${s.expired} expirate, ${s.skipped} lăsate neatinse${s.deleted ? `, ${s.deleted} șterse (vechi)` : ''}${rez.incomplet ? `; ${rez.incomplet}` : ''}`
    }
    esecuri = 0
    if (!opt.dryRun) {
      await payload.update({
        collection: 'data-sources', id: reg.id, overrideAccess: true, context: CTX,
        data: {
          lastRun: acum.toISOString(), lastStatus: raport.status, consecutiveFailures: 0, lastError: '', httpCache: cache,
          ...(rez.incomplet ? {} : { lastSuccess: acum.toISOString(), itemsWritten: raport.created + raport.updated + raport.expired }),
        } as never,
      })
    }
  } catch (e) {
    esecuri++
    raport.status = 'eroare'; raport.mesaj = (e as Error).message || String(e)
    log(`EROARE: ${raport.mesaj}`)
    if (!opt.dryRun) {
      await payload.update({ collection: 'data-sources', id: reg.id, overrideAccess: true, context: CTX, data: { lastRun: acum.toISOString(), lastStatus: 'eroare', consecutiveFailures: esecuri, lastError: raport.mesaj.slice(0, 2000) } as never })
      const N = PRAG_ALERTA()
      if (esecuri === N || (esecuri > N && (esecuri - N) % 10 === 0)) await alerteaza(key, esecuri, raport.mesaj)
    }
  }
  raport.ms = Date.now() - t0
  if (!opt.dryRun) {
    await payload.create({
      collection: 'source-runs', overrideAccess: true, context: CTX,
      data: { connector: key, startedAt: acum.toISOString(), durationMs: raport.ms, status: raport.status, dryRun: false, created: raport.created, updated: raport.updated, expired: raport.expired, skipped: raport.skipped, message: raport.mesaj } as never,
    })
    if (raport.created + raport.updated + raport.expired > 0 && opt.invalideaza !== false) await invalideazaSite(fetch, log)
  }
  log(`${raport.status}: ${raport.mesaj}`)
  return raport
}

/** Toate sursele pornite (cele oprite sunt doar raportate). */
export async function ruleazaToate(payload: Payload, opt: OptiuniRulare = {}) {
  const l: Raport[] = []
  for (const c of CONECTORI) l.push(await ruleazaConector(payload, c.key, opt))
  return l
}

// ——— planificarea (folosita de worker)
export function eScadent(con: Conector, reg: Doc, acum: Date): boolean {
  const esec = Math.min(Number(reg.consecutiveFailures) || 0, 4)
  const ultima = reg.lastRun ? Date.parse(reg.lastRun) : 0
  const p = con.planificare
  if ('laMinute' in p) return acum.getTime() - ultima >= Math.min(p.laMinute * 60e3 * 2 ** esec, 6 * 3600e3)
  if (!reg.lastSuccess) return acum.getTime() - ultima >= p.reincearcaMinute * 60e3
  const azi = ziRO(acum)
  const start = laOraRO(azi, p.zilnicDupa).getTime(), stop = laOraRO(azi, p.pana).getTime()
  if (acum.getTime() < start || acum.getTime() > stop) return false
  if (Date.parse(reg.lastSuccess) >= start) return false
  return acum.getTime() - ultima >= p.reincearcaMinute * 60e3 * 2 ** Math.min(esec, 3)
}

export async function curataJurnal(payload: Payload, zile = 30) {
  await payload.delete({ collection: 'source-runs', overrideAccess: true, where: { startedAt: { less_than: new Date(Date.now() - zile * 864e5).toISOString() } } as never })
}
