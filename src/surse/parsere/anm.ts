// ANM: avertizarile nationale (https://www.meteoromania.ro/avertizari-xml.php) si avertizarile nowcasting pe judete
// (https://www.meteoromania.ro/avertizari-nowcasting-xml.php). Formatul national, verificat pe 24.11.2026:
//   <avertizari><avertizare tipMesaj numeTipMesaj dataAparitiei="2026-11-24T10:00" dataExpirarii culoare numeCuloare
//      fenomeneVizate intervalul="24 noiembrie, ora 10 – 24 noiembrie, ora 20;" zonaAfectata catre mesaj="<html escapat>">
//     <judet cod="DJ" culoare="1" useCoordGis coordGis/> ... <zona cod="MH_munte_2" culoare="1" .../>
// culoare pe judet: 0 = neafectat, 1 = galben, 2 = portocaliu, 3 = rosu.
import { DOMParser } from 'linkedom'
import { JUDETE, judetDinCod } from '../geo'
import { amprenta, dataRomaneasca, textDinHtml } from '../text'
import { laOraRO } from '../../site/timp'
import type { Element } from '../tipuri'

const COD = ['', 'yellow', 'orange', 'red'] as const
const NUME: Record<string, string> = { yellow: 'galben', orange: 'portocaliu', red: 'roșu' }

/** Fenomenele, din text (ordinea conteaza: primele gasite apar primele) */
const FENOMENE: [RegExp, string][] = [
  [/viscol/i, 'ninsori viscolite'], [/ninsor|ninge/i, 'ninsoare'], [/polei|ghea[tț]/i, 'polei'], [/cea[tț][aă]/i, 'ceață'],
  [/vijeli|furtun/i, 'vijelii'], [/grindin/i, 'grindină'], [/averse|precipita[tț]ii|ploi/i, 'ploi'], [/v[aâ]nt/i, 'vânt'],
  [/canicul|disconfort termic|temperaturi ridicate/i, 'caniculă'], [/ger|temperaturi (foarte )?sc[aă]zute/i, 'ger'],
]
export function fenomene(text: string): string {
  const l: string[] = []
  for (const [re, n] of FENOMENE) if (re.test(text) && !l.includes(n)) l.push(n)
  if (l.includes('ninsori viscolite')) { const i = l.indexOf('ninsoare'); if (i >= 0) l.splice(i, 1) }
  const t = l.slice(0, 3)
  return t.length > 1 ? `${t.slice(0, -1).join(', ')} și ${t[t.length - 1]}` : t[0] || 'fenomene meteo periculoase'
}

const attr = (e: { getAttribute(n: string): string | null }, ...n: string[]) => { for (const x of n) { const v = e.getAttribute(x); if (v != null && v !== '') return v } return '' }

/** „2026-11-24T10:00” -> Date (ora Romaniei, cum o publica ANM) */
function isoRO(s: string): Date | null {
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/)
  return m ? laOraRO(m[1], `${m[2]}:${m[3]}`) : null
}

/** Intervalul „24 noiembrie, ora 20 – 25 noiembrie, ora 08;” -> [de la, pana la] */
export function interval(s: string, an: number): [Date | null, Date | null] {
  const p = String(s || '').split(/\s[–—-]\s|[–—]/)
  if (p.length < 2) return [null, null]
  let a = dataRomaneasca(p[0], an), b = dataRomaneasca(p[1], an)
  if (a && b && b < a) b = dataRomaneasca(p[1], an + 1) // decembrie -> ianuarie
  return [a, b]
}

function oraScurta(d: Date) {
  return new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)
}
function ziScurta(d: Date, acum: Date) {
  const f = (x: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(x)
  if (f(d) === f(acum)) return ''
  return new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', weekday: 'long' }).format(d) + ' '
}

export function parseazaAvertizari(xml: string, acum = new Date()): Element[] {
  const doc = new DOMParser().parseFromString(String(xml || '').replace(/^﻿/, ''), 'text/xml')
  const rad = doc.documentElement
  if (!rad || rad.tagName !== 'avertizari') throw new Error(`ANM: răspuns neașteptat (rădăcina „${rad?.tagName || 'lipsă'}”, aștept „avertizari”)`)
  const out: Element[] = []
  for (const a of Array.from(rad.getElementsByTagName('avertizare')) as unknown as Element_[]) {
    const emis = attr(a, 'dataAparitiei')
    const an = Number(emis.slice(0, 4)) || new Date(acum).getUTCFullYear()
    let [de, pana] = interval(attr(a, 'intervalul'), an)
    if (!de) de = isoRO(emis)
    if (!pana) pana = isoRO(attr(a, 'dataExpirarii'))
    const mesaj = textDinHtml(attr(a, 'mesaj'))
    const fv = attr(a, 'fenomeneVizate').replace(/;$/, '')
    // fenomenele: din atribut, daca e explicit; altfel din randurile „Fenomene vizate: …” ale mesajului; altfel din tot textul
    const dinMesaj = [...mesaj.matchAll(/Fenomene vizate:\s*(.+?)(?=\s+Zone afectate|\n|$)/g)].map((m) => m[1]).join(', ')
    const fen = fenomene(fv && !/conform textelor/i.test(fv) ? fv : dinMesaj || mesaj)
    // judetele pe culori (o avertizare poate avea si galben si portocaliu). Pe langa <judet> (tot judetul), ANM marcheaza
    // si zone partiale <zona cod="SJ_munte" / "CS_depresiune" / "MH_munte_2">: judetul este prefixul codului.
    const peCuloare = new Map<number, string[]>()
    const doarZone = new Map<string, Set<string>>() // judet -> tipurile de zona (munte, depresiune) cand nu e afectat tot judetul
    const adauga = (c: number, slug: string) => { if (!peCuloare.has(c)) peCuloare.set(c, []); if (!peCuloare.get(c)!.includes(slug)) peCuloare.get(c)!.push(slug) }
    for (const j of Array.from(a.getElementsByTagName('judet')) as unknown as Element_[]) {
      const c = Number(j.getAttribute('culoare')), slug = judetDinCod(j.getAttribute('cod') || '')
      if (slug && c >= 1 && c <= 3) { adauga(c, slug); doarZone.delete(slug) }
    }
    for (const z of Array.from(a.getElementsByTagName('zona')) as unknown as Element_[]) {
      const c = Number(z.getAttribute('culoare')), [cod, tip] = String(z.getAttribute('cod') || '').split('_')
      const slug = judetDinCod(cod)
      if (!slug || !(c >= 1 && c <= 3)) continue
      const intreg = (peCuloare.get(c) || []).includes(slug) && !doarZone.has(slug)
      adauga(c, slug)
      if (!intreg) { if (!doarZone.has(slug)) doarZone.set(slug, new Set()); doarZone.get(slug)!.add(tip || 'zona') }
    }
    for (const [c, judete] of peCuloare) {
      const code = COD[c]
      // „la munte” cand toate judetele acestei culori sunt afectate doar in zona montana
      const munte = judete.every((j) => doarZone.get(j) && [...doarZone.get(j)!].every((t) => t === 'munte'))
      const fenTxt = munte ? `${fen} la munte` : fen
      const cand = pana ? `, până ${ziScurta(pana, acum)}la ${oraScurta(pana)}` : ''
      const start = de && de > acum ? ` de ${ziScurta(de, acum)}la ${oraScurta(de)}` : ''
      out.push({
        externalId: `anm:${amprenta(attr(a, 'tipMesaj'), emis, attr(a, 'intervalul'), c)}`,
        data: {
          code, phenomenon: fen,
          text: `Cod ${NUME[code]} de ${fenTxt}${start}${start ? '' : cand}`,
          counties: judete.sort(),
          from: de ? de.toISOString() : null, until: pana ? pana.toISOString() : null,
        },
      })
    }
  }
  return out
}

type Element_ = { getAttribute(n: string): string | null; getElementsByTagName(n: string): ArrayLike<Element_>; tagName: string; textContent: string | null }

/**
 * Nowcasting (avertizari pe termen foarte scurt, pe judete). Cand nu exista avertizari raspunsul este `<avertizariNowcasting/>`
 * (verificat 24.11.2026). Structura unui element nu a putut fi observata in acea zi: parserul e tolerant si cauta atributele
 * uzuale (judet / cod, culoare / numeCuloare, dataInceput / dataSfarsit, fenomen / semnalare, zona / mesaj). De verificat la primul cod real.
 */
export function parseazaNowcasting(xml: string, acum = new Date()): Element[] {
  const doc = new DOMParser().parseFromString(String(xml || '').replace(/^﻿/, ''), 'text/xml')
  const rad = doc.documentElement
  if (!rad || rad.tagName !== 'avertizariNowcasting') throw new Error(`ANM nowcasting: rădăcina „${rad?.tagName || 'lipsă'}”`)
  const out: Element[] = []
  for (const a of Array.from(rad.children || []) as unknown as Element_[]) {
    const coduri = attr(a, 'judet', 'judete', 'codJudet', 'cod').split(/[,; ]+/).map(judetDinCod).filter(Boolean) as string[]
    const sub = (Array.from(a.getElementsByTagName('judet')) as unknown as Element_[]).map((j) => judetDinCod(j.getAttribute('cod') || j.textContent || '')).filter(Boolean) as string[]
    const judete = [...new Set([...coduri, ...sub])]
    const cul = attr(a, 'culoare', 'numeCuloare', 'cod_culoare').toLowerCase()
    const c = /ro[sș]u|^3$/.test(cul) ? 3 : /portocal|^2$/.test(cul) ? 2 : /galben|^1$/.test(cul) ? 1 : 0
    if (!judete.length || !c) continue
    const de = isoRO(attr(a, 'dataInceput', 'dataAparitiei', 'inceput')) || acum
    const pana = isoRO(attr(a, 'dataSfarsit', 'dataExpirarii', 'sfarsit'))
    const mesaj = textDinHtml(attr(a, 'mesaj', 'fenomen', 'semnalare') || a.textContent || '')
    const fen = fenomene(`${attr(a, 'fenomen', 'fenomeneVizate')} ${mesaj}`)
    const zona = textDinHtml(attr(a, 'zona', 'zonaAfectata')).slice(0, 160)
    const code = COD[c]
    out.push({
      externalId: `anm-now:${amprenta(judete.join(','), de.toISOString(), pana?.toISOString(), c, fen)}`,
      data: {
        code, phenomenon: fen,
        text: `Cod ${NUME[code]} imediat de ${fen}${pana ? `, până la ${oraScurta(pana)}` : ''}`,
        roads: zona ? `Zone: ${zona}` : '',
        counties: judete.sort(), from: de.toISOString(), until: (pana || new Date(de.getTime() + 3 * 3600e3)).toISOString(),
      },
    })
  }
  return out
}
