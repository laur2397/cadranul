// Integrare: conectorii ruleaza pe mostrele din tests/fixtures/surse (fetch inlocuit, fara internet) si scriu in baza
// de dezvoltare prin API-ul local Payload. Verificam ca harta primei pagini se schimba, ca a doua rulare nu mai scrie nimic,
// ca documentele redactiei nu sunt atinse si ca evenimentele disparute de la sursa expira. La final se sterge tot ce s-a scris.
// Sare peste daca baza nu raspunde (DATABASE_URI) sau daca nu e baza demonstrativa (NEXT_PUBLIC_DEMO=true).
import 'dotenv/config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import type { Payload } from 'payload'

const F = (n: string) => readFileSync(`tests/fixtures/surse/${n}`, 'utf8')
const KEYS = ['anm-avertizari', 'opcom-pzu', 'igpr-infotrafic', 'cnair-drumuri']
const COLECTII = ['weather-alerts', 'energy-prices', 'road-events'] as const

async function bazaRaspunde() {
  // doar pe baza demonstrativa: testul sterge la final documentele importate de ANM, OPCOM, IGPR si CNAIR
  if (!process.env.DATABASE_URI || process.env.NEXT_PUBLIC_DEMO !== 'true' || process.env.NODE_ENV === 'production') return false
  const { default: pg } = await import('pg')
  const c = new pg.Client({ connectionString: process.env.DATABASE_URI, connectionTimeoutMillis: 3000 })
  try { await c.connect(); await c.query('select 1 from data_sources limit 1'); return true } catch { return false } finally { await c.end().catch(() => {}) }
}
const ok = await bazaRaspunde()

const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']
const parti = (d: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((p) => [p.type, p.value]))
const roInterval = (a: Date, b: Date) => { const x = parti(a), y = parti(b); return `${+x.day} ${LUNI[+x.month - 1]}, ora ${x.hour} &#x2013; ${+y.day} ${LUNI[+y.month - 1]}, ora ${y.hour};` }

describe.skipIf(!ok)('surse -> baza -> harta (integrare)', () => {
  let payload: Payload
  let S: typeof import('../../src/site/date')
  let H: typeof import('../../src/site/harta')
  let R: typeof import('../../src/surse/rulare')
  const acum = new Date()
  // ANM: mostra reala, mutata in jurul orei de acum; Olt devine cod rosu
  const anm = F('anm-avertizari-2026-11-24.xml')
    .replace(/intervalul="24 noiembrie, ora 10 &#x2013; 24 noiembrie, ora 20;"/, `intervalul="${roInterval(new Date(acum.getTime() - 3600e3), new Date(acum.getTime() + 5 * 3600e3))}"`)
    .replace('cod="OT" culoare="1"', 'cod="OT" culoare="3"')
  const ziua = (d: Date) => { const p = parti(d); return `${p.day}/${p.month}/${p.year}` }
  const opcom = F('opcom-pip-2026-11-24.csv').replace('24/11/2026', ziua(acum))
  let igpr = F('igpr-infotrafic-2026-08-01.html')
  // CNAIR: fluxul RSS real, cu inchiderea DN67C mutata in ziua de azi
  const p0 = parti(acum)
  const cnair = F('cnair-rss-2026-11-24.xml').replace('Luni, 23 noiembrie, ora 10:30', `Azi, ${+p0.day} ${LUNI[+p0.month - 1]}, ora 00:05`).replace('Mon, 23 Nov 2026 08:41:00 +0000', new Date(acum.getTime() - 3600e3).toUTCString())
  const fetchMock = (async (url: string) => {
    if (url.includes('avertizari-nowcasting')) return new Response(F('anm-nowcasting-gol.xml'))
    if (url.includes('avertizari-xml')) return new Response(anm, { headers: { 'content-type': 'text/xml; charset=utf-8' } })
    if (url.includes('opcom')) return url.includes(`/${ziua(acum)}/`) ? new Response(opcom) : new Response('<html>nepublicat</html>')
    if (url.includes('info-trafic')) return new Response(igpr)
    if (url.includes('cnadnr')) return new Response(cnair)
    return new Response('', { status: 404 })
  }) as unknown as typeof fetch
  const opt = () => ({ fetchImpl: fetchMock, fortat: true, invalideaza: false, acum: new Date(), log: () => {} })

  async function curata() {
    for (const c of COLECTII) await payload.delete({ collection: c, overrideAccess: true, where: { importer: { in: KEYS } } as never })
    await payload.delete({ collection: 'source-runs', overrideAccess: true, where: { connector: { in: KEYS } } as never })
    await payload.delete({ collection: 'data-sources', overrideAccess: true, where: { key: { in: KEYS } } as never })
  }
  const harta = async () => { S.invalideazaDate(); const s = await S.date(); return { s, svg: String(H.hartaSVG(s, null)) } }

  beforeAll(async () => {
    const { getPayload } = await import('payload')
    const config = (await import('../../src/payload.config')).default
    payload = await getPayload({ config })
    S = await import('../../src/site/date')
    H = await import('../../src/site/harta')
    R = await import('../../src/surse/rulare')
    await curata()
  })
  afterAll(async () => { if (payload) await curata() })

  it('scrie avertizarile ANM si drumurile; harta se schimba', async () => {
    const inainte = await harta()
    expect(inainte.svg).not.toMatch(/fill="url\(#hatchR\)"/)

    const a = await R.ruleazaConector(payload, 'anm-avertizari', opt())
    expect(a.status).toBe('ok'); expect(a.created).toBe(3) // galben + rosu (Olt) + a doua avertizare
    const d = await R.ruleazaConector(payload, 'igpr-infotrafic', opt())
    expect(d.status).toBe('ok'); expect(d.created).toBeGreaterThanOrEqual(7)
    const c = await R.ruleazaConector(payload, 'cnair-drumuri', opt())
    expect(c.created).toBe(1) // doar DN67C; DN7C (octombrie) a expirat, restul comunicatelor nu privesc circulatia

    const dupa = await harta()
    expect(dupa.svg).toMatch(/fill="url\(#hatchR\)"/) // Olt in cod rosu
    expect(dupa.s.alerte.some((x) => x.imp && x.src === 'ANM' && x.code === 'red' && x.counties.some((j) => j.slug === 'olt'))).toBe(true)
    const ev = dupa.s.ev.find((e) => e.imp && e.road === 'DN67C')!
    expect(ev.st).toBe('closed'); expect(ev.src).toBe('CNAIR'); expect(ev.cty.slug).toBe('valcea'); expect(ev.seg).toEqual(['dn67c'])
    expect(dupa.svg).toMatch(/class="road st closed"/) // Transalpina inchisa pe harta
    const rulari = await payload.find({ collection: 'source-runs', where: { connector: { equals: 'anm-avertizari' } } as never, overrideAccess: true })
    expect(rulari.totalDocs).toBe(1)
    const reg = (await payload.find({ collection: 'data-sources', where: { key: { equals: 'anm-avertizari' } } as never, overrideAccess: true })).docs[0] as any
    expect(reg.lastStatus).toBe('ok'); expect(reg.itemsWritten).toBe(3); expect(reg.lastSuccess).toBeTruthy()
  })

  it('a doua rulare nu mai scrie nimic (idempotent)', async () => {
    for (const k of ['anm-avertizari', 'igpr-infotrafic', 'cnair-drumuri']) {
      const r = await R.ruleazaConector(payload, k, opt())
      expect(r.created + r.updated + r.expired, `${k}: ${r.schimbari.join(' | ')}`).toBe(0)
      expect(r.status).toBe('neschimbat')
    }
  })

  it('nu atinge datele redactiei: ziua de energie din seed ramane', async () => {
    const r = await R.ruleazaConector(payload, 'opcom-pzu', opt())
    const azi = (await payload.find({ collection: 'energy-prices', where: { day: { equals: `${parti(acum).year}-${parti(acum).month}-${parti(acum).day}` } } as never, overrideAccess: true })).docs[0] as any
    if (azi && !azi.importer) {
      expect(r.created).toBe(0); expect(r.skipped).toBe(1)
    } else {
      expect(r.created).toBe(1)
      const d = (await payload.find({ collection: 'energy-prices', where: { importer: { equals: 'opcom-pzu' } } as never, overrideAccess: true })).docs[0] as any
      expect(d.values.split(',').length).toBe(24); expect(d.quarterValues.split(',').length).toBe(96)
    }
    expect(r.mesaj).toMatch(/nu sunt încă publicate/) // maine: inca nepublicat
  })

  it('un document importat si modificat in /admin nu mai e suprascris; cele disparute la sursa expira', async () => {
    const dn7 = (await payload.find({ collection: 'road-events', where: { and: [{ importer: { equals: 'igpr-infotrafic' } }, { road: { equals: 'DN7' } }] } as never, overrideAccess: true })).docs[0] as any
    await payload.update({ collection: 'road-events', id: dn7.id, data: { what: 'Text corectat de redacție' } as never, user: { id: 1, roles: ['editor'], collection: 'users' } as never, overrideAccess: true })
    const dupaEdit = await payload.findByID({ collection: 'road-events', id: dn7.id, overrideAccess: true }) as any
    expect(dupaEdit.editedByHuman).toBe(true)
    // noul comunicat: DN7 schimbat, DN1 disparut
    igpr = igpr.replace('trafic intens în orașul Călimănești', 'circulație blocată în orașul Călimănești').replace(/<li>DN 1 Ploiești[^<]*<\/li>/, '')
    const r = await R.ruleazaConector(payload, 'igpr-infotrafic', opt())
    expect(r.expired).toBe(1)
    const tot = await payload.findByID({ collection: 'road-events', id: dn7.id, overrideAccess: true }) as any
    expect(tot.what).toBe('Text corectat de redacție')
    const dn1 = (await payload.find({ collection: 'road-events', where: { and: [{ importer: { equals: 'igpr-infotrafic' } }, { road: { equals: 'DN1' } }] } as never, overrideAccess: true })).docs[0] as any
    expect(Date.parse(dn1.until)).toBeLessThanOrEqual(Date.now())
    expect((await harta()).s.ev.some((e) => e.id === dn1.id)).toBe(false)
  })

  it('comutatorul de oprire si sursele fara acord', async () => {
    process.env.SURSE_OPRITE = 'anm-avertizari'
    try { expect((await R.ruleazaConector(payload, 'anm-avertizari', { ...opt(), fortat: false })).status).toBe('oprit') } finally { delete process.env.SURSE_OPRITE }
    const reg = (await payload.find({ collection: 'data-sources', where: { key: { equals: 'cnair-drumuri' } } as never, overrideAccess: true })).docs[0] as any
    await payload.update({ collection: 'data-sources', id: reg.id, data: { legalStatus: 'needs_permission' } as never, overrideAccess: true, context: { surse: true } })
    expect((await R.ruleazaConector(payload, 'cnair-drumuri', { invalideaza: false, log: () => {} })).status).toBe('oprit') // fara fetch de test: nu descarca
  })
})
