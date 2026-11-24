// Anunturi de intrerupere scrise ca text (apa, gaz): fluxul RSS al Companiei de Apa Oltenia
// (https://www.apaoltenia.ro/index.php/category/anunturi/feed/, verificat 24.11.2026) si pagini HTML cu anunturi.
// Exemplu real: „… anunță întreruperea alimentării cu apă potabilă Miercuri, 25.11.2026, în intervalul orar 10.00- 13.00
//   Zone afectate: – blocurile alimentate din PT Horezu – Hotel Militar …”. Pastram doar faptele: localitatea, zona, data, intervalul.
import { DOMParser } from 'linkedom'
import { judetDinNume, localitate } from '../geo'
import { D } from '../../shared/harta'
import { amprenta, dataPunct, textDinHtml } from '../text'
import type { Element } from '../tipuri'
import type { TipAvarie } from './avarii'

export type Anunt = { titlu: string; text: string; publicat: Date | null; link: string }

const RELEVANT = /lucr[aă]ri programate|întrerup|intrerup|oprire|oprit|avari|sistare|sist[aă]m|fără apă|fara apa|lips[aă] (de )?ap|reluare/i
const IRELEVANT = /anun[tț] mediu|proiect|licita|achizi|angaj|recrut|concurs|consiliul de administra|igienizare/i
const TITLU: Record<TipAvarie, string> = { power: 'Curent oprit', water: 'Apă oprită', gas: 'Gaz oprit' }
const ziSapt = (d: Date) => new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', weekday: 'long' }).format(d)
const ora = (d: Date) => new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)
const anRO = (d: Date) => Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric' }).format(d))

export function citesteRss(xml: string): Anunt[] {
  const doc = new DOMParser().parseFromString(String(xml || '').replace(/^﻿/, ''), 'text/xml')
  if (doc.documentElement?.tagName !== 'rss') throw new Error(`Fluxul RSS lipsește (rădăcina „${doc.documentElement?.tagName || 'lipsă'}”); verifică adresa sursei.`)
  return (Array.from(doc.getElementsByTagName('item')) as unknown as { getElementsByTagName(n: string): ArrayLike<{ textContent: string | null }> }[]).map((it) => {
    const t = (n: string) => it.getElementsByTagName(n)[0]?.textContent || ''
    const p = Date.parse(t('pubDate'))
    return { titlu: textDinHtml(t('title')), text: textDinHtml(t('content:encoded') || t('description')).replace(/\s*\[…\]\s*$|\s*\[&#8230;\]\s*$/, ''), publicat: Number.isFinite(p) ? new Date(p) : null, link: t('link').trim() }
  })
}

/** Un anunt -> 0..n intreruperi (un anunt poate avea mai multe zile). */
export function anuntInElemente(a: Anunt, tip: TipAvarie, opt: { acum: Date; prefix: string; judetImplicit: string; localitateImplicita: string }): Element[] {
  const tot = `${a.titlu}. ${a.text}`.replace(/\s+/g, ' ')
  if (!RELEVANT.test(tot) || IRELEVANT.test(a.titlu)) return []
  const an = anRO(a.publicat || opt.acum)
  const zile = [...tot.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g)].map((m) => `${m[1]}.${m[2]}.${m[3]}`)
  const ore = tot.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/)
  const loc = tot.match(/(?:municipiul|ora[sș]ul|comuna|localitatea|satul|din)\s+([A-ZĂÂÎȘŞȚŢ][a-zăâîșşțţ]+(?:[- ][A-ZĂÂÎȘŞȚŢ][a-zăâîșşțţ]+)?)/)
  const l = loc ? localitate(loc[1]) : null
  const oras = (l && D(l.nume)) || (loc && /municipiul|ora[sș]ul|comuna|localitatea|satul/.test(loc[0]) ? loc[1] : opt.localitateImplicita)
  const judet = l?.judet || judetDinNume(tot.match(/jude[tț]ul(?:ui)?\s+([A-ZĂÂÎȘŞȚŢ][a-zăâîșşțţ-]+)/)?.[1] || '') || opt.judetImplicit
  const zonaM = tot.match(/(?:Zone afectate|Zona afectat[aă]|zona cuprins[aă] [îi]n perimetrul str[aă]zilor|perimetrul str[aă]zilor|utilizatorii din zona(?: cuprins[aă] [îi]n perimetrul str[aă]zilor)?|str[aă]zile)\s*:?\s*[–-]?\s*(.+?)(?:(?<!\b(?:bd|str|nr|sos|al|cal|Bd|Str|Nr|Șos))\.\s+[A-ZĂÂÎȘŞȚŢ]|\s+(?:Echipele|Compania de|Ne cerem|V[aă] mul[tț]umim|Mul[tț]umim|Pe durata|Lucr[aă]rile|Reluarea)\b|$)/)
  const strada = tot.match(/(?:pe\s+)?(?:str\.|strada|bd\.|bulevardul|calea)\s+[A-ZĂÂÎȘŞȚŢ0-9][^,.;]+/i)
  const zona = (zonaM?.[1] || strada?.[0] || a.titlu).replace(/^[–\-\s]+/, '').slice(0, 300)
  const out: Element[] = []
  const lista = zile.length ? [...new Set(zile)] : ['']
  for (const zi of lista) {
    let de: Date | null, pana: Date | null
    if (zi && ore) { de = dataPunct(zi, `${ore[1]}:${ore[2]}`, an); pana = dataPunct(zi, `${ore[3]}:${ore[4]}`, an) }
    else if (zi) { de = dataPunct(zi, '00:00', an); pana = dataPunct(zi, '23:59', an) }
    else { de = a.publicat || opt.acum; pana = new Date(de.getTime() + 12 * 3600e3) } // avarie fara data: 12 ore de la publicare
    if (!de || !pana) continue
    if (pana <= de) pana = new Date(pana.getTime() + 864e5)
    if (pana.getTime() < opt.acum.getTime()) continue
    out.push({
      externalId: `${opt.prefix}:${amprenta(a.link || a.titlu, de.toISOString())}`,
      data: {
        kind: tip, title: zi ? `${TITLU[tip]} ${ziSapt(de)}, ${ore ? `${ora(de)}–${ora(pana)}` : 'toată ziua'}` : /avari/i.test(tot) ? 'Avarie anunțată' : TITLU[tip],
        area: zona, county: judet, city: oras, lat: l?.lat ?? null, lon: l?.lon ?? null, from: de.toISOString(), until: pana.toISOString(),
      },
    })
  }
  return out
}

/** Pagina HTML cu anunturi (fara RSS): fiecare paragraf / rand de tabel / articol cu o data devine un anunt. */
export function anunturiDinHtml(html: string, link: string): Anunt[] {
  const blocuri = textDinHtml(html).split(/\n+/).map((x) => x.trim()).filter((x) => x.length > 30 && /\d{1,2}\.\d{1,2}\.\d{4}/.test(x))
  return blocuri.map((b) => ({ titlu: b.slice(0, 120), text: b, publicat: null, link: `${link}#${amprenta(b)}` }))
}
