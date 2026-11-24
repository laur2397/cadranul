// npm run seed: umple baza de date cu continutul DEMONSTRATIV al designului D.
// ATENTIE: sterge si recreeaza toata baza (payload migrate:fresh). Refuza sa ruleze in productie.
//   - ruleaza doar cu NEXT_PUBLIC_DEMO=true si NODE_ENV diferit de production
//   - SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (optional): creeaza si un cont de administrator
// Orele sunt relative la momentul rularii (prototipul era „inghetat” la 08:42), ca demo-ul sa para viu.
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'
import hartaDate from '../src/shared/harta-date.json'
import { invP, ORASE_EXTRA, fara, D, type Punct } from '../src/shared/harta'
import { blocuriInLexical, type BlocProto } from '../src/lib/lexical'
import { ziRO, ziPlus } from '../src/site/timp'
import { ARTICOLE } from './seed/articole'
import { REGIUNI, JUDETE, JOBC, SECTIUNI, AUTORI, EVENIMENTE, TIMPI, AVARII, VREME, COND_TEXT, PRETURI, JOBURI_DEMO, FARMACII_SV, NUME_FARMACII, STRAZI } from './seed/date'
import { PAGINI } from './seed/pagini'

if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEMO !== 'true') {
  console.error('Refuz: seed-ul demonstrativ rulează doar cu NEXT_PUBLIC_DEMO=true și în afara producției.')
  process.exit(1)
}

const ctx = { importDemo: true }
const ORASE: Record<string, Punct> = { ...(hartaDate.cities as unknown as Record<string, Punct>), ...ORASE_EXTRA }
const lonlat = (at: string | [number, number]) => (Array.isArray(at) ? at : invP(...ORASE[at]))
const slugJ = (n: string) => fara(n).toLowerCase().replace(/[^a-z0-9]+/g, '-')
const ACUM = Date.now()
// ora din prototip -> moment real: prototipul era la 08:42
function momentul(t: string, i = 0): Date {
  if (t === 'ieri') return new Date(ACUM - (15 + (i % 6)) * 3600e3 - i * 7 * 60e3)
  const [h, m] = t.split(':').map(Number)
  return new Date(ACUM - (8 * 60 + 42 - (h * 60 + m)) * 60e3)
}
// pseudo-aleator determinist (aceleasi cifre la fiecare rulare)
let samanta = 7
const rnd = () => ((samanta = (samanta * 16807) % 2147483647) / 2147483647)

async function main() {
  const payload: Payload = await getPayload({ config })
  console.log('Baza de date: șterg și refac schema (migrate:fresh)…')
  await payload.db.migrateFresh({ forceAcceptWarning: true })
  const azi = ziRO(new Date(ACUM))
  const c = (o: { collection: string; data: Record<string, unknown>; draft?: boolean }) => payload.create({ ...o, context: ctx, overrideAccess: true } as never) as unknown as Promise<{ id: number } & Record<string, any>>

  // ——— structura
  const reg: Record<string, number> = {}
  for (const [i, r] of REGIUNI.entries()) reg[r.key] = (await c({ collection: 'regions', data: { slug: r.slug, name: r.name, short: r.short, mapKey: r.key, city: r.city, cityKey: r.ck, launched: true, order: i } })).id
  const jud: Record<string, { id: number; slug: string; seat: string; reg: string }> = {}
  for (const [mk, name, seat] of JUDETE) {
    const r = (hartaDate.counties as Record<string, { r: string }>)[mk].r
    const rg = REGIUNI.find((x) => x.key === r)!
    let jobs = JOBC[mk]
    if (jobs === undefined) {
      const frati = JUDETE.filter(([k]) => (hartaDate.counties as Record<string, { r: string }>)[k].r === r)
      jobs = r === 'bi' ? (mk === 'Bucuresti' ? Math.round(rg.jobs * 0.86) : rg.jobs - Math.round(rg.jobs * 0.86)) : Math.round(rg.jobs / frati.length * (0.7 + ((mk.length * 7) % 6) / 10))
    }
    const d = await c({ collection: 'counties', data: { slug: slugJ(name), name, mapKey: mk, seat, region: reg[r], jobsActive: jobs } })
    jud[mk] = { id: d.id, slug: d.slug, seat, reg: r }
  }
  for (const r of REGIUNI) {
    const ref = Object.values(jud).find((j) => j.slug === r.ref)!
    await payload.update({ collection: 'regions', id: reg[r.key], data: { refCounty: ref.id, ...(r.key === 'sv' ? { sponsor: { name: 'Termo Jiu', line: 'Ediția Oltenia este susținută de Termo Jiu, Târgu Jiu (firmă fictivă, exemplu demonstrativ).', url: '' } } : {}) }, context: ctx })
  }
  const sec: Record<string, number> = {}
  for (const [i, [slug, name, desc]] of SECTIUNI.entries()) sec[slug] = (await c({ collection: 'sections', data: { slug, name, desc, order: i } })).id
  const aut: Record<string, number> = {}
  for (const a of AUTORI) aut[a.slug] = (await c({ collection: 'authors', data: { ...a } })).id
  console.log('Structura: 8 ediții, 42 de județe, secțiuni, autori.')

  // ——— articole
  const art: Record<string, number> = {}
  const judSlug = (s: string) => Object.values(jud).find((j) => j.slug === s)?.id
  for (const [i, a] of ARTICOLE.entries()) {
    const at0 = a.at ? lonlat(a.at) : null
    const at = at0 && a.off ? [at0[0] + a.off[0] / 104.71, at0[1] - a.off[1] / 150.47] : at0
    const corp: BlocProto[] = a.body.map((p): BlocProto => {
      if (p.startsWith('## ')) return { t: 'h2', x: p.slice(3) }
      if (p.startsWith('> ')) return { t: 'quote', x: p.slice(2) }
      if (p === '@energie') return { t: 'energie' }
      if (p.startsWith('@calc:')) return { t: 'calc', kind: p.slice(6) as 'pensie' }
      if (p === '@cronologie') return { t: 'timeline', title: 'Cum am ajuns aici', items: (a.cronologie || []).map(([when, x]) => ({ when, x })) }
      return { t: 'p', x: p.replace(/&/g, '&amp;').replace(/</g, '&lt;') }
    })
    const d = await c({
      collection: 'articles', draft: false,
      data: {
        _status: 'published', slug: a.slug, type: a.type || 'stire', section: sec[a.sec], label: a.label, region: a.r === 'nat' ? null : reg[a.r],
        counties: (a.cty || []).map(judSlug).filter(Boolean), publishedAt: momentul(a.time, i).toISOString(), priority: a.prio,
        place: at ? { name: a.atName || '', lat: +at[1].toFixed(4), lon: +at[0].toFixed(4) } : undefined,
        title: a.t, dek: a.d, titleCheck: true, summary: (a.sum || []).map((x) => ({ x })),
        forYou: a.fy ? { who: a.fy[0], when: a.fy[1], todo: a.fy[2] } : undefined,
        body: blocuriInLexical(corp), authors: a.author ? [aut[a.author]] : [],
        image: { src: `/img/${a.img}-700.jpg`, alt: a.alt || '', caption: a.caption || '', credit: 'Arhiva Cadranul (fotografie demonstrativă)', chart: a.chart },
        ...(a.type === 'advertorial' ? { sponsor: { name: 'Termo Jiu (fictiv)' } } : {}),
      },
    })
    art[a.id] = d.id
  }
  console.log(`Articole: ${ARTICOLE.length}.`)

  // ——— prima pagina (din prototip: CATCH, SEVEN, MOST, TOP, CALLOUTS)
  const ids = (l: string[]) => l.map((x) => art[x]).filter(Boolean)
  await c({ collection: 'frontpages', data: { edition: 'nat', top: art.buget, catchUp: ids(['buget', 'cod', 'a1', 'pensii', 'rezid']), seven: ids(['buget', 'pensii', 'cod', 'curent', 'rezid', 'port', 'tren']), most: ids(['buget', 'pensii', 'a1', 'cod', 'curent']),
    callouts: [{ article: art.buget, dx: -100, dy: 26 }, { article: art.cod, dx: 26, dy: -78 }, { article: art.tech, dx: -224, dy: -92 }] } })
  await c({ collection: 'frontpages', data: { edition: 'sv', top: art.cardio, catchUp: ids(['apa', 'dn6', 'cardio', 'pensii', 'fabrica']), seven: ids(['apa', 'dn6', 'buget', 'pensii', 'curent', 'cardio', 'fabrica']), most: ids(['apa', 'dn6', 'fabrica', 'univ', 'pensii']),
    callouts: [{ article: art.cardio, dx: -300, dy: 92 }, { article: art.fabrica, dx: -330, dy: -150 }, { article: art.dn6, dx: 60, dy: 34 }, { article: art.solar, dx: -40, dy: -175 }] } })

  await payload.updateGlobal({ slug: 'momentul', context: ctx, data: { items: [
    { edition: 'nat', phrase: 'Ceață densă în sud până la 11, iar la munte vine {vreme|cod galben de ninsoare} de la 14:00. Pe {drum|A1|spre Pitești} se merge greu, iar curentul e cel mai ieftin azi între {ieftin|12:00 și 15:00}.' },
    { edition: 'sv', phrase: 'Ceață în Dolj și Olt până la 11, 3°C la Craiova. {avarii|Apa caldă se oprește joi} în Brazda, pe {drum|DN6|spre Caracal} se circulă pe un singur sens, iar curentul e cel mai ieftin între {ieftin|12:00 și 15:00}.' },
  ], nextUpdate: 'Următoarea actualizare mare: ediția de seară, la 18:00.', pensionPct: 6.1, pensionFrom: '1 ianuarie 2027' } })

  // ——— live
  await c({ collection: 'liveblogs', draft: false, data: {
    _status: 'published', slug: 'ninsoare-la-munte-dn1-dn7', title: 'Ninsoare la munte: situația pe DN1 și DN7, oră de oră', liveState: 'activ', section: sec.vreme, region: reg.c,
    dek: 'Cod galben de ninsoare de la 14:00 în opt județe. Urmărim drumurile peste munți, plecările și închiderile.', publishedAt: new Date(ACUM - 3 * 3600e3).toISOString(),
    image: { src: '/img/12-munte-iarna-700.jpg', alt: 'Drum de munte acoperit de zăpadă', caption: 'Valea Prahovei, azi dimineață. Fotografie demonstrativă.' },
    keyPoints: [{ x: 'Cod galben de ninsoare la munte de la 14:00 până mâine la 9:00.' }, { x: 'Pe DN1 Sinaia–Predeal se circulă cu 40 de minute mai greu.' }, { x: 'DN7 Valea Oltului se închide la 22:00, ca în fiecare noapte.' }],
    authors: [aut['cristian-oprea']],
    entries: [
      { at: new Date(ACUM - 170 * 60e3).toISOString(), title: 'Utilajele, pe poziții', x: 'Drumarii au trimis 14 utilaje pe Valea Prahovei și 9 pe Valea Oltului. Deocamdată nu ninge.', kind: 'text', author: aut['cristian-oprea'] },
      { at: new Date(ACUM - 95 * 60e3).toISOString(), title: 'Coloană la Comarnic', x: 'Pe DN1, la intrarea în Comarnic, coloana are aproximativ 3 kilometri spre Brașov.', kind: 'text', author: aut['sorin-ilie'] },
      { at: new Date(ACUM - 40 * 60e3).toISOString(), title: 'Primii fulgi la Predeal', x: 'La Predeal au început primii fulgi. Carosabilul este deocamdată umed, fără depuneri.', kind: 'important', author: aut['cristian-oprea'] },
      { at: new Date(ACUM - 10 * 60e3).toISOString(), x: 'Recomandarea redacției: dacă trebuie să treci munții azi, pleacă înainte de prânz.', kind: 'text', author: aut['cristian-oprea'] },
    ],
  } })

  // ——— drumuri
  for (const e of EVENIMENTE) {
    const [lon, lat] = lonlat(e.at)
    await c({ collection: 'road-events', data: { road: e.road, segment: e.where, what: e.what, status: e.st, label: e.lab, delayMinutes: e.delay, county: jud[e.cty].id, mapSegment: e.seg || [], lat: +lat.toFixed(4), lon: +lon.toFixed(4),
      from: new Date(ACUM - 3 * 3600e3).toISOString(), until: new Date(ACUM + 5 * 864e5).toISOString(), source: 'Demonstrativ (la lansare: CNAIR / Infotrafic)' } })
  }
  for (const [k, l] of Object.entries(TIMPI)) for (const [i, [route, duration, delta, status]] of l.entries())
    await c({ collection: 'travel-times', data: { route, duration, delta, status, region: k === 'nat' ? null : reg[k], order: i } })

  // ——— avarii
  for (const o of AVARII) {
    const [lon, lat] = lonlat(o.at)
    const off = o.at === 'Craiova' ? [0.06, 0.06] : o.at === 'Bucuresti' ? [0.08, -0.07] : [0, 0]
    await c({ collection: 'outages', data: { kind: o.k, title: o.t, area: o.d, county: jud[o.cty].id, city: D(o.at),
      lat: +(lat + off[1]).toFixed(4), lon: +(lon + off[0]).toFixed(4), from: new Date(ACUM - 2 * 3600e3).toISOString(), until: new Date(ACUM + 4 * 864e5).toISOString(), source: 'Demonstrativ' } })
  }

  // ——— vremea
  const nume = (k: string) => ({ Bucuresti: 'București', Iasi: 'Iași', Constanta: 'Constanța', Brasov: 'Brașov', Timisoara: 'Timișoara', Galati: 'Galați', Bacau: 'Bacău', Pitesti: 'Pitești', 'Targu Mures': 'Târgu Mureș', 'Targu Jiu': 'Târgu Jiu', 'Ramnicu Valcea': 'Râmnicu Vâlcea', Petrosani: 'Petroșani' } as Record<string, string>)[k] || k
  for (const [k, t, w, lvl, cty] of VREME) {
    const rg = REGIUNI.find((r) => r.ck === k)
    const hours = k === 'Craiova' ? [[9, 3], [12, 8], [15, 9], [18, 5]] : [[9, t], [12, t + 4], [15, t + 5], [18, t + 1]]
    await c({ collection: 'weather', data: { city: nume(k), mapKey: k, level: lvl, county: jud[cty].id, temp: t, cond: w, condText: rg?.cond || COND_TEXT[w], hours: hours.map(([h, x]) => ({ h, t: x })), source: 'Demonstrativ (la lansare: ANM)' } })
  }
  const jIds = (l: string[]) => l.map((k) => jud[k].id)
  const cod = async (counties: string[], text: string, phen: string, roads: string) => c({ collection: 'weather-alerts', data: { code: 'yellow', phenomenon: phen, text, roads, counties: jIds(counties), from: new Date(ACUM - 3600e3).toISOString(), until: new Date(ACUM + 3 * 864e5).toISOString(), source: 'Demonstrativ (la lansare: ANM)' } })
  await cod(['Brasov', 'Covasna', 'Harghita', 'Prahova', 'Buzau', 'Vrancea', 'Suceava', 'Neamt'], 'Cod galben de ninsoare la munte de la 14:00', 'ninsoare la munte', 'DN1 Valea Prahovei și DN7 Valea Oltului, cele mai expuse.')
  await cod(['Dolj', 'Olt'], 'Cod galben de ceață în Dolj și Olt până la 11:00', 'ceață în sud', 'Pe DX12 și DN6, viteză redusă.')
  await cod(['Teleorman', 'Giurgiu', 'Calarasi', 'Ialomita'], 'Cod galben de ceață în Câmpia Română până la 11:00', 'ceață în sud', 'Pe A1 și A2, viteză redusă pe porțiunile cu ceață.')

  // ——— energie: azi = graficul din prototip; restul zilelor, variatii
  for (let z = -7; z <= 1; z++) {
    const v = z === 0 ? PRETURI : PRETURI.map((p, h) => Math.max(120, Math.round(p * (0.85 + rnd() * 0.3) + (h > 10 && h < 15 ? -20 : 0))))
    await c({ collection: 'energy-prices', data: { day: ziPlus(azi, z), values: v.join(', '), source: 'OPCOM, piața pentru ziua următoare (demonstrativ)' } })
  }

  // ——— carburanti, 10 zile, pe judete
  for (const [mk] of JUDETE) {
    const rg = REGIUNI.find((r) => r.key === jud[mk].reg)!
    const j = mk === 'Dolj' ? [0, 0, 0] : [(rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.06]
    for (let z = -9; z <= 0; z++) {
      const drift = z * 0.012
      await c({ collection: 'fuel-prices', data: { county: jud[mk].id, day: ziPlus(azi, z), petrol: +(rg.fuel[0] + j[0] + drift).toFixed(2), diesel: +(rg.fuel[1] + j[1] + drift * 1.4).toFixed(2), lpg: +(rg.fuel[2] + j[2] + drift / 3).toFixed(2),
        cheapestNote: mk === 'Dolj' && z === 0 ? 'Craiova, Calea Severinului: 7,49 lei' : undefined, source: 'Demonstrativ' } })
    }
  }

  // ——— farmacii de garda: azi si urmatoarele 6 zile, in fiecare resedinta
  for (let z = 0; z <= 6; z++) {
    const day = ziPlus(azi, z)
    for (const [mk, , seat] of JUDETE) {
      const l: [string, string, string, boolean][] = mk === 'Dolj' ? FARMACII_SV : [0, 1].map((i) => [`${NUME_FARMACII[(mk.length + i + z) % NUME_FARMACII.length]}${i === 0 ? ` ${seat}` : ''}`, STRAZI[(mk.length * 3 + i + z) % STRAZI.length], i === 0 ? 'non-stop' : 'până la 22:00', false])
      for (const [name, address, hours, sponsor] of l) await c({ collection: 'pharmacies', data: { name, day, county: jud[mk].id, city: seat, address, hours, sponsor } })
    }
  }

  // ——— joburi
  for (const [i, j] of JOBURI_DEMO.entries()) {
    const slug = slugJ(`${j.t} ${j.city}`).slice(0, 60).replace(/-$/, '') + (i ? `-${i}` : '')
    await c({ collection: 'jobs', data: {
      slug, active: true, title: j.t, employer: j.co, county: jud[j.cty].id, city: j.city, salaryMin: j.min, salaryMax: j.max, salaryNote: j.note, where: j.w,
      description: j.desc + '\n\nAnunț demonstrativ: firma și postul sunt fictive.', requirements: j.req.join('\n'), applyEmail: 'joburi@cadranul.ro',
      deadline: new Date(ACUM + (14 + i) * 864e5).toISOString(), promoted: !!j.pr, promotedUntil: j.pr ? new Date(ACUM + 7 * 864e5).toISOString() : undefined, source: 'direct',
    } })
  }

  // ——— pagini legale si publicatia
  for (const p of PAGINI) await c({ collection: 'pages', data: { ...p, updated: '24 noiembrie 2026', lawyerReviewed: false } })
  await payload.updateGlobal({ slug: 'site', context: ctx, data: { name: 'Cadranul', tagline: 'România, oră de oră.' } })

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    await c({ collection: 'users', data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, name: 'Administrator', roles: ['admin'] } })
    console.log(`Cont de administrator: ${process.env.SEED_ADMIN_EMAIL}`)
  } else console.log('Niciun cont creat: deschide /admin și creează primul cont (devine administrator).')
  console.log('Gata. Conținut demonstrativ încărcat.')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
