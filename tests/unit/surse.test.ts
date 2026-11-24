import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fenomene, interval, parseazaAvertizari, parseazaNowcasting } from '../../src/surse/parsere/anm'
import { parseazaPZU } from '../../src/surse/parsere/opcom'
import { clasifica, parseazaCnair, parseazaCnairRss, parseazaInfotrafic } from '../../src/surse/parsere/drumuri'
import { parseazaCarburanti } from '../../src/surse/parsere/carburanti'
import { parseazaAvarii } from '../../src/surse/parsere/avarii'
import { kmDin, normDrum, potrivesteTronson } from '../../src/surse/tronsoane'
import { judetDinCod, judetDinNume, localitate } from '../../src/surse/geo'
import { descarcator, parseazaRobots, permis, golesteRobots } from '../../src/surse/http'
import { eScadent } from '../../src/surse/rulare'
import { ANM, OPCOM, CONECTORI, linkuri, verificaBlocaj } from '../../src/surse/conectori'
import { randuriDinPdf } from '../../src/surse/parsere/deo-pdf'
import { anuntInElemente, anunturiDinHtml, citesteRss } from '../../src/surse/parsere/anunturi'
import { idUat, statiiSiPreturi } from '../../src/surse/parsere/monitor'
import { RETEA } from '../../src/shared/harta'

const F = (n: string) => readFileSync(`tests/fixtures/surse/${n}`, 'utf8')
const ACUM = new Date('2026-11-24T12:00:00+02:00')
const d = (o: Record<string, unknown>) => o as Record<string, any>

describe('ANM', () => {
  it('avertizarile nationale: culoare, judete, interval, fenomen', () => {
    const l = parseazaAvertizari(F('anm-avertizari-2026-11-24.xml'), ACUM)
    expect(l).toHaveLength(2)
    const [a, b] = l.map((x) => d(x.data))
    expect(a.code).toBe('yellow')
    expect(a.counties).toContain('dolj')
    expect(a.counties).toContain('bucuresti')
    expect(a.counties).not.toContain('iasi') // culoare="0"
    expect(a.counties).toContain('salaj') // doar <zona cod="SJ_munte">
    expect(a.counties).toHaveLength(30)
    expect(a.from).toBe('2026-11-24T08:00:00.000Z') // 10:00 ora Romaniei
    expect(a.until).toBe('2026-11-24T18:00:00.000Z')
    expect(a.phenomenon).toBe('ninsori viscolite și vânt')
    expect(a.text).toBe('Cod galben de ninsori viscolite și vânt, până la 20:00')
    expect(b.until).toBe('2026-11-25T06:00:00.000Z')
    expect(b.counties).toContain('dambovita')
    expect(b.counties).toHaveLength(13)
    expect(b.phenomenon).toBe('ninsori viscolite') // fenomeneVizate explicit
    expect(b.text).toBe('Cod galben de ninsori viscolite la munte de la 20:00') // doar zone <zona cod="XX_munte">
    // acelasi document -> acelasi identificator (idempotenta)
    expect(parseazaAvertizari(F('anm-avertizari-2026-11-24.xml'), ACUM)[0].externalId).toBe(l[0].externalId)
  })
  it('portocaliu si rosu pe judete separate', () => {
    const x = F('anm-avertizari-2026-11-24.xml').replace('cod="DJ" culoare="1"', 'cod="DJ" culoare="2"').replace('cod="OT" culoare="1"', 'cod="OT" culoare="3"')
    const l = parseazaAvertizari(x, ACUM).map((e) => d(e.data))
    expect(l.find((e) => e.code === 'orange')!.counties).toEqual(['dolj'])
    expect(l.find((e) => e.code === 'red')!.counties).toEqual(['olt'])
  })
  it('intervalul peste anul nou si fenomenele', () => {
    const [a, b] = interval('31 decembrie, ora 20 – 1 ianuarie, ora 08', 2026)
    expect(a!.toISOString()).toBe('2026-12-31T18:00:00.000Z')
    expect(b!.toISOString()).toBe('2027-01-01T06:00:00.000Z')
    expect(fenomene('Ceață densă și polei')).toBe('polei și ceață')
  })
  it('nowcasting: gol (real) si un exemplu (reconstituit)', () => {
    expect(parseazaNowcasting(F('anm-nowcasting-gol.xml'))).toEqual([])
    const [e] = parseazaNowcasting(F('anm-nowcasting-exemplu.xml'), ACUM).map((x) => d(x.data))
    expect(e.code).toBe('orange'); expect(e.counties).toEqual(['dolj']); expect(e.phenomenon).toBe('ceață')
  })
  it('refuza un raspuns care nu e fluxul ANM', () => {
    expect(() => parseazaAvertizari('<html><body>eroare</body></html>')).toThrow(/ANM/)
  })
})

describe('OPCOM PZU', () => {
  it('96 de sferturi -> 24 de ore, media zilei egala cu ROPEX Base publicat', () => {
    const p = parseazaPZU(F('opcom-pip-2026-11-24.csv'), '2026-11-24')!
    expect(p.quarter).toHaveLength(96)
    expect(p.rezolutieMin).toBe(15)
    expect(p.values).toHaveLength(24)
    expect(p.values[0]).toBe(1082.94) // (1110.97+1069.06+1075.51+1076.20)/4
    expect(p.medie).toBe(1276.4) // ROPEX_DAM_Base din antet
    const q = parseazaPZU(F('opcom-pip-2026-11-25.csv'), '2026-11-25')!
    expect(q.quarter).toHaveLength(96); expect(q.medie).toBe(1506.31)
  })
  it('alta zi decat cea ceruta = eroare; pagina HTML (nepublicat) = null', () => {
    expect(() => parseazaPZU(F('opcom-pip-2026-11-24.csv'), '2026-11-25')).toThrow(/2026-11-24/)
    expect(parseazaPZU('<html><body>Nu exista date</body></html>', '2026-11-25')).toBeNull()
  })
  it('ziua de 25 de ore (trecerea la ora de iarna) are 100 de sferturi', () => {
    const rows = Array.from({ length: 100 }, (_, i) => `"Romania","${i + 1}","${i < 12 || i >= 16 ? 100 : 200}.00","1","1","1","PT15M"`)
    const csv = `"PIP si volum tranzactionat pentru ziua de livrare: 25/10/2026" ""\n"Zona de tranzactionare","Interval","Pret de Inchidere a Pietei [lei/MWh]","Volum","a","b","Rezolutie"\n${rows.join('\n')}`
    const p = parseazaPZU(csv, '2026-10-25')!
    expect(p.quarter).toHaveLength(100)
    expect(p.values).toHaveLength(24)
    // sferturile 13-16 sunt prima ora 03:00 (inainte de schimbare); ora 3 are 8 sferturi
    expect(p.values[3]).toBe(150)
    expect(() => parseazaPZU(csv.replace(/\n"Romania","100".*$/, ''), '2026-10-25')).toThrow(/aștept 100/)
  })
})

describe('drumuri', () => {
  it('Infotrafic: stari, segmente pe harta, judet, fara trafic normal pe DN', () => {
    const l = parseazaInfotrafic(F('igpr-infotrafic-2026-08-01.html'), ACUM).map((e) => d(e.data))
    const dn1 = l.find((e) => e.road === 'DN1')!
    expect(dn1.status).toBe('queue'); expect(dn1.segment).toBe('Nistorești–Comarnic'); expect(dn1.mapSegment).toEqual(['dn1-plo-bv']); expect(dn1.county).toBe('prahova')
    const a2 = l.find((e) => e.road === 'A2')!
    expect(a2.mapSegment).toEqual(['a2']); expect(a2.county).toBe('calarasi') // Fundulea, nu „către Constanța”
    expect(l.find((e) => e.road === 'A1')!.status).toBe('ok')
    expect(l.find((e) => e.road === 'A1')!.mapSegment).toEqual(['a1-buc-pit'])
    expect(l.find((e) => e.road === 'DN7')!.mapSegment).toEqual(['dn7-olt'])
    // continuarea pe randul urmator este lipita de drumul ei
    expect(l.find((e) => e.road === 'DN3A')!.county).toBe('ialomita')
    // drum fara tronson desenat: semn pe harta la localitate
    const dn39 = l.find((e) => e.road === 'DN39')!
    expect(dn39.mapSegment).toEqual([]); expect(dn39.lat).toBeCloseTo(44.09, 1); expect(dn39.segment).toBe('Lazu–Agigea')
  })
  it('CNAIR: inchise si lucrari, judetul din paranteze, km pe tronson', () => {
    const l = parseazaCnair(F('cnair-drumuri-inchise.html'), ACUM).map((e) => d(e.data))
    expect(l.filter((e) => e.status === 'closed')).toHaveLength(5)
    expect(l.filter((e) => e.status === 'works')).toHaveLength(3)
    const dn23 = l.find((e) => e.road === 'DN23')!
    expect(dn23.county).toBe('vrancea'); expect(dn23.segment).toBe('Mândrești Munteni–Olăneasca'); expect(dn23.what).toContain('ninsorii')
    expect(l.find((e) => e.road === 'DN2')!.county).toBe('buzau')
    const b = l.find((e) => e.segment === 'Bărcăneşti')!
    expect(b.mapSegment).toEqual(['dn1-plo-bv']); expect(b.what).toContain('km 65,913')
  })
  it('clasificarea textelor', () => {
    expect(clasifica('circulația este blocată').st).toBe('closed')
    expect(clasifica('se circulă pe un singur fir, alternativ').st).toBe('works')
    expect(clasifica('ceață densă').label).toBe('ceață')
    expect(clasifica('trafic normal').st).toBe('ok')
  })
  it('tabelul tronsoanelor: km, localitati, drum unic, fara potrivire', () => {
    expect(normDrum('Dn 7c')).toBe('DN7C'); expect(kmDin('65+913')).toBeCloseTo(65.913)
    expect(potrivesteTronson('DN6', { km: [190] }).tronsoane).toEqual(['dn6-car-cv'])
    expect(potrivesteTronson('DN 66', { localitati: ['Bumbești-Jiu'] }).tronsoane).toEqual(['dn66-tj-pet'])
    expect(potrivesteTronson('DN56', {}).tronsoane).toEqual(['dn56'])
    expect(potrivesteTronson('DN99', { localitati: ['Craiova'] })).toMatchObject({ tronsoane: [], cum: 'niciunul' })
    const ids = new Set(RETEA.map((r) => r.id))
    for (const c of ['dn1-plo-bv', 'dn6-cv-lug', 'dn67', 'a2']) expect(ids.has(c)).toBe(true)
  })
})

describe('carburanti si avarii', () => {
  it('media pe judet, cea mai ieftina statie, fara premium si fara preturi vechi', () => {
    const l = parseazaCarburanti(F('carburanti-exemplu.csv'), ACUM).map((e) => d(e.data))
    const dj = l.find((e) => e.county === 'dolj')!
    expect(dj.petrol).toBe(7.54); expect(dj.diesel).toBe(7.66); expect(dj.lpg).toBe(3.69); expect(dj.day).toBe('2026-11-24')
    expect(dj.cheapestNote).toBe('Petrom Calea Severinului, Calea Severinului 40: 7,49 lei')
    expect(l.find((e) => e.county === 'olt')).toBeUndefined() // 20.11: peste 48 de ore
    expect(l.find((e) => e.county === 'gorj')!.lpg).toBeNull()
  })
  it('avarii: tabelul Distributie Oltenia, data goala = ziua de sus, ora Romaniei', () => {
    const l = parseazaAvarii(F('deo-gorj-2026-03-23.csv'), 'power', { acum: new Date('2026-03-22T12:00:00+02:00'), prefix: 'avarii-deo' }).map((e) => d(e.data))
    expect(l).toHaveLength(5)
    expect(l[1]).toMatchObject({ city: 'Târgu Cărbunești', county: 'gorj', from: '2026-03-23T10:30:00.000Z', until: '2026-03-23T13:00:00.000Z', kind: 'power' })
    expect(l[0].title).toBe('Curent oprit luni, 09:30–12:00')
    // dupa ce a trecut, nu se mai importa
    expect(parseazaAvarii(F('deo-gorj-2026-03-23.csv'), 'power', { acum: new Date('2026-03-24T12:00:00+02:00'), prefix: 'x' })).toHaveLength(0)
  })
  it('judete si localitati', () => {
    expect(judetDinCod('B')).toBe('bucuresti'); expect(judetDinCod('CS')).toBe('caras-severin')
    expect(judetDinNume('Jud. Vâlcea')).toBe('valcea'); expect(judetDinNume('Caraș-Severin')).toBe('caras-severin')
    expect(localitate('mun. Râmnicu Vâlcea')!.judet).toBe('valcea')
  })
})

describe('descarcari politicoase', () => {
  it('robots.txt: grupul nostru, Allow mai lung castiga', () => {
    const r = parseazaRobots('User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\n\nUser-agent: CadranulBot\nDisallow: /privat\n')
    expect(permis(r, '/privat/x')).toBe(false)
    expect(permis(r, '/wp-admin/')).toBe(true) // grupul nostru nu interzice /wp-admin
    const s = parseazaRobots('User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php')
    expect(permis(s, '/wp-admin/x')).toBe(false); expect(permis(s, '/wp-admin/admin-ajax.php')).toBe(true); expect(permis(s, '/')).toBe(true)
    // politiaromana.ro (24.11.2026): totul interzis in afara de /index.php
    const igpr = parseazaRobots('User-agent: *\nDisallow: /\nAllow: /index.php')
    expect(permis(igpr, '/ro/info-trafic')).toBe(false); expect(permis(igpr, '/index.php')).toBe(true)
    expect(parseazaRobots('User-agent: *\nCrawl-delay: 10\nDisallow:').crawlDelay).toBe(10)
  })
  it('User-Agent, ETag/304, reincercare la 503, oprire la robots', async () => {
    golesteRobots()
    const cereri: { url: string; h: Record<string, string> }[] = []
    let n = 0
    const f = (async (url: string, o: RequestInit) => {
      cereri.push({ url, h: o.headers as Record<string, string> })
      if (url.endsWith('/robots.txt')) return new Response(url.includes('interzis') ? 'User-agent: *\nDisallow: /' : '', { status: 200 })
      n++
      if (n === 1) return new Response('ocupat', { status: 503 })
      if ((o.headers as Record<string, string>)['If-None-Match'] === '"v1"') return new Response(null, { status: 304 })
      return new Response('<avertizari/>', { status: 200, headers: { etag: '"v1"' } })
    }) as unknown as typeof fetch
    const cache = {}
    const dl = descarcator(f, cache, { pauzaMs: 1 })
    const a = await dl('https://exemplu.ro/x.xml')
    expect(a.text).toBe('<avertizari/>')
    expect(cereri.find((c) => c.url.endsWith('x.xml'))!.h['User-Agent']).toMatch(/^CadranulBot\/1\.0/)
    expect((await dl('https://exemplu.ro/x.xml')).neschimbat).toBe(true)
    await expect(dl('https://interzis.ro/x')).rejects.toThrow(/robots.txt de la interzis.ro interzice/)
  })
})

describe('registru si planificare', () => {
  it('pornite: ANM, OPCOM, CNAIR, carburanti, Apa Oltenia; oprite (robots / anti-robot / formular): IGPR, DEO, Distrigaz', () => {
    expect(CONECTORI.filter((c) => c.pornitImplicit).map((c) => c.key).sort()).toEqual(['anm-avertizari', 'avarii-apa-oltenia', 'carburanti-cc', 'cnair-drumuri', 'opcom-pzu'])
    for (const c of CONECTORI) {
      expect(c.url).toMatch(/^https:\/\//); expect(c.atribuire).toBeTruthy()
      if (!c.pornitImplicit) { expect(c.legal).toBe('needs_permission'); expect(c.note).toMatch(/^OPRIT: /); expect(readFileSync(c.cerere!, 'utf8')).toContain('[Denumire firma editoare]') }
    }
    expect(CONECTORI.find((c) => c.key === 'igpr-infotrafic')!.note).toContain('Disallow: /')
  })
  it('ANM la 10 minute, cu asteptare dubla dupa esecuri', () => {
    const t = Date.parse('2026-11-24T10:00:00Z')
    expect(eScadent(ANM, { lastRun: new Date(t - 9 * 60e3).toISOString() }, new Date(t))).toBe(false)
    expect(eScadent(ANM, { lastRun: new Date(t - 10 * 60e3).toISOString() }, new Date(t))).toBe(true)
    expect(eScadent(ANM, { lastRun: new Date(t - 15 * 60e3).toISOString(), consecutiveFailures: 2 }, new Date(t))).toBe(false)
  })
  it('OPCOM: zilnic dupa 13:15, reincearca pana apar preturile, apoi nu mai ruleaza azi', () => {
    const z = (o: string) => new Date(`2026-11-24T${o}:00+02:00`)
    const azi = { lastRun: z('09:00').toISOString(), lastSuccess: '2026-11-23T11:20:00.000Z' }
    expect(eScadent(OPCOM, azi, z('12:00'))).toBe(false)
    expect(eScadent(OPCOM, azi, z('13:20'))).toBe(true)
    expect(eScadent(OPCOM, { ...azi, lastRun: z('13:20').toISOString() }, z('13:30'))).toBe(false)
    expect(eScadent(OPCOM, { ...azi, lastRun: z('13:20').toISOString() }, z('13:41'))).toBe(true)
    expect(eScadent(OPCOM, { lastRun: z('13:41').toISOString(), lastSuccess: z('13:41').toISOString() }, z('16:00'))).toBe(false)
    expect(eScadent(OPCOM, {}, z('08:00'))).toBe(true) // prima rulare: imediat
  })
})

describe('anunturi publice (decizia editorului)', () => {
  it('Distributie Oltenia: PDF-ul saptamanal real -> randuri cu data, interval, localitate', async () => {
    const r = await randuriDinPdf(new Uint8Array(readFileSync('tests/fixtures/surse/deo-dolj-2023-12-11.pdf')))
    expect(r.judet).toBe('dolj'); expect(r.an).toBe(2023)
    expect(r.randuri.length).toBeGreaterThan(40)
    expect(r.randuri[0]).toMatchObject({ data: '11.12.2023', interval: '09:00 - 17:00', localitate: 'Cetate', zona: 'PTCZ SPA 1 Cetate' })
    // continuarea zilei 11.12 pe pagina 2 (fara celula de data), apoi 12.12
    expect(r.randuri.find((x) => x.localitate === 'Ostroveni')!.data).toBe('11.12.2023')
    expect(r.randuri.find((x) => x.localitate === 'Dăbuleni')!.data).toBe('12.12.2023')
    expect(r.randuri.find((x) => x.localitate === 'Plenița')!.data).toBe('14.12.2023')
    const el = parseazaAvarii(r.randuri, 'power', { acum: new Date('2023-12-10T12:00:00+02:00'), prefix: 'avarii-deo' }).map((e) => d(e.data))
    expect(el[0]).toMatchObject({ county: 'dolj', city: 'Cetate', from: '2023-12-11T07:00:00.000Z', until: '2023-12-11T15:00:00.000Z', title: 'Curent oprit luni, 09:00–17:00' })
  })
  it('Distributie Oltenia: pagina de validare anti-robot (reala) -> eroare clara, fara ocolire', () => {
    expect(() => verificaBlocaj(F('deo-pagina-validare.html'), 'Distribuție Energie Oltenia')).toThrow(/anti-robot.*Nu o ocolim/)
    expect(() => verificaBlocaj(F('deo-pagina-blocat.html'), 'Distribuție Energie Oltenia')).toThrow(/anti-robot/)
  })
  it('Compania de Apa Oltenia: fluxul RSS real', () => {
    const l = citesteRss(F('apa-oltenia-anunturi-2026-11-24.xml'))
    expect(l).toHaveLength(10)
    const el = l.flatMap((a) => anuntInElemente(a, 'water', { acum: new Date('2026-11-24T12:00:00+02:00'), prefix: 'a', judetImplicit: 'dolj', localitateImplicita: 'Craiova' })).map((e) => d(e.data))
    expect(el).toHaveLength(1) // doar oprirea de miercuri e inca in viitor; anunturile de mediu nu conteaza
    expect(el[0]).toMatchObject({ kind: 'water', city: 'Craiova', county: 'dolj', title: 'Apă oprită miercuri, 10:00–13:00', area: 'blocurile alimentate din PT Horezu – Hotel Militar', from: '2026-11-25T08:00:00.000Z' })
    expect(() => citesteRss('<html>eroare</html>')).toThrow(/RSS/)
  })
  it('Distrigaz: pagina de anunturi (reconstituita) si pagina de mentenanta (reala)', () => {
    const el = anunturiDinHtml(F('distrigaz-intreruperi-exemplu.html'), 'https://x.ro/p').flatMap((a) => anuntInElemente(a, 'gas', { acum: new Date('2026-11-24T12:00:00+02:00'), prefix: 'g', judetImplicit: 'bucuresti', localitateImplicita: 'București' })).map((e) => d(e.data))
    expect(el).toHaveLength(2)
    expect(el[0]).toMatchObject({ county: 'bucuresti', title: 'Gaz oprit joi, 09:00–17:00' })
    expect(el[1]).toMatchObject({ county: 'olt', city: 'Slatina' })
    expect(F('distrigaz-mentenanta.html')).toMatch(/ePortalDGSR/)
  })
  it('Monitorul preturilor: raspunsurile reale (UAT, benzina 11, motorina 21) -> media pe judet', () => {
    expect(idUat(F('monitor-uat-craiova.xml'), 'Craiova', 'Dolj')).toBe('69900')
    expect(idUat(F('monitor-uat-craiova.xml'), 'Craiova', 'Olt')).toBeNull()
    const acum = new Date('2026-11-24T15:00:00+02:00')
    const b = statiiSiPreturi(F('monitor-gas-craiova-11.xml'), 'Dolj', 'Craiova', { uat: '69900', acum })
    const m = statiiSiPreturi(F('monitor-gas-craiova-21.xml'), 'Dolj', 'Craiova', { uat: '69900', acum })
    expect(b.length).toBeGreaterThan(5); expect(b.every((x) => x.produs === 'Benzină standard')).toBe(true)
    expect(m.every((x) => x.produs === 'Motorină standard')).toBe(true)
    const [e] = parseazaCarburanti([...b, ...m] as never, acum, 72).map((x) => d(x.data))
    expect(e).toMatchObject({ county: 'dolj', day: '2026-11-24', petrol: 8.96, diesel: 10.37, lpg: null })
    expect(e.cheapestNote).toBe('LUKOIL Craiova 2, Calea Severinului: 8,93 lei')
    // preturile mai vechi de 72 de ore se ignora
    expect(statiiSiPreturi(F('monitor-gas-craiova-11.xml'), 'Dolj', 'Craiova', { uat: '69900', acum: new Date('2026-11-28T12:00:00+02:00') })).toHaveLength(0)
    // alt UAT -> statiile nu se numara
    expect(statiiSiPreturi(F('monitor-gas-craiova-11.xml'), 'Dolj', 'Craiova', { uat: '1', acum })).toHaveLength(0)
    expect(() => statiiSiPreturi('<html><body>x</body></html>', 'Dolj', 'Craiova')).toThrow(/HTML/)
  })
  it('CNAIR: fluxul RSS real -> doar inchideri, tronson, km, expirare dupa 7 zile', () => {
    const vechi = parseazaCnairRss(F('cnair-rss-2026-11-24.xml'), new Date('2026-10-28T12:00:00+02:00')).map((e) => d(e.data))
    expect(vechi.map((e) => e.road)).toEqual(['DN67C', 'DN7C'])
    const dn7c = vechi[1]
    expect(dn7c).toMatchObject({ status: 'closed', segment: 'Piscul Negru–Bâlea Cascadă', mapSegment: ['dn7c'], county: 'arges', from: '2026-10-27T16:00:00.000Z' })
    const azi = parseazaCnairRss(F('cnair-rss-2026-11-24.xml'), new Date('2026-11-24T12:00:00+02:00')).map((e) => d(e.data))
    expect(azi).toHaveLength(1) // DN7C (27.10) a expirat; agabaritic, DALI/SF si mentenanta IT sunt ignorate
    expect(azi[0]).toMatchObject({ road: 'DN67C', status: 'closed', segment: 'Obârșia Lotrului–Curpăt', mapSegment: ['dn67c'], county: 'valcea', from: '2026-11-23T08:30:00.000Z' })
    expect(azi[0].what).toBe('Circulație închisă, din cauza căderilor abundente de zăpadă și a condițiilor meteorologice nefavorabile (km 61–79)')
    // un comunicat mai nou „se redeschide” anuleaza inchiderea
    const redeschis = F('cnair-rss-2026-11-24.xml').replace('<item>', '<item><title>Se redeschide circulația pe DN67C</title><description>Circulația pe DN67C se redeschide.</description><pubDate>Tue, 24 Nov 2026 08:00:00 +0000</pubDate><guid>1</guid></item><item>')
    expect(parseazaCnairRss(redeschis, new Date('2026-11-24T12:00:00+02:00'))).toHaveLength(0)
    expect(() => parseazaCnairRss('<html/>')).toThrow(/RSS/)
  })
  it('legaturile din pagina-lista', () => {
    const l = linkuri('<a href="/ro/stiri/infotrafic-24-11">Comunicat INFOTRAFIC</a><a href="https://alt.ro/x">alt</a><a href="docs/a.pdf">Program</a>', 'https://www.exemplu.ro/ro/', /infotrafic|\.pdf/i)
    expect(l.map((x) => x.url)).toEqual(['https://www.exemplu.ro/ro/stiri/infotrafic-24-11', 'https://www.exemplu.ro/ro/docs/a.pdf'])
  })
})
