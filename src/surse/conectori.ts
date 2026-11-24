// Conectorii: cate unul pe sursa. Fiecare descarca, interpreteaza si intoarce documente normalizate;
// scrierea in baza (idempotenta, fara sa atinga ce a scris redactia) o face motorul (rulare.ts).
// Statutul legal si adresele sunt documentate in docs/fluxuri-date.md.
import { ziRO, ziPlus } from '../site/timp'
import { parseazaAvertizari, parseazaNowcasting } from './parsere/anm'
import { parseazaPZU } from './parsere/opcom'
import { parseazaCnair, parseazaInfotrafic } from './parsere/drumuri'
import { parseazaCarburanti } from './parsere/carburanti'
import { parseazaAvarii, type TipAvarie } from './parsere/avarii'
import type { Conector, ContextRulare, Rezultat } from './tipuri'

const faraAdresa = (c: ContextRulare) => {
  if (!c.url) throw new Error('Adresa fluxului nu este configurată (o primești odată cu acordul sursei; se completează în /admin › Surse de date).')
}

export const ANM: Conector = {
  key: 'anm-avertizari', name: 'ANM: avertizări meteo (coduri pe județe)', collection: 'weather-alerts',
  legal: 'public_official', pornitImplicit: true,
  url: 'https://www.meteoromania.ro/avertizari-xml.php',
  termsUrl: 'https://www.meteoromania.ro/', atribuire: 'ANM',
  planificare: { laMinute: 10 }, frecventaText: 'la 10 minute',
  expiraLipsa: true,
  note: 'Flux XML public al ANM (avertizări naționale) + nowcasting pe județe. robots.txt permite. Se citează „Sursa: ANM”.',
  async ruleaza(c) {
    const nat = await c.descarca(c.url, { accept: 'application/xml,text/xml' })
    const nowUrl = c.url.replace('avertizari-xml.php', 'avertizari-nowcasting-xml.php')
    const now = nowUrl !== c.url ? await c.descarca(nowUrl, { accept: 'application/xml,text/xml' }) : null
    // daca ambele raspund 304, nimic nou; altfel avem nevoie de ambele (expirarea se face pe tot setul)
    if (nat.neschimbat && (!now || now.neschimbat)) return { elemente: [], neschimbat: true }
    const natT = nat.neschimbat ? (await c.descarca(c.url, { conditionat: false })).text : nat.text
    const nowT = now ? (now.neschimbat ? (await c.descarca(nowUrl, { conditionat: false })).text : now.text) : ''
    const el = parseazaAvertizari(natT, c.acum)
    if (nowT) { try { el.push(...parseazaNowcasting(nowT, c.acum)) } catch (e) { c.log(`nowcasting ignorat: ${(e as Error).message}`) } }
    return { elemente: el }
  },
}

export const OPCOM: Conector = {
  key: 'opcom-pzu', name: 'OPCOM: prețul energiei pe ore (PZU, ziua următoare)', collection: 'energy-prices',
  legal: 'public_official', pornitImplicit: true,
  url: 'https://www.opcom.ro/rapoarte-pzu-raportPIP-export-csv/{DD}/{MM}/{YYYY}/ro',
  termsUrl: 'https://www.opcom.ro/', atribuire: 'OPCOM',
  planificare: { zilnicDupa: '13:15', reincearcaMinute: 20, pana: '23:30' }, frecventaText: 'zilnic după 13:15, reîncercare la 20 de minute până apar prețurile de mâine',
  expiraLipsa: false,
  note: 'Raport public PIP (export CSV), rezoluție 15 minute din 2025: se păstrează cele 96 de valori, site-ul arată media pe oră. robots.txt permite.',
  async ruleaza(c) {
    const azi = ziRO(c.acum)
    const el: Rezultat['elemente'] = []
    let incomplet: string | undefined
    for (const zi of [azi, ziPlus(azi, 1)]) {
      const [y, m, d] = zi.split('-')
      const url = c.url.replace('{DD}', d).replace('{MM}', m).replace('{YYYY}', y)
      const r = await c.descarca(url, { conditionat: false, accept: 'text/csv,*/*' })
      const p = parseazaPZU(r.text, zi)
      if (!p) { if (zi !== azi) incomplet = `prețurile pentru ${zi} nu sunt încă publicate`; continue }
      el.push({ externalId: `opcom:${zi}`, data: { day: zi, values: p.values.join(', '), quarterValues: p.quarter.join(', ') } })
    }
    return { elemente: el, incomplet }
  },
}

export const IGPR: Conector = {
  key: 'igpr-infotrafic', name: 'Poliția Română: Infotrafic (comunicate trafic)', collection: 'road-events',
  legal: 'needs_permission', pornitImplicit: false,
  url: 'https://www.politiaromana.ro/ro/info-trafic',
  termsUrl: 'https://www.politiaromana.ro/', atribuire: 'Poliția Română, Infotrafic',
  planificare: { laMinute: 15 }, frecventaText: 'la 15 minute',
  expiraLipsa: true, cerere: 'docs/cereri-acces/igpr-infotrafic.md',
  note: 'Comunicatele Infotrafic sunt publice, dar site-ul nu publică termeni de reutilizare automată și nici robots.txt accesibil la verificare; cerem un flux structurat (RSS/JSON). Adresa paginii se confirmă odată cu răspunsul.',
  async ruleaza(c) { faraAdresa(c); const r = await c.descarca(c.url); return r.neschimbat ? { elemente: [], neschimbat: true } : { elemente: parseazaInfotrafic(r.text, c.acum) } },
}

export const CNAIR: Conector = {
  key: 'cnair-drumuri', name: 'CNAIR: drumuri închise, restricții, lucrări', collection: 'road-events',
  legal: 'needs_permission', pornitImplicit: false,
  url: 'https://www.cnadnr.ro/',
  termsUrl: 'https://www.cnadnr.ro/', atribuire: 'CNAIR',
  planificare: { laMinute: 15 }, frecventaText: 'la 15 minute',
  expiraLipsa: true, cerere: 'docs/cereri-acces/cnair-drumuri.md',
  note: 'Atenție: cnair.ro NU este site-ul companiei (e o firmă privată); CNAIR folosește cnadnr.ro. Harta și comunicatele nu au termeni de reutilizare; cerem acces la fluxul hărții (dispecerat) sau un export.',
  async ruleaza(c) { faraAdresa(c); const r = await c.descarca(c.url); return r.neschimbat ? { elemente: [], neschimbat: true } : { elemente: parseazaCnair(r.text, c.acum) } },
}

export const CARBURANTI: Conector = {
  key: 'carburanti-cc', name: 'Consiliul Concurenței: Monitorul prețurilor la carburanți', collection: 'fuel-prices',
  legal: 'needs_permission', pornitImplicit: false,
  url: '', termsUrl: 'https://monitorulpreturilor.info/', atribuire: 'Consiliul Concurenței, Monitorul prețurilor',
  planificare: { zilnicDupa: '09:40', reincearcaMinute: 60, pana: '18:00' }, frecventaText: 'zilnic la 09:40 (și la cerere: npm run surse -- carburanti-cc)',
  expiraLipsa: false, cerere: 'docs/cereri-acces/consiliul-concurentei-carburanti.md',
  note: 'Platforma nu publică o licență de reutilizare și nu răspunde din afara României; agregatorii europeni o tratează drept „fără licență”. Cerem un export zilnic (CSV/JSON) pe stații.',
  async ruleaza(c) { faraAdresa(c); const r = await c.descarca(c.url); return r.neschimbat ? { elemente: [], neschimbat: true } : { elemente: parseazaCarburanti(r.text, c.acum) } },
}

function avarii(key: string, name: string, tip: TipAvarie, atribuire: string, termsUrl: string, cerere: string, note: string): Conector {
  return {
    key, name, collection: 'outages', legal: 'needs_permission', pornitImplicit: false, url: '', termsUrl, atribuire,
    planificare: { laMinute: 60 }, frecventaText: 'la 60 de minute', expiraLipsa: true, cerere, note,
    async ruleaza(c) { faraAdresa(c); const r = await c.descarca(c.url); return r.neschimbat ? { elemente: [], neschimbat: true } : { elemente: parseazaAvarii(r.text, tip, { acum: c.acum, prefix: key }) } },
  }
}
export const AVARII_DEO = avarii('avarii-deo', 'Distribuție Energie Oltenia: întreruperi programate (curent)', 'power', 'Distribuție Energie Oltenia', 'https://www.distributieoltenia.ro/',
  'docs/cereri-acces/distributie-energie-oltenia.md', 'Publică săptămânal, pe județe, PDF-uri „Lucrări pentru prevenire și corectare avarii”. Fără termeni de reutilizare; cerem un export CSV/JSON.')
export const AVARII_APA = avarii('avarii-apa-oltenia', 'Compania de Apă Oltenia: opriri și avarii (apă)', 'water', 'Compania de Apă Oltenia', 'https://www.apaoltenia.ro/',
  'docs/cereri-acces/compania-de-apa-oltenia.md', 'Anunțuri pe site și în presă, fără format structurat. Cerem un flux CSV/JSON.')
export const AVARII_GAZ = avarii('avarii-distrigaz-sud', 'Distrigaz Sud Rețele: întreruperi (gaz)', 'gas', 'Distrigaz Sud Rețele', 'https://www.distrigazsud-retele.ro/',
  'docs/cereri-acces/distrigaz-sud-retele.md', 'Comunicate de presă (DOCX) pe site. Cerem un flux CSV/JSON.')

export const CONECTORI: Conector[] = [ANM, OPCOM, IGPR, CNAIR, CARBURANTI, AVARII_DEO, AVARII_APA, AVARII_GAZ]
export const conector = (key: string) => CONECTORI.find((c) => c.key === key) || null
