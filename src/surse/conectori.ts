// Conectorii: cate unul pe sursa. Fiecare descarca, interpreteaza si intoarce documente normalizate;
// scrierea in baza (idempotenta, fara sa atinga ce a scris redactia) o face motorul (rulare.ts).
// Statutul legal si adresele sunt documentate in docs/fluxuri-date.md.
import { ziRO, ziPlus } from '../site/timp'
import { parseazaAvertizari, parseazaNowcasting } from './parsere/anm'
import { parseazaPZU } from './parsere/opcom'
import { parseazaCnairRss, parseazaInfotrafic } from './parsere/drumuri'
import { parseazaCarburanti } from './parsere/carburanti'
import { parseazaAvarii } from './parsere/avarii'
import { randuriDinPdf } from './parsere/deo-pdf'
import { anuntInElemente, anunturiDinHtml, citesteRss } from './parsere/anunturi'
import { idUat, statiiSiPreturi } from './parsere/monitor'
import { parseazaTomtom } from './parsere/tomtom'
import { JUDETE, RESEDINTE, judetDinPunct } from './geo'
import { textDinHtml } from './text'
import { BLOCAJ } from './http'
import type { Conector, ContextRulare, Element, Rezultat } from './tipuri'


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

// ——— Anunturi publice preluate automat, cu atribuire (decizia editorului, 24.11.2026: statutul „public_notice”).
// Limite: robots.txt respectat, nicio ocolire de validare anti-robot / CAPTCHA / autentificare, frecventa mica, doar faptele.

/** Pagina sursei a raspuns cu o validare anti-robot / login: nu o ocolim, raportam clar in registru. */
export function verificaBlocaj(text: string, sursa: string) {
  if (BLOCAJ.test(String(text).slice(0, 4000))) {
    throw new Error(`${sursa}: pagina cere validare anti-robot (CAPTCHA). Nu o ocolim; datele lipsesc până când sursa permite accesul automat sau oferă un flux (vezi docs/cereri-acces/).`)
  }
}

/** Legaturile dintr-o pagina (absolute), al caror text sau adresa se potrivesc. */
export function linkuri(html: string, baza: string, re: RegExp): { url: string; text: string }[] {
  const out: { url: string; text: string }[] = []
  for (const m of String(html).matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = textDinHtml(m[2]).replace(/\s+/g, ' ').trim()
    let url: string
    try { url = new URL(m[1].replace(/&amp;/g, '&'), baza).toString() } catch { continue }
    if ((re.test(text) || re.test(decodeURIComponent(url))) && !out.some((o) => o.url === url)) out.push({ url, text })
  }
  return out
}

const ARE_DRUMURI = /(?:^|[\s>;(])(?:A|DN|DX)\s?\d{1,3}[A-Z]?\b/g

/** Pagina-lista -> comunicatul cel mai nou (prima legatura potrivita), daca pagina insasi nu e comunicatul. */
async function comunicat(c: ContextRulare, re: RegExp, sursa: string) {
  const r = await c.descarca(c.url)
  if (r.neschimbat) return null
  verificaBlocaj(r.text, sursa)
  if ((textDinHtml(r.text).match(ARE_DRUMURI) || []).length >= 3) return r.text
  const l = linkuri(r.text, c.url, re).filter((x) => new URL(x.url).host === new URL(c.url).host)
  if (!l.length) throw new Error(`${sursa}: pagina ${c.url} nu conține drumuri și nicio legătură către un comunicat de trafic; adresa sau formatul s-au schimbat.`)
  const d = await c.descarca(l[0].url, { conditionat: false })
  verificaBlocaj(d.text, sursa)
  return d.text
}

export const IGPR: Conector = {
  key: 'igpr-infotrafic', name: 'Poliția Română: Infotrafic (comunicate trafic)', collection: 'road-events',
  legal: 'needs_permission', pornitImplicit: false,
  url: 'https://www.politiaromana.ro/ro/info-trafic',
  termsUrl: 'https://politiaromana.ro/robots.txt', atribuire: 'Poliția Română, Infotrafic',
  planificare: { laMinute: 15 }, frecventaText: 'la 15 minute',
  expiraLipsa: true, cerere: 'docs/cereri-acces/igpr-infotrafic.md',
  note: 'OPRIT: robots.txt al politiaromana.ro (verificat din România, 24.11.2026) este „User-agent: * / Disallow: / / Allow: /index.php”, deci accesul automat la /ro/info-trafic este interzis. Nu îl ocolim (nici prin /index.php). Calea: cererea din docs/cereri-acces/igpr-infotrafic.md (flux RSS/JSON). Parserul pentru comunicate e gata.',
  async ruleaza(c) {
    const html = await comunicat(c, /infotrafic|info[- ]?trafic|trafic(ul)? rutier|situa[tț]ia (traficului|drumurilor)/i, 'Poliția Română')
    if (html == null) return { elemente: [], neschimbat: true }
    const el = parseazaInfotrafic(html, c.acum)
    if (!el.length) throw new Error('Poliția Română: comunicatul nu conține nicio frază de forma „DN 1 Ploiești - Brașov: …”; formatul s-a schimbat.')
    return { elemente: el }
  },
}

export const CNAIR: Conector = {
  key: 'cnair-drumuri', name: 'CNAIR: drumuri închise, restricții, lucrări (comunicate RSS)', collection: 'road-events',
  legal: 'public_notice', pornitImplicit: true,
  url: 'https://www.cnadnr.ro/ro/comunicare/comunicate-de-presa/rss',
  termsUrl: 'https://www.cnadnr.ro/robots.txt', atribuire: 'CNAIR',
  planificare: { laMinute: 30 }, frecventaText: 'la 30 de minute',
  expiraLipsa: true, cerere: 'docs/cereri-acces/cnair-drumuri.md',
  note: 'Fluxul RSS oficial al comunicatelor CNAIR (verificat din România, 24.11.2026). robots.txt permite, cu Crawl-delay: 10 (respectat). Se păstrează doar comunicatele despre închideri / restricții / lucrări; fiecare rămâne 7 zile de la început, un „redeschide” mai nou îl anulează. Atenție: cnair.ro e altă firmă.',
  async ruleaza(c) {
    const r = await c.descarca(c.url, { accept: 'application/rss+xml,application/xml' })
    if (r.neschimbat) return { elemente: [], neschimbat: true }
    verificaBlocaj(r.text, 'CNAIR')
    return { elemente: parseazaCnairRss(r.text, c.acum) }
  },
}

export const CARBURANTI: Conector = {
  key: 'carburanti-cc', name: 'Consiliul Concurenței: Monitorul prețurilor la carburanți', collection: 'fuel-prices',
  legal: 'public_notice', pornitImplicit: true,
  url: 'https://monitorulpreturilor.info/pmonsvc/Gas/', termsUrl: 'https://monitorulpreturilor.info/', atribuire: 'Consiliul Concurenței, Monitorul prețurilor',
  planificare: { zilnicDupa: '09:40', reincearcaMinute: 120, pana: '18:00' }, frecventaText: 'zilnic la 09:40 (și la cerere: npm run surse -- carburanti-cc)',
  expiraLipsa: false, cerere: 'docs/cereri-acces/consiliul-concurentei-carburanti.md',
  note: 'Serviciul public al aplicației Monitorul prețurilor (fără autentificare; robots.txt: 404, fără reguli), format verificat din România pe 24.11.2026. Pe județ: UAT-ul reședinței (o dată, apoi ținut minte) și câte o cerere pe produs (11 benzină, 21 motorină, 31 GPL; serviciul nu acceptă mai multe id-uri odată), cu pauză între cereri. Se păstrează doar media pe județ (stațiile din reședință, actualizate în ultimele 72 h) și cea mai ieftină stație.',
  async ruleaza(c) {
    const produse = (process.env.SURSE_CARBURANTI_PRODUSE || '11,21,31').split(/[,\s]+/).filter((x) => /^\d+$/.test(x))
    const randuri: Record<string, string>[] = []
    const erori: string[] = []
    const pauza = () => new Promise((r) => setTimeout(r, c.pauzaMs ?? 1500))
    for (const [slug, oras] of Object.entries(RESEDINTE)) {
      const judet = JUDETE[slug][1]
      try {
        let id = c.memorie[`uat:${slug}`]
        if (!id) {
          // serviciul cauta exact: „Piatra-Neamț” are cratima, deci incercam si varianta cu cratima
          const nume = oras.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
          for (const v of nume.includes(' ') ? [nume, nume.replace(/ /g, '-')] : [nume]) {
            const u = await c.descarca(`${c.url}GetUATByName?uatname=${encodeURIComponent(v)}`, { conditionat: false })
            verificaBlocaj(u.text, 'Monitorul prețurilor')
            id = idUat(u.text, oras, slug === 'bucuresti' ? undefined : judet) || ''
            if (id) break
            await pauza()
          }
          if (!id) { erori.push(`${oras}: UAT negăsit`); continue }
          c.memorie[`uat:${slug}`] = id
          await pauza()
        }
        for (const p of produse) {
          const r = await c.descarca(`${c.url}GetGasItemsByUat?UatId=${id}&CSVGasCatalogProductIds=${p}&OrderBy=price`, { conditionat: false })
          randuri.push(...statiiSiPreturi(r.text, judet, oras, { uat: id, acum: c.acum, maxOre: 72 }))
          await pauza()
        }
      } catch (e) {
        erori.push(`${oras}: ${(e as Error).message}`)
        if (erori.length >= 3 && !randuri.length) throw new Error(`Monitorul prețurilor: ${erori.join(' | ')}`)
      }
    }
    if (erori.length) c.log(`fără date pentru ${erori.length} județe: ${erori.slice(0, 5).join(' | ')}`)
    return { elemente: parseazaCarburanti(randuri, c.acum, 72) }
  },
}

export const AVARII_DEO: Conector = {
  key: 'avarii-deo', name: 'Distribuție Energie Oltenia: întreruperi programate (curent)', collection: 'outages',
  legal: 'needs_permission', pornitImplicit: false, url: 'https://www.distributieoltenia.ro/ro/intreruperi-programate',
  termsUrl: 'https://www.distributieoltenia.ro/', atribuire: 'Distribuție Energie Oltenia',
  planificare: { laMinute: 360 }, frecventaText: 'la 6 ore (programul e săptămânal)', expiraLipsa: true,
  cerere: 'docs/cereri-acces/distributie-energie-oltenia.md',
  note: 'OPRIT: pagina cere validare anti-robot (cod 338) / răspunde „Blocked” clienților automați (24.11.2026). Nu o ocolim. Calea: cererea din docs/cereri-acces/distributie-energie-oltenia.md. Parserul PDF-urilor săptămânale („Lucrări pentru prevenire și corectare avarii”) e gata și testat pe un PDF real.',
  async ruleaza(c) {
    const r = await c.descarca(c.url)
    if (r.neschimbat) return { elemente: [], neschimbat: true }
    verificaBlocaj(r.text, 'Distribuție Energie Oltenia')
    const pdf = linkuri(r.text, c.url, /\.pdf$|lucr[aă]ri.*(prevenire|avarii)|intrerup/i).filter((x) => /\.pdf(\?|$)/i.test(x.url)).slice(0, 14)
    if (!pdf.length) throw new Error('Distribuție Energie Oltenia: nicio legătură PDF cu programul întreruperilor pe pagină; formatul s-a schimbat.')
    const randuri: Record<string, string>[] = []
    for (const l of pdf) {
      const d = await c.descarca(l.url, { binar: true, conditionat: false })
      const t = await randuriDinPdf(d.bytes!)
      randuri.push(...t.randuri.map((x) => ({ ...x, judet: x.judet || '' })))
      await new Promise((res) => setTimeout(res, c.pauzaMs ?? 1500))
    }
    return { elemente: parseazaAvarii(randuri, 'power', { acum: c.acum, prefix: 'avarii-deo' }) }
  },
}

export const AVARII_APA: Conector = {
  key: 'avarii-apa-oltenia', name: 'Compania de Apă Oltenia: opriri și avarii (apă)', collection: 'outages',
  legal: 'public_notice', pornitImplicit: true, url: 'https://www.apaoltenia.ro/index.php/category/anunturi/feed/',
  termsUrl: 'https://www.apaoltenia.ro/', atribuire: 'Compania de Apă Oltenia',
  planificare: { laMinute: 60 }, frecventaText: 'la 60 de minute', expiraLipsa: true,
  cerere: 'docs/cereri-acces/compania-de-apa-oltenia.md',
  note: 'Fluxul RSS public al anunțurilor (WordPress), verificat pe 24.11.2026; robots.txt permite. Din fiecare anunț se păstrează localitatea, zona, data și intervalul.',
  async ruleaza(c) {
    const r = await c.descarca(c.url, { accept: 'application/rss+xml,application/xml' })
    if (r.neschimbat) return { elemente: [], neschimbat: true }
    return { elemente: citesteRss(r.text).flatMap((a) => anuntInElemente(a, 'water', { acum: c.acum, prefix: 'avarii-apa-oltenia', judetImplicit: 'dolj', localitateImplicita: 'Craiova' })) }
  },
}

export const AVARII_GAZ: Conector = {
  key: 'avarii-distrigaz-sud', name: 'Distrigaz Sud Rețele: întreruperi (gaz)', collection: 'outages',
  legal: 'needs_permission', pornitImplicit: false, url: 'https://www.distrigazsud-retele.ro/clienti/utile-clienti/intreruperi-gaze-naturale/',
  termsUrl: 'https://www.distrigazsud-retele.ro/', atribuire: 'Distrigaz Sud Rețele',
  planificare: { laMinute: 60 }, frecventaText: 'la 60 de minute', expiraLipsa: true,
  cerere: 'docs/cereri-acces/distrigaz-sud-retele.md',
  note: 'OPRIT: pagina „Întreruperi gaze naturale” e un formular interactiv (trimite la /wp-content/themes/distrigaz/templates/special/opriri/opriri_ws_requests.php date legate de sesiune); nu reproducem cereri legate de sesiune. robots.txt permite. Cerem un flux structurat: docs/cereri-acces/distrigaz-sud-retele.md.',
  async ruleaza(c) {
    const r = await c.descarca(c.url)
    if (r.neschimbat) return { elemente: [], neschimbat: true }
    verificaBlocaj(r.text, 'Distrigaz Sud Rețele')
    if (/ePortalDGSR sunt momentan indisponibile/i.test(r.text)) throw new Error('Distrigaz Sud Rețele: site-ul afișează pagina de mentenanță (ePortalDGSR indisponibil).')
    if (!/[îi]ntrerup|gaze naturale/i.test(textDinHtml(r.text))) throw new Error('Distrigaz Sud Rețele: pagina nu mai vorbește despre întreruperi de gaze; adresa sau formatul s-au schimbat.')
    const anunturi = anunturiDinHtml(r.text, c.url)
    return { elemente: anunturi.flatMap((a) => anuntInElemente(a, 'gas', { acum: c.acum, prefix: 'avarii-distrigaz-sud', judetImplicit: 'bucuresti', localitateImplicita: 'București' })) }
  },
}


// ——— Trafic in timp real: TomTom Traffic, „Incident Details” (API cu licenta, cheie proprie in .env: TOMTOM_API_KEY).
// Un dreptunghi de cerere are cel mult 10.000 km²: Romania se acopera cu ~36 de dreptunghiuri (doar cele care ating tara).
// Planul gratuit: 2.500 de cereri pe zi -> o rulare la 25 de minute (~2.100 de cereri pe zi). Cu plata: TOMTOM_MINUTE=5..60.
export function grilaRomania(): [number, number, number, number][] {
  const out: [number, number, number, number][] = []
  const H = 0.95
  for (let lat = 43.6; lat < 48.3; lat += H) {
    const mij = lat + H
    const W = 9500 / (111.32 * H * 111.32 * Math.cos((mij * Math.PI) / 180))
    for (let lon = 20.2; lon < 29.8; lon += W) {
      let atinge = false
      for (let i = 0; i <= 6 && !atinge; i++) for (let j = 0; j <= 6 && !atinge; j++) if (judetDinPunct(lon + (W * i) / 6, lat + (H * j) / 6)) atinge = true
      if (atinge) out.push([+lon.toFixed(3), +lat.toFixed(3), +(lon + W).toFixed(3), +(lat + H).toFixed(3)])
    }
  }
  return out
}
const MINUTE_TOMTOM = Math.min(60, Math.max(5, Number(process.env.TOMTOM_MINUTE) || 25))
const CAMPURI_V5 = '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,startTime,endTime,from,to,length,delay,roadNumbers}}}'

export const TOMTOM: Conector = {
  key: 'tomtom-trafic', name: 'TomTom Traffic: incidente de trafic în timp real (accidente, cozi, drumuri închise)', collection: 'road-events',
  legal: 'partner_api', pornitImplicit: true, api: true, cheieMediu: 'TOMTOM_API_KEY',
  url: 'https://api.tomtom.com/maps/orbis/traffic/incidents/details',
  termsUrl: 'https://www.tomtom.com/legal/', atribuire: 'TomTom Traffic',
  planificare: { laMinute: MINUTE_TOMTOM }, frecventaText: `la ${MINUTE_TOMTOM} de minute (planul gratuit TomTom: 2.500 de cereri pe zi)`,
  expiraLipsa: true,
  note: 'API cu licență, cont și cheie proprii (developer.tomtom.com). Se păstrează doar incidentele utile cititorului: drumuri închise, accidente, polei/inundații, cozi de peste 5 minute, lucrări și vehicule defecte pe autostrăzi și drumuri naționale. Atribuire obligatorie: „TomTom”. Condițiile de afișare și păstrare a datelor se verifică în contractul TomTom înainte de lansarea publică.',
  async ruleaza(c) {
    const cheieApi = process.env.TOMTOM_API_KEY || ''
    const grila = grilaRomania()
    const minIntarziere = Number(process.env.TOMTOM_MIN_INTARZIERE) || 5
    // Orbis v2 (cheia in antet); daca cheia nu are acces la Orbis, API-ul clasic v5 (cheia in adresa, nepastrata in registru)
    let varianta: 'orbis' | 'v5' = (c.memorie.tomtomVarianta as 'orbis' | 'v5') || 'orbis'
    const cere = async (b: number[]) => {
      if (varianta === 'orbis') {
        return c.descarca(`${c.url}?apiVersion=2&bbox=${b.join(',')}&timeValidity=present`, { conditionat: false, accept: 'application/json', antete: { 'TomTom-Api-Key': cheieApi, 'TomTom-Api-Version': '2' } })
      }
      return c.descarca(`https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${b.join(',')}&fields=${encodeURIComponent(CAMPURI_V5)}&timeValidityFilter=present&key=${encodeURIComponent(cheieApi)}`, { conditionat: false, accept: 'application/json' })
    }
    const vazute = new Map<string, Element>()
    let erori = 0, prima = ''
    for (const [i, b] of grila.entries()) {
      try {
        let r
        try { r = await cere(b) } catch (e) {
          if (i === 0 && varianta === 'orbis' && /HTTP (400|401|403|404)/.test((e as Error).message)) { varianta = 'v5'; r = await cere(b) } else throw e
        }
        for (const el of parseazaTomtom(r.text, c.acum, { minIntarziere, valabilOre: Math.max(1, (MINUTE_TOMTOM * 2.5) / 60) })) vazute.set(el.externalId, el)
      } catch (e) {
        erori++; prima ||= (e as Error).message
        if (i === 0 && /HTTP (401|403)/.test(prima)) throw new Error(`TomTom refuză cheia (${prima}). Verifică TOMTOM_API_KEY din .env și că în contul TomTom e activ „Traffic API”.`)
        if (erori >= 5 && vazute.size === 0) throw new Error(`TomTom: ${erori} cereri eșuate la rând; ultima: ${prima}`)
      }
      await new Promise((r) => setTimeout(r, c.pauzaMs ?? 300))
    }
    c.memorie.tomtomVarianta = varianta
    // o problema la cateva dreptunghiuri nu trebuie sa stearga de pe harta incidentele lor: marcam rularea ca incompleta
    if (erori) c.log(`${erori} din ${grila.length} zone nu au răspuns (${prima}); incidentele lor rămân până la rularea următoare`)
    return { elemente: [...vazute.values()], ...(erori ? { incomplet: `${erori} zone fără răspuns` } : {}) }
  },
}

export const CONECTORI: Conector[] = [ANM, OPCOM, TOMTOM, IGPR, CNAIR, CARBURANTI, AVARII_DEO, AVARII_APA, AVARII_GAZ]
export const conector = (key: string) => CONECTORI.find((c) => c.key === key) || null
