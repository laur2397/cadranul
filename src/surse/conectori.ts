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
import { JUDETE, RESEDINTE } from './geo'
import { textDinHtml } from './text'
import { BLOCAJ } from './http'
import type { Conector, ContextRulare, Rezultat } from './tipuri'


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

export const CONECTORI: Conector[] = [ANM, OPCOM, IGPR, CNAIR, CARBURANTI, AVARII_DEO, AVARII_APA, AVARII_GAZ]
export const conector = (key: string) => CONECTORI.find((c) => c.key === key) || null
