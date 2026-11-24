// Monitorul prețurilor (Consiliul Concurenței): serviciul public folosit de aplicația web/mobilă, fără autentificare:
//   https://monitorulpreturilor.info/pmonsvc/Gas/GetUATByName?uatname=<oraș>          -> UAT-urile (Id, Name)
//   https://monitorulpreturilor.info/pmonsvc/Gas/GetGasItemsByUat?UatId=<id>&CSVGasCatalogProductIds=<id-uri>&OrderBy=price
// Format verificat din România pe 24.11.2026 (mostrele reale monitor-*.xml). Atentie: CSVGasCatalogProductIds accepta UN SINGUR
// id (11 benzina standard, 21 motorina standard, 31 GPL); „11,21,31” da eroare de server. robots.txt: 404 (fara reguli).
import { DOMParser } from 'linkedom'
import { laOraRO } from '../../site/timp'

type Nod = { k: string; v: string; c: Nod[] }
const loc = (s: string) => s.replace(/^.*:/, '').toLowerCase()

function arbore(text: string): Nod {
  const t = String(text || '').replace(/^﻿/, '').trim()
  if (t.startsWith('{') || t.startsWith('[')) {
    const conv = (k: string, o: unknown): Nod => {
      if (Array.isArray(o)) return { k: loc(k), v: '', c: o.map((x) => conv(k.replace(/s$/i, ''), x)) }
      if (o && typeof o === 'object') return { k: loc(k), v: '', c: Object.entries(o).map(([kk, vv]) => conv(kk, vv)) }
      return { k: loc(k), v: o == null ? '' : String(o), c: [] }
    }
    return conv('root', JSON.parse(t))
  }
  if (!t.startsWith('<')) throw new Error(`Monitorul prețurilor: răspuns neașteptat („${t.slice(0, 60)}”)`)
  const doc = new DOMParser().parseFromString(t, 'text/xml')
  if (/<html/i.test(t.slice(0, 300))) throw new Error('Monitorul prețurilor: a răspuns cu o pagină HTML, nu cu date (serviciul s-a mutat sau cere altceva).')
  type E = { tagName: string; children: ArrayLike<E>; textContent: string | null }
  const conv = (e: E): Nod => { const c = Array.from(e.children).map(conv); return { k: loc(e.tagName), v: c.length ? '' : (e.textContent || '').trim(), c } }
  return conv(doc.documentElement as unknown as E)
}
const toate = (n: Nod, f: (x: Nod) => boolean, out: Nod[] = []): Nod[] => { if (f(n)) out.push(n); for (const c of n.c) toate(c, f, out); return out }
const camp = (n: Nod, ...k: string[]) => { for (const x of k) { const c = n.c.find((y) => y.k === x); if (c) return c } return undefined }
const val = (n: Nod | undefined): string => (!n ? '' : n.v || (camp(n, 'name', 'addrstring', 'value')?.v ?? ''))

const fara = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-\s]+/g, ' ').trim()

/**
 * Raspunsul real GetUATByName (verificat 24.11.2026): <UATs><Items><UAT><Id>69900</Id><Name>Municipiul Craiova, Dolj</Name>…
 * Alegem UAT-ul „Municipiul <Oras>, <Judet>”; altfel unul care contine orasul si judetul.
 */
export function idUat(text: string, oras: string, judet?: string): string | null {
  const l = toate(arbore(text), (n) => n.k === 'uat' || (!!camp(n, 'id') && !!camp(n, 'name') && /municipiul|ora[sș]ul|comuna/i.test(val(camp(n, 'name')))))
  const fc = (x: string) => fara(x).replace(/-/g, ' ')
  const o = fc(oras), j = judet ? fc(judet) : ''
  const nume = (n: Nod) => fc(val(camp(n, 'name')))
  const g = l.find((n) => nume(n).startsWith(`municipiul ${o}`) && (!j || nume(n).endsWith(`, ${j}`)))
    || l.find((n) => nume(n).includes(o) && (!j || nume(n).includes(j)))
  return g ? val(camp(g, 'id')) || null : null
}

export type RandStatie = { judet: string; localitate: string; statie: string; retea: string; adresa: string; produs: string; pret: string; actualizat: string }

/** „24/11/2026 11:05 ” (ora Romaniei) -> ISO */
function dataMonitor(s: string): string {
  const m = String(s).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  return m ? laOraRO(`${m[3]}-${m[2]}-${m[1]}`, `${m[4]}:${m[5]}`).toISOString() : ''
}

/**
 * Raspunsul real GetGasItemsByUat (un singur produs pe cerere, verificat 24.11.2026):
 *   <GasItems xmlns="…pmonsvc.Models.Protos"><Products><GasProduct><Catprod><Id>11</Id><Name>Benzină standard</Name></Catprod>
 *     <Network><Name>LUKOIL România S.R.L.</Name></Network><Price>8.93</Price><Stationid>P202</Stationid></GasProduct>…</Products>
 *   <Stations><GasStation><Addr><Addrstring>B-dul Decebal, nr. 10</Addrstring><Uatid>69900</Uatid></Addr><Id>R1399</Id>
 *     <Name>28 CRAIOVA</Name><Network><Name>PETROM</Name></Network><Updatedate>24/11/2026 11:05 </Updatedate></GasStation>…
 * Pastram doar statiile din UAT-ul cerut si preturile actualizate in ultimele `maxOre` ore.
 */
export function statiiSiPreturi(text: string, judet: string, oras: string, opt: { uat?: string; acum?: Date; maxOre?: number } = {}): RandStatie[] {
  const r = arbore(text)
  if (r.k !== 'gasitems') throw new Error(`Monitorul prețurilor: aștept <GasItems>, am primit <${r.k}>; formatul s-a schimbat.`)
  const statii = new Map(toate(r, (n) => n.k === 'gasstation').map((n) => [val(camp(n, 'id')), n]))
  const acum = (opt.acum || new Date()).getTime(), max = (opt.maxOre ?? 72) * 3600e3
  const out: RandStatie[] = []
  for (const p of toate(r, (n) => n.k === 'gasproduct')) {
    const s = statii.get(val(camp(p, 'stationid')))
    if (!s) continue
    const adr = camp(s, 'addr')
    if (opt.uat && adr && val(camp(adr, 'uatid')) && val(camp(adr, 'uatid')) !== opt.uat) continue
    const actualizat = dataMonitor(val(camp(s, 'updatedate')))
    if (!actualizat || acum - Date.parse(actualizat) > max) continue
    const cat = camp(p, 'catprod')
    const retea = val(camp(camp(s, 'network') || { k: '', v: '', c: [] }, 'name')).replace(/\s*\b(Rom[aâ]nia|S\.?\s?R\.?\s?L\.?|S\.?\s?A\.?)(?=\s|$)\.?/gi, '').trim()
    const nume = val(camp(s, 'name'))
    out.push({
      judet, localitate: oras, statie: retea && !fara(nume).includes(fara(retea)) ? `${retea} ${nume}` : nume, retea: '',
      adresa: adr ? val(camp(adr, 'addrstring')) : '', produs: cat ? val(camp(cat, 'name')) : val(camp(p, 'name')), pret: val(camp(p, 'price')), actualizat,
    })
  }
  return out
}
