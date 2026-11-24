// Conectorii: cate unul pe sursa. Fiecare descarca, interpreteaza si intoarce documente normalizate;
// scrierea in baza (idempotenta, fara sa atinga ce a scris redactia) o face motorul (rulare.ts).
// Statutul legal si adresele sunt documentate in docs/fluxuri-date.md.
import { ziRO, ziPlus } from '../site/timp'
import { parseazaAvertizari, parseazaNowcasting } from './parsere/anm'
import { parseazaPZU } from './parsere/opcom'
import { parseazaCnair, parseazaInfotrafic } from './parsere/drumuri'
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
  legal: 'public_notice', pornitImplicit: true,
  url: 'https://www.politiaromana.ro/ro/info-trafic',
  termsUrl: 'https://www.politiaromana.ro/', atribuire: 'Poliția Română, Infotrafic',
  planificare: { laMinute: 15 }, frecventaText: 'la 15 minute',
  expiraLipsa: true, cerere: 'docs/cereri-acces/igpr-infotrafic.md',
  note: 'Comunicatele Centrului INFOTRAFIC (publice). Pagina-listă -> cel mai nou comunicat. Site-ul nu răspunde din afara României: adresa se verifică la prima rulare pe server. Cererea din docs/cereri-acces e opțională (pentru un flux structurat).',
  async ruleaza(c) {
    const html = await comunicat(c, /infotrafic|info[- ]?trafic|trafic(ul)? rutier|situa[tț]ia (traficului|drumurilor)/i, 'Poliția Română')
    if (html == null) return { elemente: [], neschimbat: true }
    const el = parseazaInfotrafic(html, c.acum)
    if (!el.length) throw new Error('Poliția Română: comunicatul nu conține nicio frază de forma „DN 1 Ploiești - Brașov: …”; formatul s-a schimbat.')
    return { elemente: el }
  },
}

export const CNAIR: Conector = {
  key: 'cnair-drumuri', name: 'CNAIR: drumuri închise, restricții, lucrări', collection: 'road-events',
  legal: 'public_notice', pornitImplicit: true,
  url: 'https://www.cnadnr.ro/ro',
  termsUrl: 'https://www.cnadnr.ro/', atribuire: 'CNAIR',
  planificare: { laMinute: 30 }, frecventaText: 'la 30 de minute',
  expiraLipsa: true, cerere: 'docs/cereri-acces/cnair-drumuri.md',
  note: 'Atenție: cnair.ro NU este site-ul companiei (e o firmă privată); CNAIR folosește cnadnr.ro. Pagina principală -> comunicatul despre drumuri închise / restricții. Site-ul nu răspunde din afara României: adresa se verifică la prima rulare.',
  async ruleaza(c) {
    const html = await comunicat(c, /drumuri (închise|inchise)|restric[tț]ii|infotrafic|info trafic|situa[tț]ia drumurilor|sectoare de drum/i, 'CNAIR')
    if (html == null) return { elemente: [], neschimbat: true }
    return { elemente: parseazaCnair(html, c.acum) }
  },
}

export const CARBURANTI: Conector = {
  key: 'carburanti-cc', name: 'Consiliul Concurenței: Monitorul prețurilor la carburanți', collection: 'fuel-prices',
  legal: 'public_notice', pornitImplicit: true,
  url: 'https://monitorulpreturilor.info/pmonsvc/Gas/', termsUrl: 'https://monitorulpreturilor.info/', atribuire: 'Consiliul Concurenței, Monitorul prețurilor',
  planificare: { zilnicDupa: '09:40', reincearcaMinute: 120, pana: '18:00' }, frecventaText: 'zilnic la 09:40 (și la cerere: npm run surse -- carburanti-cc)',
  expiraLipsa: false, cerere: 'docs/cereri-acces/consiliul-concurentei-carburanti.md',
  note: 'Serviciul public (fără autentificare) folosit de aplicația Monitorul prețurilor: o cerere pentru UAT-ul reședinței și una pentru prețuri, pe fiecare județ, o dată pe zi, cu pauză între cereri. Se păstrează doar media pe județ (din reședință) și cea mai ieftină stație. Nu răspunde din afara României: formatul se verifică la prima rulare.',
  async ruleaza(c) {
    const produse = process.env.SURSE_CARBURANTI_PRODUSE || '11,21,31'
    const randuri: Record<string, string>[] = []
    const erori: string[] = []
    for (const [slug, oras] of Object.entries(RESEDINTE)) {
      try {
        const u = await c.descarca(`${c.url}GetUATByName?uatname=${encodeURIComponent(oras.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())}`, { conditionat: false })
        verificaBlocaj(u.text, 'Monitorul prețurilor')
        const id = idUat(u.text, oras)
        if (!id) { erori.push(`${oras}: UAT negăsit`); continue }
        const p = await c.descarca(`${c.url}GetGasItemsByUat?UatId=${id}&CSVGasCatalogProductIds=${produse}&OrderBy=price`, { conditionat: false })
        randuri.push(...statiiSiPreturi(p.text, JUDETE[slug][1], oras))
      } catch (e) {
        erori.push(`${oras}: ${(e as Error).message}`)
        if (erori.length >= 3 && !randuri.length) throw new Error(`Monitorul prețurilor: ${erori.join(' | ')}`)
      }
      await new Promise((r) => setTimeout(r, c.pauzaMs ?? 1500))
    }
    if (erori.length) c.log(`fără date pentru ${erori.length} județe: ${erori.slice(0, 5).join(' | ')}`)
    return { elemente: parseazaCarburanti(randuri, c.acum) }
  },
}

export const AVARII_DEO: Conector = {
  key: 'avarii-deo', name: 'Distribuție Energie Oltenia: întreruperi programate (curent)', collection: 'outages',
  legal: 'public_notice', pornitImplicit: true, url: 'https://www.distributieoltenia.ro/ro/intreruperi-programate',
  termsUrl: 'https://www.distributieoltenia.ro/', atribuire: 'Distribuție Energie Oltenia',
  planificare: { laMinute: 360 }, frecventaText: 'la 6 ore (programul e săptămânal)', expiraLipsa: true,
  cerere: 'docs/cereri-acces/distributie-energie-oltenia.md',
  note: 'PDF-uri săptămânale pe județe („Lucrări pentru prevenire și corectare avarii”), citite cu poziția textului. La verificare (24.11.2026) pagina cerea validare anti-robot (cod 338) clienților automați: nu o ocolim, conectorul raportează blocajul în registru.',
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
  legal: 'public_notice', pornitImplicit: true, url: 'https://www.distrigazsud-retele.ro/clienti/utile-clienti/intreruperi-gaze-naturale/',
  termsUrl: 'https://www.distrigazsud-retele.ro/', atribuire: 'Distrigaz Sud Rețele',
  planificare: { laMinute: 60 }, frecventaText: 'la 60 de minute', expiraLipsa: true,
  cerere: 'docs/cereri-acces/distrigaz-sud-retele.md',
  note: 'Pagina publică „Întreruperi gaze naturale”. La verificare (24.11.2026) site-ul răspundea cu pagina de mentenanță „ePortalDGSR indisponibil” (404): formatul anunțurilor se verifică la prima rulare.',
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
